const { Router } = require("express");
const c = require("../controllers/servicesController");
const auth = require("../middleware/auth");

const router = Router();

router.get("/", c.getAll);
router.get("/admin", auth, c.adminGetAll);
router.post("/admin", auth, c.adminCreate);
router.put("/admin/:id", auth, c.adminUpdate);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
