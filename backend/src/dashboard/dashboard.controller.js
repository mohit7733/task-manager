const { endOfDay, startOfDay } = require("date-fns");
const Meeting = require("../meetings/meeting.model");
const Remark = require("../remarks/remark.model");
const Task = require("../tasks/task.model");

async function getDashboard(req, res) {
  const base = { coo_id: req.user.coo_id };
  const todayRange = { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) };
  const [pending, upcoming, today, overdue, completed, recentRemarks, tasksOpen, tasksDone, tasksOverdue] =
    await Promise.all([
      Meeting.countDocuments({ ...base, status: { $in: ["Pending", "In Progress"] } }),
      Meeting.countDocuments({ ...base, meeting_date: { $gte: startOfDay(new Date()) } }),
      Meeting.countDocuments({ ...base, meeting_date: todayRange }),
      Meeting.countDocuments({ ...base, status: { $ne: "Completed" }, meeting_date: { $lt: startOfDay(new Date()) } }),
      Meeting.countDocuments({ ...base, status: "Completed" }),
      Remark.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({ path: "meeting_id", select: "title coo_id", match: base }),
      Task.countDocuments({ ...base, status: { $ne: "Done" } }),
      Task.countDocuments({ ...base, status: "Done" }),
      Task.countDocuments({
        ...base,
        status: { $ne: "Done" },
        next_review_date: { $lt: startOfDay(new Date()) }
      })
    ]);
  const total = pending + completed;
  const completionRate = total ? Math.round((completed / (pending + completed + today)) * 100) : 0;
  res.json({
    pending,
    upcoming,
    today,
    overdue,
    completed,
    recentRemarks: recentRemarks.filter((r) => r.meeting_id),
    completionRate,
    totalMeetings: pending + completed + today,
    tasksOpen,
    tasksDone,
    tasksOverdue
  });
}

module.exports = { getDashboard };
