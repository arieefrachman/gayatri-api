const db = require("../lib/db");

async function getBySlug(req, res, next) {
  try {
    const item = await db("page_contents").where({ slug: req.params.slug }).first();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function getAll(_req, res, next) {
  try {
    const items = await db("page_contents").orderBy("slug", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminUpsert(req, res, next) {
  try {
    const { slug } = req.params;
    const { title, subtitle, description } = req.body;
    const existing = await db("page_contents").where({ slug }).first();
    if (existing) {
      await db("page_contents").where({ slug }).update({
        title,
        subtitle: subtitle || null,
        description: description || null,
        updatedAt: new Date(),
      });
    } else {
      await db("page_contents").insert({
        slug,
        title,
        subtitle: subtitle || null,
        description: description || null,
        updatedAt: new Date(),
      });
    }
    const item = await db("page_contents").where({ slug }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await db("page_contents").where({ slug: req.params.slug }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBySlug, getAll, adminUpsert, adminDelete };
