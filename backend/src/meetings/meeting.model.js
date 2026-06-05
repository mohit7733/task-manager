const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    task_create_date: Date,
    initial_meeting_date: Date,
    meeting_date: Date,
    meeting_time: String,
    meeting_type: { type: String, enum: ["internal", "external"], default: "internal" },
    title: { type: String, required: true },
    description: String,
    responsible_person: String,
    status: { type: String, enum: ["Pending", "In Progress", "Completed", "Rescheduled"], default: "Pending" },
    discussion_topic: String,
    final_outcome: String,
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    reminder_date: Date,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User" },
    coo_id: { type: String, required: true, index: true },
    attachment: String,
    recurrence: { type: String, enum: ["None", "Daily", "Weekly", "Monthly"], default: "None" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_Meeting", meetingSchema);
