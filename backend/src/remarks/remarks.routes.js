const router = require("express").Router();
const { protect } = require("../shared/middleware/authMiddleware");
const upload = require("../shared/upload");
const { addRemark, getRemarksByMeeting, updateRemark, deleteRemark } = require("./remarks.controller");

router.use(protect);
router.post("/", upload.single("attachment"), addRemark);
router.get("/meeting/:meetingId", getRemarksByMeeting);
router.put("/:id", upload.single("attachment"), updateRemark);
router.delete("/:id", deleteRemark);

module.exports = router;
