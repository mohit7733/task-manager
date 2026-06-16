const cron = require("node-cron");
const { addHours, isAfter, isBefore, startOfDay } = require("date-fns");
const Meeting = require("../meetings/meeting.model");
const Task = require("../tasks/task.model");
const User = require("../auth/user.model");
const Notification = require("./notification.model");
const { sendReminderEmail } = require("../shared/emailService");

function meetingResponsibleEmails(meeting) {
  if (Array.isArray(meeting.responsible_person)) {
    return meeting.responsible_person.map((u) => u.email).filter(Boolean);
  }
  return [];
}

function taskAssigneeEmails(task) {
  if (Array.isArray(task.assigned_to)) {
    return task.assigned_to.map((u) => u.email).filter(Boolean);
  }
  return [];
}

function responsiblePersonLabel(value) {
  if (Array.isArray(value)) return value.map((u) => u.name).filter(Boolean).join(", ");
  return value || "";
}

function taskAssigneeLabel(task) {
  if (Array.isArray(task.assigned_to)) {
    return task.assigned_to.map((u) => u.name).filter(Boolean).join(", ");
  }
  return "";
}

function formatDateTime(dateValue, timeStr) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return timeStr ? `${datePart} at ${timeStr}` : datePart;
}

function combineDateAndTime(dateValue, timeStr) {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function getLeadHours(users) {
  if (!users.length) return 24;
  const values = users.map((u) => u.reminder_lead_hours ?? 24).filter((h) => Number.isFinite(h) && h >= 0);
  return values.length ? Math.min(...values) : 24;
}

function classifyReminder(target, now, leadHours, { allDay = false } = {}) {
  if (!target) return null;
  const at = new Date(target);
  if (Number.isNaN(at.getTime())) return null;

  const soon = addHours(now, leadHours);
  const todayStart = startOfDay(now);

  if (allDay) {
    const targetDay = startOfDay(at);
    if (isBefore(targetDay, todayStart)) return "overdue";
    const soonDay = startOfDay(soon);
    if (!isAfter(targetDay, soonDay)) return "upcoming";
    return null;
  }

  if (isBefore(at, now)) return "overdue";
  if (isAfter(at, now) && !isAfter(at, soon)) return "upcoming";
  return null;
}

async function wasReminderSentToday(reminderKey, { userId, email }) {
  const query = {
    reminder_key: reminderKey,
    createdAt: { $gte: startOfDay(new Date()) }
  };
  if (userId) query.user_id = userId;
  else if (email) query.recipient_email = email.toLowerCase();
  else return false;

  const exists = await Notification.findOne(query).select("_id").lean();
  return Boolean(exists);
}

async function recordReminder({
  user,
  email,
  meeting,
  task,
  type,
  title,
  message,
  reminderKey
}) {
  await Notification.create({
    user_id: user?._id,
    recipient_email: user ? undefined : email,
    meeting_id: meeting?._id,
    task_id: task?._id,
    reminder_key: reminderKey,
    type,
    title,
    message
  });

  const to = user?.email || email;
  if (!to) return;
  if (user && user.email_notifications_enabled === false) return;

  await sendReminderEmail({ to, title, message, type, meeting, task }).catch((err) => {
    console.error(`[Reminder] Email failed for ${to}:`, err.message);
  });
}

async function dispatchReminder({ meeting, task, type, title, message, reminderKey, creator, extraEmails = [] }) {
  const seen = new Set();

  if (creator?.email) {
    const key = `${reminderKey}:user:${creator._id}`;
    if (!seen.has(creator.email) && !(await wasReminderSentToday(key, { userId: creator._id }))) {
      seen.add(creator.email);
      await recordReminder({
        user: creator,
        meeting,
        task,
        type,
        title,
        message,
        reminderKey: key
      });
    }
  }

  for (const email of extraEmails) {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized) || normalized === creator?.email?.toLowerCase()) continue;
    const key = `${reminderKey}:email:${normalized}`;
    if (await wasReminderSentToday(key, { email: normalized })) continue;
    seen.add(normalized);
    await recordReminder({
      email: normalized,
      meeting,
      task,
      type,
      title,
      message,
      reminderKey: key
    });
  }
}

async function processMeetingReminders(now, leadHours) {
  const meetings = await Meeting.find({
    status: { $ne: "Completed" },
    $or: [
      { meeting_date: { $exists: true, $ne: null } },
      { reminder_date: { $exists: true, $ne: null } }
    ]
  }).populate("created_by", "_id email email_notifications_enabled");

  for (const meeting of meetings) {
    const responsible = responsiblePersonLabel(meeting.responsible_person) || "team";
    const anchors = [
      {
        kind: "reminder_date",
        label: "Reminder",
        target: combineDateAndTime(meeting.reminder_date, null),
        allDay: true,
        whenText: formatDateTime(meeting.reminder_date)
      },
      {
        kind: "meeting_date",
        label: "Meeting",
        target: combineDateAndTime(meeting.meeting_date, meeting.meeting_time),
        allDay: !meeting.meeting_time,
        whenText: formatDateTime(meeting.meeting_date, meeting.meeting_time)
      }
    ];

    for (const anchor of anchors) {
      if (!anchor.target) continue;
      const reminderType = classifyReminder(anchor.target, now, leadHours, { allDay: anchor.allDay });
      if (!reminderType) continue;

      const title =
        reminderType === "overdue"
          ? `Overdue ${anchor.label}: ${meeting.title}`
          : `Upcoming ${anchor.label}: ${meeting.title}`;

      const message =
        reminderType === "overdue"
          ? `${meeting.status} meeting for ${responsible} was scheduled for ${anchor.whenText}.`
          : `${meeting.status} meeting for ${responsible} is scheduled for ${anchor.whenText}.`;

      const reminderKey = `meeting:${meeting._id}:${anchor.kind}:${reminderType}`;

      await dispatchReminder({
        meeting,
        type: reminderType,
        title,
        message,
        reminderKey,
        creator: meeting.created_by,
        extraEmails: meetingResponsibleEmails(meeting)
      });
    }
  }
}

async function processTaskReminders(now, leadHours) {
  const tasks = await Task.find({
    status: { $ne: "Done" },
    next_review_date: { $exists: true, $ne: null }
  }).populate("created_by", "_id email email_notifications_enabled");

  for (const task of tasks) {
    const assignees = taskAssigneeLabel(task) || "assignee";
    const target = combineDateAndTime(task.next_review_date, null);
    const reminderType = classifyReminder(target, now, leadHours, { allDay: true });
    if (!reminderType) continue;

    const whenText = formatDateTime(task.next_review_date);
    const title =
      reminderType === "overdue"
        ? `Task review overdue: ${task.title}`
        : `Task review due soon: ${task.title}`;

    const message =
      reminderType === "overdue"
        ? `${task.department} task for ${assignees} was due for review on ${whenText}.`
        : `${task.department} task for ${assignees} is scheduled for review on ${whenText}.`;

    const reminderKey = `task:${task._id}:next_review_date:${reminderType}`;

    await dispatchReminder({
      task,
      type: reminderType,
      title,
      message,
      reminderKey,
      creator: task.created_by,
      extraEmails: taskAssigneeEmails(task)
    });
  }
}

async function createReminderNotifications() {
  try {
    const now = new Date();
    const users = await User.find({ email_notifications_enabled: { $ne: false } }).select("reminder_lead_hours");
    const leadHours = getLeadHours(users);
    await processMeetingReminders(now, leadHours);
    await processTaskReminders(now, leadHours);
  } catch (error) {
    console.error("[Reminder] Cron failed:", error);
  }
}

function startReminderEngine() {
  cron.schedule("*/10 * * * *", createReminderNotifications);
  console.log("[Reminder] Engine started (every 10 minutes)");
}

module.exports = { startReminderEngine, createReminderNotifications };
