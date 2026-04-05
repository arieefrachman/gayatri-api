const db = require("../lib/db");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(_req, res, next) {
  try {
    const items = await db("partners").where({ status: true }).orderBy("sort", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await db("partners").orderBy("sort", "asc");
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
    const [id] = await db("partners").insert({
      name,
      logo,
      website: website || null,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      updatedAt: new Date(),
    });
    const item = await db("partners").where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { name, website, sort, status } = req.body;
    const existing = await db("partners").where({ id }).first();
    if (!existing) return res.status(404).json({ error: "Not found" });

    let logo = existing.logo;
    if (req.file) {
      await deleteFromR2(existing.logo);
      logo = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "partners");
    }

    const data = {
      name,
      logo,
      website: website || null,
      sort: parseInt(sort) || 0,
      updatedAt: new Date(),
    };
    if (status !== undefined) data.status = Boolean(JSON.parse(status));
    await db("partners").where({ id }).update(data);
    const item = await db("partners").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await db("partners").where({ id }).first();
    if (existing) await deleteFromR2(existing.logo);
    await db("partners").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
