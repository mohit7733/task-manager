const crypto = require("crypto");
const { isBefore, startOfDay } = require("date-fns");
const ShareLink = require("./shareLink.model");
const Meeting = require("../meetings/meeting.model");
const Remark = require("../remarks/remark.model");
const Task = require("../tasks/task.model");
const TaskRemark = require("../tasks/taskRemark.model");

const DEFAULT_EXPIRY_DAYS = Number(process.env.SHARE_LINK_EXPIRY_DAYS || 90);
const CALENDAR_EXPIRY_YEARS = Number(process.env.CALENDAR_SHARE_EXPIRY_YEARS || 100);

function appUrl() {
  return process.env.APP_URL || "https://civilmantra-task-manager.vercel.app";
}

function shareUrl(token) {
  return `${appUrl()}/share/${token}`;
}

function sanitizePeople(list) {
  if (!Array.isArray(list)) return [];
  return list.map((u) => ({
    name: u?.name || "",
    emp_code: u?.emp_code || "",
    department_name: u?.department_name || ""
  }));
}

function sanitizeMeeting(meeting) {
  const obj = meeting.toObject ? meeting.toObject() : { ...meeting };
  delete obj.coo_id;
  delete obj.created_by;
  if (Array.isArray(obj.responsible_person)) {
    obj.responsible_person = sanitizePeople(obj.responsible_person);
  }
  return obj;
}

function sanitizeTask(task) {
  const obj = task.toObject ? task.toObject() : { ...task };
  delete obj.coo_id;
  delete obj.created_by;
  if (Array.isArray(obj.assigned_to)) {
    obj.assigned_to = sanitizePeople(obj.assigned_to);
  }
  return obj;
}

function sanitizeRemark(remark) {
  const obj = remark.toObject ? remark.toObject() : { ...remark };
  delete obj.created_by;
  delete obj.meeting_id;
  delete obj.task_id;
  return obj;
}
function calendarShareUrl(token) {
  return `${appUrl()}/share-calendar/${token}`;
}


async function ensureShareLink(resourceType, resourceId, cooId) {
  const existing = await ShareLink.findOne({
    resource_type: resourceType,
    resource_id: resourceId,
    revoked_at: null,
    expires_at: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (existing) return existing.token;

  const token = crypto.randomBytes(24).toString("hex");
  await ShareLink.create({
    token,
    resource_type: resourceType,
    resource_id: resourceId,
    coo_id: cooId,
    expires_at: new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  });
  return token;
}

async function loadSharePayload(token) {
  const link = await ShareLink.findOne({
    token,
    revoked_at: null,
    expires_at: { $gt: new Date() }
  });
  if (!link) return null;

  if (link.resource_type === "calendar") {
    return buildCalendarPayload(link.coo_id);
  }

  if (link.resource_type === "meeting") {
    const meeting = await Meeting.findOne({ _id: link.resource_id, coo_id: link.coo_id });
    if (!meeting) return null;
    const remarks = await Remark.find({ meeting_id: meeting._id }).sort({ remark_number: 1 });
    const overdue =
      meeting.status !== "Completed" &&
      meeting.meeting_date &&
      isBefore(new Date(meeting.meeting_date), startOfDay(new Date()));
    return {
      type: "meeting",
      meeting: sanitizeMeeting(meeting),
      remarks: remarks.map(sanitizeRemark),
      overdue
    };
  }

  if (link.resource_type === "task") {
    const task = await Task.findOne({ _id: link.resource_id, coo_id: link.coo_id });
    if (!task) return null;
    const remarks = await TaskRemark.find({ task_id: task._id }).sort({ remark_number: 1 });
    const overdue =
      task.status !== "Done" &&
      task.next_review_date &&
      isBefore(new Date(task.next_review_date), startOfDay(new Date()));
    return {
      type: "task",
      task: sanitizeTask(task),
      remarks: remarks.map(sanitizeRemark),
      overdue
    };
  }

  return null;
}

function sanitizeCalendarEvent(evt) {
  // Minimal by design: no time, no discussion/outcome text, no attendee details
  return {
    id: evt.id,
    title: evt.title,
    status: evt.status,
    meeting_type: evt.meeting_type,
    kind: evt.kind,
    label: evt.label,
    date: evt.date,
    allDay: true
  };
}
function sameCalendarDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

async function buildCalendarPayload(cooId) {
  const meetings = await Meeting.find({ coo_id: cooId }).lean();
  const ids = meetings.map((m) => m._id);
  const remarks = await Remark.find({ meeting_id: { $in: ids } })
    .sort({ meeting_id: 1, remark_number: 1 })
    .lean();

  const remarksByMeeting = {};
  remarks.forEach((r) => {
    const key = String(r.meeting_id);
    if (!remarksByMeeting[key]) remarksByMeeting[key] = [];
    remarksByMeeting[key].push(r);
  });

  const events = [];

  for (const m of meetings) {
    const mId = String(m._id);
    const rlist = remarksByMeeting[mId] || [];
    let initial = m.initial_meeting_date;
    const current = m.meeting_date;
    if (!initial && rlist.length > 0 && rlist[0].remark_date) initial = rlist[0].remark_date;
    if (!initial) initial = m.meeting_date;

    const base = { title: m.title, status: m.status, meeting_type: m.meeting_type };

    if (m.task_create_date) {
      events.push({ ...base, id: `task-${mId}`, kind: "task", label: "Task created", date: m.task_create_date });
    }
    const sameAsCurrent = sameCalendarDay(initial, current);
if (initial && (!sameAsCurrent || !current)) {
  events.push({ ...base, id: `initial-${mId}`, kind: "initial", label: "First meeting", date: initial });
}
if (current) {
  events.push({
    ...base,
    id: `meeting-${mId}`,
    kind: "meeting",
    label: m.status === "Completed" ? "Meeting (done)" : "Scheduled meeting",
    date: current
  });
}
    rlist.forEach((r) => {
      if (r.next_meeting_date) {
        events.push({
          ...base,
          id: `followup-${mId}-r${r.remark_number}`,
          kind: "followup",
          label: `Followup #${r.remark_number}`,
          date: r.next_meeting_date
        });
      }
    });
  }

  return { type: "calendar", events: events.map(sanitizeCalendarEvent) };
}

async function ensureCalendarShareLink(userId, cooId) {
  const existing = await ShareLink.findOne({
    resource_type: "calendar",
    coo_id: cooId,
    revoked_at: null
  }).sort({ createdAt: -1 });

  if (existing) return existing.token;

  const token = crypto.randomBytes(24).toString("hex");
  await ShareLink.create({
    token,
    resource_type: "calendar",
    resource_id: userId,
    coo_id: cooId,
    expires_at: new Date(Date.now() + CALENDAR_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000)
  });
  return token;
}

async function revokeCalendarShareLink(cooId) {
  await ShareLink.updateMany(
    { resource_type: "calendar", coo_id: cooId, revoked_at: null },
    { revoked_at: new Date() }
  );
}

module.exports = {
  appUrl,
  shareUrl,
  calendarShareUrl,
  ensureShareLink,
  loadSharePayload,
  ensureCalendarShareLink,
  revokeCalendarShareLink
};
