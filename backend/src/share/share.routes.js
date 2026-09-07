// share/share.routes.js
const router = require("express").Router();
const { protect } = require("../shared/middleware/authMiddleware");
const { getPublicShare, generateCalendarShare, revokeCalendarShare } = require("./share.controller");

router.get("/share/:token", getPublicShare); // public
router.post("/calendar-share/generate", protect, generateCalendarShare); // protected
router.post("/calendar-share/revoke", protect, revokeCalendarShare);     // protected

module.exports = router;