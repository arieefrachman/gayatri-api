const { Router } = require("express");
const { body } = require("express-validator");
const c = require("../controllers/contactController");
const auth = require("../middleware/auth");

const router = Router();

const submitValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 characters"),
];

router.post("/", submitValidation, c.submit);

router.get("/admin", auth, c.adminGetAll);
router.patch("/admin/:id/read", auth, c.adminMarkRead);
router.delete("/admin/:id", auth, c.adminDelete);

module.exports = router;
