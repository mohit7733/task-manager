const Remark = require("./remark.model");
const Meeting = require("../meetings/meeting.model");
const { sendMeetingRemarkEmail } = require("../shared/emailService");

async function addRemark(req, res) {
  const meeting = await Meeting.findOne({ _id: req.body.meeting_id, coo_id: req.user.coo_id });
  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  const isCompleted = Boolean(req.body.final_outcome?.trim());
  const hasNextMeeting = Boolean(req.body.next_meeting_date);

  if (isCompleted && hasNextMeeting) {
    return res.status(400).json({
      message: "Cannot set final outcome and next meeting together. Choose either completed or followup."
    });
  }

  if (!req.body.remark_description?.trim()) {
    return res.status(400).json({ message: "Remark description is required" });
  }

  if (isCompleted && !req.body.final_outcome.trim()) {
    return res.status(400).json({ message: "Final outcome is required to complete the meeting" });
  }

  if (!isCompleted && !hasNextMeeting) {
    return res.status(400).json({ message: "Next meeting date is required when issue is not resolved" });
  }

  const count = await Remark.countDocuments({ meeting_id: meeting._id });

  const remarkData = {
    meeting_id: meeting._id,
    remark_number: count + 1,
    remark_date: req.body.remark_date || new Date(),
    remark_description: req.body.remark_description.trim(),
    created_by: req.user._id,
    attachment: req.file ? `/uploads/${req.file.filename}` : req.body.attachment,
    status: isCompleted ? "Completed" : req.body.status || "Pending"
  };

  if (isCompleted) {
    remarkData.final_outcome = undefined;
    meeting.final_outcome = req.body.final_outcome.trim();
    meeting.status = "Completed";
  } else {
    remarkData.next_meeting_date = req.body.next_meeting_date;
    remarkData.next_meeting_time = req.body.next_meeting_time;
    remarkData.next_agenda = req.body.next_agenda;
    remarkData.next_followup_note = req.body.next_followup_note;
    meeting.meeting_date = req.body.next_meeting_date;
    if (req.body.next_meeting_time) meeting.meeting_time = req.body.next_meeting_time;
    if (req.body.next_agenda) meeting.discussion_topic = req.body.next_agenda;
    meeting.status = req.body.status || "Pending";
  }

  const remark = await Remark.create(remarkData);
  await meeting.save();
  sendMeetingRemarkEmail(meeting, remark, req.user).catch(() => {});
  res.status(201).json(remark);
}

async function getRemarksByMeeting(req, res) {
  const remarks = await Remark.find({ meeting_id: req.params.meetingId }).sort({ remark_number: 1 });
  res.json(remarks);
}

module.exports = { addRemark, getRemarksByMeeting };
