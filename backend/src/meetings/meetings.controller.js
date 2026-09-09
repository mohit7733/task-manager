const { addDays, addWeeks, addMonths, isAfter, isBefore, startOfDay, endOfDay } = require("date-fns");const Meeting = require("./meeting.model");
const Remark = require("../remarks/remark.model");
const { sendMeetingAssignedEmail } = require("../shared/emailService");
const mongoose = require("mongoose");

function parseResponsiblePerson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function responsiblePersonLabel(value) {
  if (Array.isArray(value)) return value.map((u) => u.name).filter(Boolean).join(", ");
  return value || "";
}

function buildFilter(query, user) {
  const filter = { coo_id: user.coo_id };
  if (query.status) filter.status = query.status;
  if (query.meeting_type) filter.meeting_type = query.meeting_type;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.$or = [
      { title: new RegExp(query.search, "i") },
      { discussion_topic: new RegExp(query.search, "i") },
      { "responsible_person.name": new RegExp(query.search, "i") }
    ];
  }
  if (query.view === "pending") filter.status = { $in: ["Pending", "In Progress"] };
  if (query.today === "true") {filter.meeting_date = { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) };}
  if (query.upcoming === "true") filter.meeting_date = { $gte: startOfDay(new Date()) };
  if (query.overdue === "true") {filter.status = { $ne: "Completed" };filter.meeting_date = { $lt: startOfDay(new Date()) };}
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
function nthWeekdayOfMonth(date) {
  return Math.ceil(date.getDate() / 7);
}

function getMonthlyRecurrenceDate(baseDate, monthsToAdd) {
  const weekday = baseDate.getDay();
  const nth = nthWeekdayOfMonth(baseDate);
  const targetMonthStart = addMonths(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1), monthsToAdd);
  const firstWeekday = targetMonthStart.getDay();
  const dayOffset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + dayOffset + (nth - 1) * 7;
  const candidate = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth(), day);
  if (candidate.getMonth() !== targetMonthStart.getMonth()) return null; // e.g. no 5th Tuesday this month
  return candidate;
}

function generateRecurrenceDates(startDateStr, recurrence, endDateStr) {
  const start = new Date(startDateStr);
  const end = endOfDay(new Date(endDateStr));
  const dates = [];
  let i = 0;
  while (i < 366) { // safety cap, ~1 year of daily occurrences max
    let next;
    if (recurrence === "Daily") next = addDays(start, i);
    else if (recurrence === "Weekly") next = addWeeks(start, i);
    else if (recurrence === "Monthly") next = getMonthlyRecurrenceDate(start, i);
    else break;

    i++;
    if (!next) continue; // Monthly: this month had no matching nth weekday, try next month
    if (isAfter(next, end)) break;
    dates.push(next);
  }
  return dates.length ? dates : [start];
}

async function createMeeting(req, res) {
  const body = req.body;
  const responsiblePerson = parseResponsiblePerson(body.responsible_person);
  if (!responsiblePerson.length) {
    return res.status(400).json({ message: "Responsible person is required" });
  }

  const meetingDate = body.meeting_date || new Date();
  const attachments = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const isRecurring = body.recurrence && body.recurrence !== "None" && body.recurrence_end_date;

  if (!isRecurring) {
    const meeting = await Meeting.create({
      ...body,
      created_by: req.user._id,
      coo_id: body.coo_id || req.user.coo_id,
      task_create_date: body.task_create_date || new Date(),
      initial_meeting_date: body.initial_meeting_date || meetingDate,
      meeting_date: meetingDate,
      meeting_link: body.meeting_link?.trim() || undefined,
      attachments,
      responsible_person: responsiblePerson
    });
    Promise.all(responsiblePerson.map(async (u) => {
      await sendMeetingAssignedEmail(meeting, { email: u.email, name: u.name }, req.user).catch(() => { });
    }));
    return res.status(201).json(meeting);
  }

  // Recurring: generate one meeting per occurrence
  const occurrenceDates = generateRecurrenceDates(meetingDate, body.recurrence, body.recurrence_end_date);
  const recurrenceGroupId = new mongoose.Types.ObjectId();

  const docs = occurrenceDates.map((date) => ({
    ...body,
    created_by: req.user._id,
    coo_id: body.coo_id || req.user.coo_id,
    task_create_date: body.task_create_date || new Date(),
    initial_meeting_date: date,
    meeting_date: date,
    meeting_link: body.meeting_link?.trim() || undefined,
    attachments,
    responsible_person: responsiblePerson,
    recurrence_group_id: recurrenceGroupId
  }));

  const created = await Meeting.insertMany(docs);

  Promise.all(
    created.flatMap((meeting) =>
      responsiblePerson.map((u) =>
        sendMeetingAssignedEmail(meeting, { email: u.email, name: u.name }, req.user).catch(() => { })
      )
    )
  );

  res.status(201).json({ count: created.length, meetings: created });
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
      responsible_person: responsiblePersonLabel(m.responsible_person),
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
  if (req.body.meeting_link) update.meeting_link = req.body.meeting_link.trim();
  if (update.responsible_person !== undefined) {
    update.responsible_person = parseResponsiblePerson(update.responsible_person);
  }

  const newAttachments = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const willAddRecurrence = update.recurrence && update.recurrence !== "None" && update.recurrence_end_date;

  const mongoUpdate = newAttachments.length
    ? { $set: update, $push: { attachments: { $each: newAttachments } } }
    : { $set: update };

  const meeting = await Meeting.findOneAndUpdate(
    { _id: req.params.id, coo_id: req.user.coo_id },
    mongoUpdate,
    { new: true }
  );
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  let generatedCount = 0;

  if (willAddRecurrence) {
    const recurrenceGroupId = meeting.recurrence_group_id || new mongoose.Types.ObjectId();
    if (!meeting.recurrence_group_id) {
      await Meeting.updateOne({ _id: meeting._id }, { recurrence_group_id: recurrenceGroupId });
    }

    const allDates = generateRecurrenceDates(meeting.meeting_date, update.recurrence, update.recurrence_end_date);
    // Skip the occurrence matching this meeting's own date — it already exists
    const futureDates = allDates.filter(
      (d) => d.toDateString() !== new Date(meeting.meeting_date).toDateString()
    );

    if (futureDates.length) {
      const attachments = newAttachments.length ? newAttachments : (meeting.attachments || []);
      const docs = futureDates.map((date) => ({
        title: meeting.title,
        description: meeting.description,
        meeting_type: meeting.meeting_type,
        meeting_time: meeting.meeting_time,
        priority: meeting.priority,
        discussion_topic: meeting.discussion_topic,
        reminder_date: meeting.reminder_date,
        meeting_link: meeting.meeting_link,
        recurrence: update.recurrence,
        responsible_person: meeting.responsible_person,
        created_by: req.user._id,
        coo_id: req.user.coo_id,
        task_create_date: new Date(),
        initial_meeting_date: date,
        meeting_date: date,
        attachments,
        recurrence_group_id: recurrenceGroupId,
        status: "Pending"
      }));
      const created = await Meeting.insertMany(docs);
      generatedCount = created.length;

      Promise.all(
        created.flatMap((m) =>
          (meeting.responsible_person || []).map((u) =>
            sendMeetingAssignedEmail(m, { email: u.email, name: u.name }, req.user).catch(() => { })
          )
        )
      );
    }
  }

  if (update.responsible_person?.length) {
    Promise.all(update.responsible_person.map(async (u) => {
      await sendMeetingAssignedEmail(meeting, { email: u.email, name: u.name }, req.user).catch(() => { });
    }));
  }

  res.json({ ...meeting.toObject(), generatedCount });
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
  updateMeeting,
  getMeetingTimeline,
  getCalendarEvents,
  removeMeeting
};
