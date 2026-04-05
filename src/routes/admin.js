const { Router } = require("express");
const c = require("../controllers/adminController");
const auth = require("../middleware/auth");

const router = Router();

router.post("/login", c.login);
router.get("/me", auth, c.me);

module.exports = router;
