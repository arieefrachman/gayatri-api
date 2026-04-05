const db = require("../lib/db");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function getAll(req, res, next) {
  try {
    const where = { status: true };
    if (req.query.type) where.slider_type_id = parseInt(req.query.type);
    const items = await db("sliders").where(where).orderBy("sort", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const where = {};
    if (req.query.type) where.slider_type_id = parseInt(req.query.type);
    const items = await db("sliders").where(where).orderBy("sort", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, sliderTypeId, sort, status } = req.body;
    if (!req.file) return res.status(422).json({ error: "Image is required" });
    const [id] = await db("sliders").insert({
      title: title || null,
      image: await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "sliders"),
      slider_type_id: parseInt(sliderTypeId),
      sort: parseInt(sort) || 0,
      status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      updatedAt: new Date(),
    });
    const item = await db("sliders").where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, sliderTypeId, sort, status } = req.body;
    const existing = await db("sliders").where({ id }).first();
    if (!existing) return res.status(404).json({ error: "Not found" });

    let image = existing.image;
    if (req.file) {
      await deleteFromR2(existing.image);
      image = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, "sliders");
    }

    const data = {
      title: title || null,
      image,
      updatedAt: new Date(),
    };
    if (sliderTypeId) data.slider_type_id = parseInt(sliderTypeId);
    if (sort !== undefined) data.sort = parseInt(sort);
    if (status !== undefined) data.status = Boolean(JSON.parse(status));
    await db("sliders").where({ id }).update(data);
    const item = await db("sliders").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await db("sliders").where({ id }).first();
    if (existing) await deleteFromR2(existing.image);
    await db("sliders").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
