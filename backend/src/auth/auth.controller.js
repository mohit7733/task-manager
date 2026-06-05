const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user.model");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
}

async function register(req, res) {
  const { name, email, password, role, coo_id } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role, coo_id });
  res.status(201).json({ token: signToken(user._id), user: { ...user.toObject(), password: undefined } });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ token: signToken(user._id), user: { ...user.toObject(), password: undefined } });
}

function me(req, res) {
  res.json(req.user);
}

async function updateSettings(req, res) {
  const { email_notifications_enabled, reminder_lead_hours } = req.body;
  const update = {};
  if (typeof email_notifications_enabled === "boolean") {
    update.email_notifications_enabled = email_notifications_enabled;
  }
  if (reminder_lead_hours !== undefined && reminder_lead_hours !== null) {
    const hours = Number(reminder_lead_hours);
    if (!Number.isNaN(hours) && hours >= 0) update.reminder_lead_hours = hours;
  }
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-password");
  res.json(user);
}

module.exports = { register, login, me, updateSettings };
