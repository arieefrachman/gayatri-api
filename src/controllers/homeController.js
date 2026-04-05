const prisma = require("../lib/prisma");

async function getHome(_req, res, next) {
  try {
    const [pageContent, services, portfolios, testimonials, partners, teams, sliders] =
      await Promise.all([
        prisma.pageContent.findUnique({ where: { slug: "mainDashboard" } }),
        prisma.service.findMany({ where: { status: true }, orderBy: { sort: "asc" } }),
        prisma.portfolio.findMany({
          where: { status: true },
          orderBy: { sort: "asc" },
          include: { images: true },
        }),
        prisma.testimonial.findMany({ where: { status: true }, orderBy: { createdAt: "desc" } }),
        prisma.partner.findMany({ where: { status: true }, orderBy: { sort: "asc" } }),
        prisma.team.findMany({ where: { status: true }, orderBy: { sort: "asc" } }),
        prisma.slider.findMany({ where: { status: true, sliderTypeId: 2 }, orderBy: { sort: "asc" } }),
      ]);

    res.json({ pageContent, services, portfolios, testimonials, partners, teams, sliders });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome };
