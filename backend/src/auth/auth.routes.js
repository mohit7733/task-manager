const router = require("express").Router();
const { register, login, me } = require("./auth.controller");
const { protect } = require("../shared/middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

module.exports = router;
