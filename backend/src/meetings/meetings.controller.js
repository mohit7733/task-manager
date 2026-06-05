const { addDays, isBefore, startOfDay } = require("date-fns");
const Meeting = require("./meeting.model");
const Remark = require("../remarks/remark.model");
const { sendMeetingAssignedEmail, sendEmail } = require("../shared/emailService");

function buildFilter(query, user) {
  const filter = { coo_id: user.coo_id };
  if (query.status) filter.status = query.status;
  if (query.meeting_type) filter.meeting_type = query.meeting_type;
  if (query.priority) filter.priority = query.priority;
  if (query.search) filter.$or = [{ title: new RegExp(query.search, "i") }, { discussion_topic: new RegExp(query.search, "i") }];
  if (query.overdue === "true") filter.meeting_date = { $lt: startOfDay(new Date()) };
  if (query.thisWeek === "true") filter.meeting_date = { $gte: startOfDay(new Date()), $lte: addDays(startOfDay(new Date()), 7) };
  return filter;
}

async function listMeetings(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const sortBy = req.query.sortBy || "meeting_date";
    const order = req.query.order === "asc" ? 1 : -1;

    const filter = buildFilter(req.query, req.user);

    // Get meetings
    const [items, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit),

      Meeting.countDocuments(filter)
    ]);

    const meetingIds = items.map((m) => m._id);

    // Aggregate remarks
    const remarksData = await Remark.aggregate([
      {
        $match: {
          meeting_id: { $in: meetingIds }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $group: {
          _id: "$meeting_id",
          totalRemarks: { $sum: 1 },
          lastRemark: { $first: "$$ROOT" }
        }
      }
    ]);

    // Convert to map
    const remarkMap = new Map(
      remarksData.map((r) => [
        String(r._id),
        {
          totalRemarks: r.totalRemarks,
          lastRemark: r.lastRemark
        }
      ])
    );

    // Final response
    const response = items.map((meeting) => {
      const remarkData = remarkMap.get(String(meeting._id));

      return {
        ...meeting.toObject(),
        totalRemarks: remarkData?.totalRemarks || 0,
        lastRemark: remarkData?.lastRemark || null
      };
    });

    res.json({
      items: response,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error("List Meetings Error:", error);

    res.status(500).json({
      message: "Failed to fetch meetings",
      error: error.message
    });
  }
}

async function createMeeting(req, res) {
  const body = req.body;
  const meetingDate = body.meeting_date || new Date();
  const meeting = await Meeting.create({
    ...body,
    created_by: req.user._id,
    coo_id: body.coo_id || req.user.coo_id,
    task_create_date: body.task_create_date || new Date(),
    initial_meeting_date: body.initial_meeting_date || meetingDate,
    meeting_date: meetingDate,
    attachment: req.file ? `/uploads/${req.file.filename}` : body.attachment,
    responsible_email: body.responsible_email?.trim() || undefined
  });
  sendMeetingAssignedEmail(meeting, req.user).catch(() => { });
  res.status(201).json(meeting);
}

async function sendMeetingAssignedEmailtesting() {
  await sendEmail({
    to: "mohitbeniwal@aimantra.co",
    subject: "New Meeting Assigned",
    html: `<p>Hello ,</p>
    <p>You have been assigned a new meeting:</p>
    <p>Title: </p>
    <p>Date: </p>
    <p>Time: </p>
  `
  });
}

function sameCalendarSlot(a, b, timeA, timeB) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (d1.toDateString() !== d2.toDateString()) return false;
  return (timeA || "") === (timeB || "");
}

async function getCalendarEvents(req, res) {
  const meetings = await Meeting.find({ coo_id: req.user.coo_id }).lean();
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
    if (!initial && rlist.length > 0 && rlist[0].remark_date) {
      initial = rlist[0].remark_date;
    }
    if (!initial) initial = m.meeting_date;

    const base = {
      meetingId: mId,
      title: m.title,
      status: m.status,
      priority: m.priority,
      meeting_type: m.meeting_type,
      responsible_person: m.responsible_person,
      discussion_topic: m.discussion_topic,
      description: m.description,
      final_outcome: m.final_outcome,
      meeting_time: m.meeting_time
    };

    if (m.task_create_date) {
      events.push({
        ...base,
        id: `task-${mId}`,
        kind: "task",
        label: "Task created",
        date: m.task_create_date,
        time: null,
        allDay: true
      });
    }

    if (initial) {
      const sameAsCurrent = current && sameCalendarSlot(initial, current, m.meeting_time, m.meeting_time);
      if (!sameAsCurrent || !current) {
        events.push({
          ...base,
          id: `initial-${mId}`,
          kind: "initial",
          label: "First meeting",
          date: initial,
          time: m.meeting_time,
          allDay: !m.meeting_time
        });
      }
    }

    if (current) {
      events.push({
        ...base,
        id: `meeting-${mId}`,
        kind: "meeting",
        label: m.status === "Completed" ? "Meeting (done)" : "Scheduled meeting",
        date: current,
        time: m.meeting_time,
        allDay: !m.meeting_time
      });
    }

    if (m.reminder_date) {
      events.push({
        ...base,
        id: `reminder-${mId}`,
        kind: "reminder",
        label: "Reminder",
        date: m.reminder_date,
        time: null,
        allDay: true
      });
    }

    rlist.forEach((r) => {
      if (r.next_meeting_date) {
        const dupCurrent =
          current &&
          sameCalendarSlot(r.next_meeting_date, current, r.next_meeting_time, m.meeting_time);
        const dupInitial =
          initial &&
          sameCalendarSlot(r.next_meeting_date, initial, r.next_meeting_time, m.meeting_time);
        if (!dupCurrent && !dupInitial) {
          events.push({
            ...base,
            id: `followup-${mId}-r${r.remark_number}`,
            kind: "followup",
            label: `Followup #${r.remark_number}`,
            date: r.next_meeting_date,
            time: r.next_meeting_time,
            allDay: !r.next_meeting_time,
            remark_number: r.remark_number,
            next_agenda: r.next_agenda,
            next_followup_note: r.next_followup_note
          });
        }
      }
    });
  }

  res.json({ events });
}

async function updateMeeting(req, res) {
  const update = { ...req.body };
  if (req.file) update.attachment = `/uploads/${req.file.filename}`;
  const meeting = await Meeting.findOneAndUpdate({ _id: req.params.id, coo_id: req.user.coo_id }, update, { new: true });
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });
  res.json(meeting);
}

async function getMeetingTimeline(req, res) {
  const meeting = await Meeting.findOne({ _id: req.params.id, coo_id: req.user.coo_id });
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });
  const remarks = await Remark.find({ meeting_id: meeting._id }).sort({ remark_number: 1 });
  const overdue = meeting.status !== "Completed" && meeting.meeting_date && isBefore(new Date(meeting.meeting_date), startOfDay(new Date()));
  res.json({ meeting, remarks, overdue });
}

async function removeMeeting(req, res) {
  await Meeting.findOneAndDelete({ _id: req.params.id, coo_id: req.user.coo_id });
  await Remark.deleteMany({ meeting_id: req.params.id });
  res.json({ success: true });
}

module.exports = {
  listMeetings,
  createMeeting,
  sendMeetingAssignedEmailtesting,
  updateMeeting,
  getMeetingTimeline,
  getCalendarEvents,
  removeMeeting
};
