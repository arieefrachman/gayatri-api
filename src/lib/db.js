const knex = require("knex")({
  client: "mysql2",
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  postProcessResponse: (result) => {
    const boolFields = ["status", "isBig", "isThumb", "isRead"];
    const colMap = {
      slider_type_id: "sliderTypeId",
      cover_image: "coverImage",
      published_at: "publishedAt",
    };

    const process = (row) => {
      if (typeof row !== "object" || row === null) return row;
      for (const f of boolFields) {
        if (f in row) row[f] = Boolean(row[f]);
      }
      for (const [from, to] of Object.entries(colMap)) {
        if (from in row) {
          row[to] = row[from];
          delete row[from];
        }
      }
      return row;
    };

    if (Array.isArray(result)) return result.map(process);
    return process(result);
  },
});

module.exports = knex;
