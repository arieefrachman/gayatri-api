const prisma = require("../lib/prisma");

async function getAll(_req, res, next) {
  try {
    const items = await prisma.service.findMany({ where: { status: true }, orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await prisma.service.findMany({ orderBy: { sort: "asc" } });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, description, icon, sort, status } = req.body;
    const item = await prisma.service.create({
      data: {
        title,
        description,
        icon: icon || null,
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
    const { title, description, icon, sort, status } = req.body;
    const item = await prisma.service.update({
      where: { id },
      data: {
        title,
        description,
        icon: icon || null,
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
    await prisma.service.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
