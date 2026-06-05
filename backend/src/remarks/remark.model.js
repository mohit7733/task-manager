const mongoose = require("mongoose");

const remarkSchema = new mongoose.Schema(
  {
    meeting_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_Meeting", index: true, required: true },
    remark_number: Number,
    remark_date: { type: Date, default: Date.now },
    remark_description: { type: String, required: true },
    next_meeting_date: Date,
    next_meeting_time: String,
    next_agenda: String,
    next_followup_note: String,
    status: { type: String, enum: ["Pending", "In Progress", "Completed", "Rescheduled"], default: "Pending" },
    attachment: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_Remark", remarkSchema);
