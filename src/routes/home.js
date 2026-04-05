const { Router } = require("express");
const { getHome } = require("../controllers/homeController");

const router = Router();
router.get("/", getHome);
module.exports = router;
