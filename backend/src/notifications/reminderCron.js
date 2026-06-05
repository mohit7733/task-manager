const cron = require("node-cron");
const { addHours, isBefore, isAfter } = require("date-fns");
const Meeting = require("../meetings/meeting.model");
const Notification = require("./notification.model");

async function createReminderNotifications() {
  const now = new Date();
  const soon = addHours(now, 24);
  const meetings = await Meeting.find({
    status: { $ne: "Completed" },
    meeting_date: { $exists: true, $ne: null }
  }).populate("created_by", "_id");

  for (const meeting of meetings) {
    const date = new Date(meeting.meeting_date);
    let type;
    let title;
    if (isBefore(date, now)) {
      type = "overdue";
      title = `Overdue: ${meeting.title}`;
    } else if (isAfter(date, now) && isBefore(date, soon)) {
      type = "upcoming";
      title = `Upcoming: ${meeting.title}`;
    }
    if (!type || !meeting.created_by) continue;
    const exists = await Notification.findOne({
      meeting_id: meeting._id,
      user_id: meeting.created_by._id,
      type,
      createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }
    });
    if (!exists) {
      await Notification.create({
        user_id: meeting.created_by._id,
        meeting_id: meeting._id,
        type,
        title,
        message: `${meeting.status} meeting for ${meeting.responsible_person || "team"}`
      });
    }
  }
}

function startReminderEngine() {
  cron.schedule("*/10 * * * *", createReminderNotifications);
}

module.exports = { startReminderEngine };
