const db = require("../lib/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES = "7d";

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ error: "Email and password required" });
    }

    const admin = await db("admin_users").where({ email }).first();
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json(req.admin);
}

module.exports = { login, me };
