const router = require("express").Router();
const {
  listMeetings,
  createMeeting,
  updateMeeting,
  getMeetingTimeline,
  getCalendarEvents,
  removeMeeting
} = require("./meetings.controller");
const { protect } = require("../shared/middleware/authMiddleware");
const upload = require("../shared/upload");

router.use(protect);
router.get("/", listMeetings);
router.get("/calendar-events", getCalendarEvents);
router.post("/", upload.array("attachments", 10), createMeeting);
router.put("/:id", upload.array("attachments", 10), updateMeeting);
router.get("/:id/timeline", getMeetingTimeline);
router.delete("/:id", removeMeeting);

module.exports = router;
