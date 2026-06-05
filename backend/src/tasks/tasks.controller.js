const { addDays, isBefore, startOfDay } = require("date-fns");
const Task = require("./task.model");
const TaskRemark = require("./taskRemark.model");
const { sendTaskAssignedEmail, sendTaskRemarkEmail } = require("../shared/emailService");

function buildFilter(query, user) {
  const filter = { coo_id: user.coo_id };
  if (query.status) filter.status = query.status;
  if (query.department) filter.department = query.department;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, "i") },
      { assigned_to: new RegExp(query.search, "i") },
      { description: new RegExp(query.search, "i") }
    ];
  }
  if (query.overdue === "true") {
    filter.status = { $ne: "Done" };
    filter.next_review_date = { $lt: startOfDay(new Date()) };
  }
  if (query.thisWeek === "true") {
    filter.next_review_date = {
      $gte: startOfDay(new Date()),
      $lte: addDays(startOfDay(new Date()), 7)
    };
  }
  return filter;
}

async function listTasks(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const sortBy = req.query.sortBy || "task_create_date";
    const order = req.query.order === "asc" ? 1 : -1;
    const filter = buildFilter(req.query, req.user);

    const [items, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    const taskIds = items.map((t) => t._id);
    const remarksData = await TaskRemark.aggregate([
      { $match: { task_id: { $in: taskIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$task_id",
          totalRemarks: { $sum: 1 },
          lastRemark: { $first: "$$ROOT" }
        }
      }
    ]);

    const remarkMap = new Map(
      remarksData.map((r) => [
        String(r._id),
        { totalRemarks: r.totalRemarks, lastRemark: r.lastRemark }
      ])
    );

    const response = items.map((task) => {
      const remarkData = remarkMap.get(String(task._id));
      return {
        ...task.toObject(),
        totalRemarks: remarkData?.totalRemarks || 0,
        lastRemark: remarkData?.lastRemark || null
      };
    });

    res.json({ items: response, total, page, limit, departments: Task.schema.path("department").enumValues });
  } catch (error) {
    console.error("List Tasks Error:", error);
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
}

async function getTaskStats(req, res) {
  const base = { coo_id: req.user.coo_id };
  const [total, pending, inProgress, done, byDepartment] = await Promise.all([
    Task.countDocuments(base),
    Task.countDocuments({ ...base, status: "Pending" }),
    Task.countDocuments({ ...base, status: "In Progress" }),
    Task.countDocuments({ ...base, status: "Done" }),
    Task.aggregate([
      { $match: base },
      {
        $group: {
          _id: "$department",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } },
          open: { $sum: { $cond: [{ $ne: ["$status", "Done"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  res.json({ total, pending, inProgress, done, byDepartment });
}

async function createTask(req, res) {
  const body = req.body;
  if (!body.title?.trim()) return res.status(400).json({ message: "Task title is required" });
  if (!body.department) return res.status(400).json({ message: "Department is required" });
  if (!body.assigned_to?.trim()) return res.status(400).json({ message: "Assigned person is required" });

  const task = await Task.create({
    ...body,
    title: body.title.trim(),
    assigned_to: body.assigned_to.trim(),
    assigned_email: body.assigned_email?.trim() || undefined,
    created_by: req.user._id,
    coo_id: body.coo_id || req.user.coo_id,
    task_create_date: body.task_create_date || new Date()
  });
  sendTaskAssignedEmail(task, req.user).catch(() => {});
  res.status(201).json(task);
}

async function updateTask(req, res) {
  const update = { ...req.body };
  if (update.title) update.title = update.title.trim();
  if (update.assigned_to) update.assigned_to = update.assigned_to.trim();
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, coo_id: req.user.coo_id },
    update,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
}

async function getTaskTimeline(req, res) {
  const task = await Task.findOne({ _id: req.params.id, coo_id: req.user.coo_id });
  if (!task) return res.status(404).json({ message: "Task not found" });
  const remarks = await TaskRemark.find({ task_id: task._id }).sort({ remark_number: 1 });
  const overdue =
    task.status !== "Done" &&
    task.next_review_date &&
    isBefore(new Date(task.next_review_date), startOfDay(new Date()));
  res.json({ task, remarks, overdue });
}

async function addTaskRemark(req, res) {
  const task = await Task.findOne({ _id: req.body.task_id, coo_id: req.user.coo_id });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const isCompleted = req.body.mark_completed === true || req.body.mark_completed === "true";
  if (!req.body.remark_description?.trim()) {
    return res.status(400).json({ message: "Meeting discussion / remark is required" });
  }

  if (isCompleted) {
    if (!req.body.completion_note?.trim()) {
      return res.status(400).json({ message: "Completion note is required to mark task as done" });
    }
  } else if (!req.body.pending_reason?.trim()) {
    return res.status(400).json({ message: "Pending reason is required when task is not done" });
  }

  const count = await TaskRemark.countDocuments({ task_id: task._id });

  const remarkData = {
    task_id: task._id,
    remark_number: count + 1,
    remark_date: req.body.remark_date || new Date(),
    meeting_date: req.body.meeting_date || req.body.remark_date || new Date(),
    remark_description: req.body.remark_description.trim(),
    attachment: req.file ? `/uploads/${req.file.filename}` : undefined,
    created_by: req.user._id
  };

  if (isCompleted) {
    remarkData.completion_note = req.body.completion_note.trim();
    remarkData.status_after = "Done";
    task.status = "Done";
    task.final_outcome = req.body.completion_note.trim();
    task.latest_pending_reason = "";
  } else {
    remarkData.pending_reason = req.body.pending_reason.trim();
    remarkData.status_after = req.body.status || task.status || "Pending";
    remarkData.next_review_date = req.body.next_review_date;
    task.status = remarkData.status_after;
    task.latest_pending_reason = req.body.pending_reason.trim();
    if (req.body.next_review_date) task.next_review_date = req.body.next_review_date;
  }

  const remark = await TaskRemark.create(remarkData);
  await task.save();
  sendTaskRemarkEmail(task, remark, req.user).catch(() => {});
  res.status(201).json(remark);
}

async function getRemarksByTask(req, res) {
  const remarks = await TaskRemark.find({ task_id: req.params.taskId }).sort({ remark_number: 1 });
  res.json(remarks);
}

async function removeTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, coo_id: req.user.coo_id });
  if (!task) return res.status(404).json({ message: "Task not found" });
  await TaskRemark.deleteMany({ task_id: req.params.id });
  res.json({ success: true });
}

async function getTaskCalendarEvents(req, res) {
  const tasks = await Task.find({ coo_id: req.user.coo_id }).lean();
  const ids = tasks.map((t) => t._id);
  const remarks = await TaskRemark.find({ task_id: { $in: ids } })
    .sort({ task_id: 1, remark_number: 1 })
    .lean();

  const remarksByTask = {};
  remarks.forEach((r) => {
    const key = String(r.task_id);
    if (!remarksByTask[key]) remarksByTask[key] = [];
    remarksByTask[key].push(r);
  });

  const events = [];

  for (const t of tasks) {
    const tId = String(t._id);
    const rlist = remarksByTask[tId] || [];
    const base = {
      taskId: tId,
      title: t.title,
      department: t.department,
      assigned_to: t.assigned_to,
      status: t.status,
      priority: t.priority,
      description: t.description,
      latest_pending_reason: t.latest_pending_reason,
      final_outcome: t.final_outcome,
      weekly_meeting_day: t.weekly_meeting_day
    };

    if (t.task_create_date) {
      events.push({
        ...base,
        id: `dept-created-${tId}`,
        kind: "created",
        label: "Task created",
        date: t.task_create_date,
        allDay: true
      });
    }

    if (t.next_review_date && t.status !== "Done") {
      events.push({
        ...base,
        id: `dept-review-${tId}`,
        kind: "review",
        label: "Next weekly review",
        date: t.next_review_date,
        allDay: true
      });
    }

    rlist.forEach((r) => {
      if (r.meeting_date) {
        events.push({
          ...base,
          id: `dept-remark-${tId}-r${r.remark_number}`,
          kind: "remark",
          label: `Meeting remark #${r.remark_number}`,
          date: r.meeting_date,
          allDay: true,
          remark_number: r.remark_number,
          remark_description: r.remark_description,
          pending_reason: r.pending_reason
        });
      }
      if (r.next_review_date) {
        const dup =
          t.next_review_date &&
          new Date(r.next_review_date).toDateString() === new Date(t.next_review_date).toDateString();
        if (!dup) {
          events.push({
            ...base,
            id: `dept-followup-${tId}-r${r.remark_number}`,
            kind: "followup_review",
            label: `Next review (remark #${r.remark_number})`,
            date: r.next_review_date,
            allDay: true
          });
        }
      }
    });
  }

  res.json({ events });
}

module.exports = {
  listTasks,
  getTaskStats,
  createTask,
  updateTask,
  getTaskTimeline,
  addTaskRemark,
  getRemarksByTask,
  removeTask,
  getTaskCalendarEvents
};
