const crypto = require("crypto");
const { isBefore, startOfDay } = require("date-fns");
const ShareLink = require("./shareLink.model");
const Meeting = require("../meetings/meeting.model");
const Remark = require("../remarks/remark.model");
const Task = require("../tasks/task.model");
const TaskRemark = require("../tasks/taskRemark.model");

const DEFAULT_EXPIRY_DAYS = Number(process.env.SHARE_LINK_EXPIRY_DAYS || 90);

function appUrl() {
  return process.env.APP_URL || "http://localhost:5173";
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

module.exports = {
  appUrl,
  shareUrl,
  ensureShareLink,
  loadSharePayload
};
