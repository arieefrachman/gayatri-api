const prisma = require("../lib/prisma");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await prisma.team.findMany({ where: { status: true }, orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await prisma.team.findMany({ orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { name, role, bio, sort, status } = req.body;
    const photo = req.file
      ? await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "teams")
      : null;
    const item = await prisma.team.create({
      data: {
        name,
        role,
        bio: bio || null,
        photo,
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
    const { name, role, bio, sort, status } = req.body;
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    let photo = existing.photo;
    if (req.file) {
      await deleteFromR2(existing.photo);
      photo = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "teams");
    }

    const item = await prisma.team.update({
      where: { id },
      data: {
        name,
        role,
        bio: bio || null,
        photo,
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
    const existing = await prisma.team.findUnique({ where: { id } });
    if (existing) await deleteFromR2(existing.photo);
    await prisma.team.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
