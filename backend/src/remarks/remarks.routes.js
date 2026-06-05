const router = require("express").Router();
const { protect } = require("../shared/middleware/authMiddleware");
const upload = require("../shared/upload");
const { addRemark, getRemarksByMeeting } = require("./remarks.controller");

router.use(protect);
router.post("/", upload.single("attachment"), addRemark);
router.get("/meeting/:meetingId", getRemarksByMeeting);

module.exports = router;
