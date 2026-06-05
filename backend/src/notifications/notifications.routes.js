const router = require("express").Router();
const { protect } = require("../shared/middleware/authMiddleware");
const { listNotifications, markRead } = require("./notifications.controller");

router.use(protect);
router.get("/", listNotifications);
router.patch("/:id/read", markRead);

module.exports = router;
