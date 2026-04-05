const prisma = require("../lib/prisma");
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
    const where = { status: true };
    if (req.query.category) where.category = req.query.category;

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, title: true, slug: true, excerpt: true,
          coverImage: true, author: true, category: true,
          tags: true, publishedAt: true, createdAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);
    res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const item = await prisma.post.findFirst({ where: { slug: req.params.slug, status: true } });
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

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, title: true, slug: true, author: true,
          category: true, status: true, publishedAt: true, createdAt: true,
          coverImage: true,
        },
      }),
      prisma.post.count(),
    ]);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
}

async function adminGetOne(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.post.findUnique({ where: { id } });
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
    while (await prisma.post.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    const coverImage = req.file
      ? await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "blog")
      : null;

    const published = status !== undefined ? Boolean(JSON.parse(status)) : false;

    const item = await prisma.post.create({
      data: {
        title,
        slug,
        content: content || "",
        excerpt: excerpt || null,
        coverImage,
        author: author || "Admin",
        category: category || null,
        tags: tags || null,
        status: published,
        publishedAt: published ? new Date() : null,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, slug: rawSlug, content, excerpt, author, category, tags, status } = req.body;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    let coverImage = existing.coverImage;
    if (req.file) {
      await deleteFromR2(existing.coverImage);
      coverImage = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "blog");
    }

    let slug = rawSlug ? slugify(rawSlug) : existing.slug;
    if (slug !== existing.slug) {
      const conflict = await prisma.post.findFirst({ where: { slug, NOT: { id } } });
      if (conflict) return res.status(422).json({ error: "Slug already in use" });
    }

    const published = status !== undefined ? Boolean(JSON.parse(status)) : existing.status;
    const publishedAt = published && !existing.publishedAt ? new Date() : existing.publishedAt;

    const item = await prisma.post.update({
      where: { id },
      data: {
        title: title || existing.title,
        slug,
        content: content !== undefined ? content : existing.content,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        coverImage,
        author: author || existing.author,
        category: category !== undefined ? category : existing.category,
        tags: tags !== undefined ? tags : existing.tags,
        status: published,
        publishedAt,
      },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.post.findUnique({ where: { id } });
    if (existing) await deleteFromR2(existing.coverImage);
    await prisma.post.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, adminGetAll, adminGetOne, adminCreate, adminUpdate, adminDelete };
