const { Router } = require("express");
const c = require("../controllers/postsController");
const auth = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");

const router = Router();

router.get("/", c.getAll);
router.get("/admin/all", auth, c.adminGetAll);
router.get("/admin/:id(\\d+)", auth, c.adminGetOne);
router.get("/:slug", c.getOne);
router.post("/admin", auth, uploadImage.single("coverImage"), c.adminCreate);
router.put("/admin/:id", auth, uploadImage.single("coverImage"), c.adminUpdate);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
