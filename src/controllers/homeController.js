const db = require("../lib/db");

async function getHome(_req, res, next) {
  try {
    const [pageContent, services, portfolios, testimonials, partners, teams, sliders] =
      await Promise.all([
        db("page_contents").where({ slug: "mainDashboard" }).first(),
        db("services").where({ status: true }).orderBy("sort", "asc"),
        db("portfolios").where({ status: true }).orderBy("sort", "asc"),
        db("testimonials").where({ status: true }).orderBy("createdAt", "desc"),
        db("partners").where({ status: true }).orderBy("sort", "asc"),
        db("teams").where({ status: true }).orderBy("sort", "asc"),
        db("sliders").where({ status: true, slider_type_id: 2 }).orderBy("sort", "asc"),
      ]);

    if (portfolios.length) {
      const ids = portfolios.map((p) => p.id);
      const images = await db("portfolio_images").whereIn("portfolioId", ids);
      for (const p of portfolios) {
        p.images = images.filter((img) => img.portfolioId === p.id);
      }
    }

    res.json({ pageContent, services, portfolios, testimonials, partners, teams, sliders });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome };
