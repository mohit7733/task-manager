const router = require("express").Router();
const { register, login, me, updateSettings } = require("./auth.controller");
const { protect } = require("../shared/middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/settings", protect, updateSettings);

module.exports = router;
