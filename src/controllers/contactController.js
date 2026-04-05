const prisma = require("../lib/prisma");
const { validationResult } = require("express-validator");

async function submit(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const { name, email, phone, subject, message } = req.body;
    const item = await prisma.contactSubmission.create({
      data: { name, email, phone: phone || null, subject, message },
    });
    res.status(201).json({ message: "Message sent", id: item.id });
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.contactSubmission.count(),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

async function adminMarkRead(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.contactSubmission.update({ where: { id }, data: { isRead: true } });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await prisma.contactSubmission.delete({ where: { id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, adminGetAll, adminMarkRead, adminDelete };
