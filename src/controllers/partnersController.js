const prisma = require("../lib/prisma");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await prisma.partner.findMany({ where: { status: true }, orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await prisma.partner.findMany({ orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { name, website, sort, status } = req.body;
    const logo = req.file
      ? await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "partners")
      : null;
    const item = await prisma.partner.create({
      data: {
        name,
        logo,
        website: website || null,
        sort: parseInt(sort) || 0,
        status: status !== undefined ? Boolean(JSON.parse(status)) : true,
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
    const { name, website, sort, status } = req.body;
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    let logo = existing.logo;
    if (req.file) {
      await deleteFromR2(existing.logo);
      logo = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "partners");
    }

    const item = await prisma.partner.update({
      where: { id },
      data: {
        name,
        logo,
        website: website || null,
        sort: parseInt(sort) || 0,
        status: status !== undefined ? Boolean(JSON.parse(status)) : undefined,
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
    const existing = await prisma.partner.findUnique({ where: { id } });
    if (existing) await deleteFromR2(existing.logo);
    await prisma.partner.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
