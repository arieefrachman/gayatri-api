const { Router } = require("express");
const c = require("../controllers/pageContentsController");
const auth = require("../middleware/auth");

const router = Router();

router.get("/", c.getAll);
router.get("/:slug", c.getBySlug);
router.put("/admin/:slug", auth, c.adminUpsert);
router.delete("/admin/:slug", auth, c.adminDelete);

module.exports = router;
