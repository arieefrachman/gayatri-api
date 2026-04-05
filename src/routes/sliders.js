const { Router } = require("express");
const c = require("../controllers/slidersController");
const auth = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");

const router = Router();

router.get("/", c.getAll);
router.get("/admin", auth, c.adminGetAll);
router.post("/admin", auth, uploadImage.single("image"), c.adminCreate);
router.put("/admin/:id", auth, uploadImage.single("image"), c.adminUpdate);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
