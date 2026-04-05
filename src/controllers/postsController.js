const db = require("../lib/db");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const query = db("posts").where({ status: true });
    const countQuery = db("posts").where({ status: true });
    if (req.query.category) {
      query.andWhere({ category: req.query.category });
      countQuery.andWhere({ category: req.query.category });
    }

    const [items, [{ total }]] = await Promise.all([
      query
        .orderBy("published_at", "desc")
        .offset(skip)
        .limit(limit)
        .select("id", "title", "slug", "excerpt", "cover_image", "author", "category", "tags", "published_at", "createdAt"),
      countQuery.count("* as total"),
    ]);
    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const item = await db("posts").where({ slug: req.params.slug, status: true }).first();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [items, [{ total }]] = await Promise.all([
      db("posts")
        .orderBy("createdAt", "desc")
        .offset(skip)
        .limit(limit)
        .select("id", "title", "slug", "author", "category", "status", "published_at", "createdAt", "cover_image"),
      db("posts").count("* as total"),
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
}

async function adminGetOne(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const item = await db("posts").where({ id }).first();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, content, excerpt, author, category, tags, status } = req.body;

    const base = slugify(title);
    let slug = base;
    let suffix = 0;
    while (await db("posts").where({ slug }).first()) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    const coverImage = req.file
      ? await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "blog")
      : null;

    const published = status !== undefined ? Boolean(JSON.parse(status)) : false;

    const [id] = await db("posts").insert({
      title,
      slug,
      content: content || "",
      excerpt: excerpt || null,
      cover_image: coverImage,
      author: author || "Admin",
      category: category || null,
      tags: tags || null,
      status: published,
      published_at: published ? new Date() : null,
      updatedAt: new Date(),
    });
    const item = await db("posts").where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, slug: rawSlug, content, excerpt, author, category, tags, status } = req.body;

    const existing = await db("posts").where({ id }).first();
    if (!existing) return res.status(404).json({ error: "Not found" });

    let coverImage = existing.coverImage;
    if (req.file) {
      await deleteFromR2(existing.coverImage);
      coverImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "blog");
    }

    let slug = rawSlug ? slugify(rawSlug) : existing.slug;
    if (slug !== existing.slug) {
      const conflict = await db("posts").where({ slug }).whereNot({ id }).first();
      if (conflict) return res.status(422).json({ error: "Slug already in use" });
    }

    const published = status !== undefined ? Boolean(JSON.parse(status)) : existing.status;
    const publishedAt = published && !existing.publishedAt ? new Date() : existing.publishedAt;

    await db("posts").where({ id }).update({
      title: title || existing.title,
      slug,
      content: content !== undefined ? content : existing.content,
      excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
      cover_image: coverImage,
      author: author || existing.author,
      category: category !== undefined ? category : existing.category,
      tags: tags !== undefined ? tags : existing.tags,
      status: published,
      published_at: publishedAt,
      updatedAt: new Date(),
    });
    const item = await db("posts").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await db("posts").where({ id }).first();
    if (existing) await deleteFromR2(existing.coverImage);
    await db("posts").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, adminGetAll, adminGetOne, adminCreate, adminUpdate, adminDelete };
