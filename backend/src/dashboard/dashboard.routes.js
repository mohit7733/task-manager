const router = require("express").Router();
const { protect } = require("../shared/middleware/authMiddleware");
const { getDashboard } = require("./dashboard.controller");

router.use(protect);
router.get("/", getDashboard);

module.exports = router;
