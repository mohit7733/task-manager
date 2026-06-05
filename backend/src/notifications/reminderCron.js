const cron = require("node-cron");
const { addHours, isBefore, isAfter, startOfDay } = require("date-fns");
const Meeting = require("../meetings/meeting.model");
const Task = require("../tasks/task.model");
const User = require("../auth/user.model");
const Notification = require("./notification.model");
const { sendReminderEmail } = require("../shared/emailService");

async function notifyUser({ user, meeting, task, type, title, message }) {
  if (!user) return;
  const refId = meeting?._id || task?._id;
  const exists = await Notification.findOne({
    user_id: user._id,
    ...(meeting ? { meeting_id: meeting._id } : {}),
    type,
    title,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
  });
  if (exists) return;

  await Notification.create({
    user_id: user._id,
    meeting_id: meeting?._id,
    type,
    title,
    message
  });

  if (user.email_notifications_enabled !== false && user.email) {
    sendReminderEmail({ to: user.email, title, message, type }).catch(() => {});
  }
}

async function processMeetingReminders(now, soon) {
  const meetings = await Meeting.find({
    status: { $ne: "Completed" },
    meeting_date: { $exists: true, $ne: null }
  }).populate("created_by", "_id email email_notifications_enabled");

  for (const meeting of meetings) {
    const date = new Date(meeting.meeting_date);
    let type;
    let title;
    if (isBefore(date, startOfDay(now))) {
      type = "overdue";
      title = `Overdue: ${meeting.title}`;
    } else if (isAfter(date, now) && isBefore(date, soon)) {
      type = "upcoming";
      title = `Upcoming: ${meeting.title}`;
    }
    if (!type || !meeting.created_by) continue;
    const message = `${meeting.status} meeting for ${meeting.responsible_person || "team"} on ${date.toLocaleDateString()}`;
    await notifyUser({ user: meeting.created_by, meeting, type, title, message });

    if (meeting.responsible_email && meeting.responsible_email !== meeting.created_by.email) {
      sendReminderEmail({ to: meeting.responsible_email, title, message, type }).catch(() => {});
    }
  }
}

async function processTaskReminders(now, soon) {
  const tasks = await Task.find({
    status: { $ne: "Done" },
    next_review_date: { $exists: true, $ne: null }
  }).populate("created_by", "_id email email_notifications_enabled");

  for (const task of tasks) {
    const date = new Date(task.next_review_date);
    let type;
    let title;
    if (isBefore(date, startOfDay(now))) {
      type = "overdue";
      title = `Task review overdue: ${task.title}`;
    } else if (isAfter(date, now) && isBefore(date, soon)) {
      type = "upcoming";
      title = `Task review due soon: ${task.title}`;
    }
    if (!type) continue;
    const message = `${task.department} task assigned to ${task.assigned_to} — review on ${date.toLocaleDateString()}`;
    if (task.created_by) {
      await notifyUser({ user: task.created_by, task, type, title, message });
    }
    if (task.assigned_email) {
      sendReminderEmail({ to: task.assigned_email, title, message, type }).catch(() => {});
    }
  }
}

async function createReminderNotifications() {
  const now = new Date();
  const users = await User.find({ email_notifications_enabled: { $ne: false } }).select("reminder_lead_hours");
  const leadHours = users.length
    ? Math.min(...users.map((u) => u.reminder_lead_hours ?? 24))
    : 24;
  const soon = addHours(now, leadHours);
  await processMeetingReminders(now, soon);
  await processTaskReminders(now, soon);
}

function startReminderEngine() {
  cron.schedule("*/10 * * * *", createReminderNotifications);
}

module.exports = { startReminderEngine };
