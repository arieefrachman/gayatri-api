const { Router } = require("express");
const c = require("../controllers/teamsController");
const auth = require("../middleware/auth");
const { uploadImage } = require("../middleware/upload");

const router = Router();

router.get("/", c.getAll);
router.get("/admin", auth, c.adminGetAll);
router.post("/admin", auth, uploadImage.single("photo"), c.adminCreate);
router.put("/admin/:id", auth, uploadImage.single("photo"), c.adminUpdate);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
