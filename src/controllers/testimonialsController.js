const db = require("../lib/db");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await db("testimonials").where({ status: true }).orderBy("createdAt", "desc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await db("testimonials").orderBy("createdAt", "desc");
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
    const [id] = await db("testimonials").insert({
      name,
      role,
      text,
      avatar,
      status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      updatedAt: new Date(),
    });
    const item = await db("testimonials").where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, role, text, status } = req.body;
    const existing = await db("testimonials").where({ id }).first();
    if (!existing) return res.status(404).json({ error: "Not found" });

    let avatar = existing.avatar;
    if (req.file) {
      await deleteFromR2(existing.avatar);
      avatar = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "testimonials");
    }

    const data = {
      name,
      role,
      text,
      avatar,
      updatedAt: new Date(),
    };
    if (status !== undefined) data.status = Boolean(JSON.parse(status));
    await db("testimonials").where({ id }).update(data);
    const item = await db("testimonials").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await db("testimonials").where({ id }).first();
    if (existing) await deleteFromR2(existing.avatar);
    await db("testimonials").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
