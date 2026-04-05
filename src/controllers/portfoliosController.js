const prisma = require("../lib/prisma");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await prisma.portfolio.findMany({
      where: { status: true },
      orderBy: { sort: "asc" },
      include: { images: true },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.portfolio.findUnique({ where: { id }, include: { images: true } });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await prisma.portfolio.findMany({
      orderBy: { sort: "asc" },
      include: { images: true },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, type, description, sort, status } = req.body;
    const portfolio = await prisma.portfolio.create({
      data: {
        title,
        type,
        description,
        sort: parseInt(sort) || 0,
        status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      },
    });

    if (req.files && req.files.length > 0) {
      const uploaded = await Promise.all(
        req.files.map((f) => uploadToR2(f.buffer, f.originalname, f.mimetype, "portfolios"))
      );
      await prisma.portfolioImage.createMany({
        data: uploaded.map((url, idx) => ({
          portfolioId: portfolio.id,
          path: url,
          isBig: idx === 0,
          isThumb: idx === 1,
        })),
      });
    }

    const result = await prisma.portfolio.findUnique({
      where: { id: portfolio.id },
      include: { images: true },
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, type, description, sort, status } = req.body;

    await prisma.portfolio.update({
      where: { id },
      data: {
        title,
        type,
        description,
        sort: parseInt(sort) || 0,
        status: status !== undefined ? Boolean(JSON.parse(status)) : undefined,
      },
    });

    if (req.files && req.files.length > 0) {
      const oldImages = await prisma.portfolioImage.findMany({ where: { portfolioId: id } });
      await Promise.all(oldImages.map((img) => deleteFromR2(img.path)));
      await prisma.portfolioImage.deleteMany({ where: { portfolioId: id } });

      const uploaded = await Promise.all(
        req.files.map((f) => uploadToR2(f.buffer, f.originalname, f.mimetype, "portfolios"))
      );
      await prisma.portfolioImage.createMany({
        data: uploaded.map((url, idx) => ({
          portfolioId: id,
          path: url,
          isBig: idx === 0,
          isThumb: idx === 1,
        })),
      });
    }

    const result = await prisma.portfolio.findUnique({ where: { id }, include: { images: true } });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const images = await prisma.portfolioImage.findMany({ where: { portfolioId: id } });
    await Promise.all(images.map((img) => deleteFromR2(img.path)));
    await prisma.portfolio.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, adminGetAll, adminCreate, adminUpdate, adminDelete };
