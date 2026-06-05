const router = require("express").Router();
const {
  listTasks,
  getTaskStats,
  createTask,
  updateTask,
  getTaskTimeline,
  addTaskRemark,
  getRemarksByTask,
  removeTask,
  getTaskCalendarEvents
} = require("./tasks.controller");
const { protect } = require("../shared/middleware/authMiddleware");

router.use(protect);
router.get("/", listTasks);
router.get("/stats", getTaskStats);
router.get("/calendar-events", getTaskCalendarEvents);
router.post("/remarks", addTaskRemark);
router.get("/remarks/:taskId", getRemarksByTask);
router.post("/", createTask);
router.put("/:id", updateTask);
router.get("/:id/timeline", getTaskTimeline);
router.delete("/:id", removeTask);

module.exports = router;
