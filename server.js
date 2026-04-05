require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ── CORS ──────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsers ─────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────
app.use("/api/home", require("./src/routes/home"));
app.use("/api/services", require("./src/routes/services"));
app.use("/api/portfolios", require("./src/routes/portfolios"));
app.use("/api/testimonials", require("./src/routes/testimonials"));
app.use("/api/partners", require("./src/routes/partners"));
app.use("/api/teams", require("./src/routes/teams"));
app.use("/api/contact", require("./src/routes/contact"));
app.use("/api/sliders", require("./src/routes/sliders"));
app.use("/api/page-contents", require("./src/routes/pageContents"));
app.use("/api/posts", require("./src/routes/posts"));
app.use("/api/admin", require("./src/routes/admin"));

// ── R2 media proxy ────────────────────────────
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("./src/lib/r2");
app.get("/api/media/*", async (req, res) => {
  const key = req.params[0];
  if (!key) return res.status(400).json({ error: "Missing key" });
  try {
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
    );
    res.setHeader("Content-Type", obj.ContentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (obj.ContentLength) res.setHeader("Content-Length", obj.ContentLength);
    obj.Body.pipe(res);
  } catch (e) {
    if (e.name === "NoSuchKey") return res.status(404).json({ error: "Not found" });
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

// ── 404 handler ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ─────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Gayatri API running on http://localhost:${PORT}`);
});
