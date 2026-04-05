const db = require("../lib/db");
const { validationResult } = require("express-validator");

async function submit(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const { name, email, phone, subject, message } = req.body;
    const [id] = await db("contact_submissions").insert({
      name, email, phone: phone || null, subject, message,
    });
    res.status(201).json({ message: "Message sent", id });
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const [items, [{ total }]] = await Promise.all([
      db("contact_submissions").orderBy("createdAt", "desc").offset(skip).limit(limit),
      db("contact_submissions").count("* as total"),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

async function adminMarkRead(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await db("contact_submissions").where({ id }).update({ isRead: true });
    const item = await db("contact_submissions").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await db("contact_submissions").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, adminGetAll, adminMarkRead, adminDelete };
