const { Router } = require("express");
const c = require("../controllers/portfoliosController");
const auth = require("../middleware/auth");
const { uploadImages } = require("../middleware/upload");

const router = Router();

router.get("/", c.getAll);
router.get("/admin/all", auth, c.adminGetAll);
router.get("/:id", c.getOne);
router.post("/admin", auth, uploadImages.array("images", 10), c.adminCreate);
router.put("/admin/:id", auth, uploadImages.array("images", 10), c.adminUpdate);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
