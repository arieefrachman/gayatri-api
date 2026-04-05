const db = require("../lib/db");
const { uploadToR2, deleteFromR2 } = require("../lib/uploadToR2");

async function withImages(portfolios) {
  if (!portfolios.length) return portfolios;
  const ids = portfolios.map((p) => p.id);
  const images = await db("portfolio_images").whereIn("portfolioId", ids);
  for (const p of portfolios) {
    p.images = images.filter((img) => img.portfolioId === p.id);
  }
  return portfolios;
}

async function getAll(_req, res, next) {
  try {
    const items = await db("portfolios").where({ status: true }).orderBy("sort", "asc");
    await withImages(items);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const item = await db("portfolios").where({ id }).first();
    if (!item) return res.status(404).json({ error: "Not found" });
    item.images = await db("portfolio_images").where({ portfolioId: id });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function adminGetAll(_req, res, next) {
  try {
    const items = await db("portfolios").orderBy("sort", "asc");
    await withImages(items);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const { title, type, description, sort, status } = req.body;
    const [portfolioId] = await db("portfolios").insert({
      title,
      type,
      description,
      sort: parseInt(sort) || 0,
      status: status !== undefined ? Boolean(JSON.parse(status)) : true,
      updatedAt: new Date(),
    });

    if (req.files && req.files.length > 0) {
      const uploaded = await Promise.all(
        req.files.map((f) => uploadToR2(f.buffer, f.originalname, f.mimetype, "portfolios"))
      );
      await db("portfolio_images").insert(
        uploaded.map((url, idx) => ({
          portfolioId,
          path: url,
          isBig: idx === 0,
          isThumb: idx === 1,
        }))
      );
    }

    const result = await db("portfolios").where({ id: portfolioId }).first();
    result.images = await db("portfolio_images").where({ portfolioId });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, type, description, sort, status } = req.body;

    const data = {
      title,
      type,
      description,
      sort: parseInt(sort) || 0,
      updatedAt: new Date(),
    };
    if (status !== undefined) data.status = Boolean(JSON.parse(status));
    await db("portfolios").where({ id }).update(data);

    if (req.files && req.files.length > 0) {
      const oldImages = await db("portfolio_images").where({ portfolioId: id });
      await Promise.all(oldImages.map((img) => deleteFromR2(img.path)));
      await db("portfolio_images").where({ portfolioId: id }).del();

      const uploaded = await Promise.all(
        req.files.map((f) => uploadToR2(f.buffer, f.originalname, f.mimetype, "portfolios"))
      );
      await db("portfolio_images").insert(
        uploaded.map((url, idx) => ({
          portfolioId: id,
          path: url,
          isBig: idx === 0,
          isThumb: idx === 1,
        }))
      );
    }

    const result = await db("portfolios").where({ id }).first();
    result.images = await db("portfolio_images").where({ portfolioId: id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function adminDelete(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const images = await db("portfolio_images").where({ portfolioId: id });
    await Promise.all(images.map((img) => deleteFromR2(img.path)));
    await db("portfolios").where({ id }).del();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getOne, adminGetAll, adminCreate, adminUpdate, adminDelete };
