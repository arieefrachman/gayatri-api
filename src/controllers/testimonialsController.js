const prisma = require("../lib/prisma");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await prisma.testimonial.findMany({
      where: { status: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { name, role, text, status } = req.body;
    const avatar = req.file
      ? await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "testimonials")
      : null;
    const item = await prisma.testimonial.create({
      data: {
        name,
        role,
        text,
        avatar,
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
    const { name, role, text, status } = req.body;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    let avatar = existing.avatar;
    if (req.file) {
      await deleteFromR2(existing.avatar);
      avatar = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "testimonials");
    }

    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        name,
        role,
        text,
        avatar,
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
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (existing) await deleteFromR2(existing.avatar);
    await prisma.testimonial.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
