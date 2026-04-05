const prisma = require("../lib/prisma");

async function getBySlug(req, res, next) {
  try {
    const item = await prisma.pageContent.findUnique({ where: { slug: req.params.slug } });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function getAll(_req, res, next) {
  try {
    const items = await prisma.pageContent.findMany({ orderBy: { slug: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminUpsert(req, res, next) {
  try {
    const { slug } = req.params;
    const { title, subtitle, description } = req.body;
    const item = await prisma.pageContent.upsert({
      where: { slug },
      update: { title, subtitle: subtitle || null, description: description || null },
      create: { slug, title, subtitle: subtitle || null, description: description || null },
    });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    await prisma.pageContent.delete({ where: { slug: req.params.slug } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBySlug, getAll, adminUpsert, adminDelete };
