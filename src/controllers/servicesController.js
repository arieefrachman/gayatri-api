const db = require("../lib/db");

async function getAll(_req, res, next) {
  try {
    const items = await db("services").where({ status: true }).orderBy("sort", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await db("services").orderBy("sort", "asc");
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, description, icon, sort, status } = req.body;
    const [id] = await db("services").insert({
      title,
      description,
      icon: icon || null,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      updatedAt: new Date(),
    });
    const item = await db("services").where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, description, icon, sort, status } = req.body;
    const data = {
      title,
      description,
      icon: icon || null,
      sort: parseInt(sort) || 0,
      updatedAt: new Date(),
    };
    if (status !== undefined) data.status = Boolean(JSON.parse(status));
    await db("services").where({ id }).update(data);
    const item = await db("services").where({ id }).first();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await db("services").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, adminGetAll, adminCreate, adminUpdate, adminDelete };
