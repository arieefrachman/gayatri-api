const prisma = require("../lib/prisma");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(req, res, next) {
  try {
    const where = { status: true };
    if (req.query.type) where.sliderTypeId = parseInt(req.query.type);
    const items = await prisma.slider.findMany({ where, orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const where = {};
    if (req.query.type) where.sliderTypeId = parseInt(req.query.type);
    const items = await prisma.slider.findMany({ where, orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, sliderTypeId, sort, status } = req.body;
    if (!req.file) return res.status(422).json({ error: "Image is required" });
    const item = await prisma.slider.create({
      data: {
        title: title || null,
        image: await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "sliders"),
        sliderTypeId: parseInt(sliderTypeId),
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
    const { title, sliderTypeId, sort, status } = req.body;
    const existing = await prisma.slider.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    let image = existing.image;
    if (req.file) {
      await deleteFromR2(existing.image);
      image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "sliders");
    }

    const item = await prisma.slider.update({
      where: { id },
      data: {
        title: title || null,
        image,
        sliderTypeId: sliderTypeId ? parseInt(sliderTypeId) : undefined,
        sort: sort !== undefined ? parseInt(sort) : undefined,
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
    const existing = await prisma.slider.findUnique({ where: { id } });
    if (existing) await deleteFromR2(existing.image);
    await prisma.slider.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
