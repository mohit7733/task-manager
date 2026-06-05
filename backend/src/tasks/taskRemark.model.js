const mongoose = require("mongoose");

const taskRemarkSchema = new mongoose.Schema(
  {
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_Task", index: true, required: true },
    remark_number: Number,
    remark_date: { type: Date, default: Date.now },
    meeting_date: Date,
    remark_description: { type: String, required: true },
    pending_reason: String,
    completion_note: String,
    status_after: { type: String, enum: ["Pending", "In Progress", "Done"], default: "Pending" },
    next_review_date: Date,
    attachment: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_TaskRemark", taskRemarkSchema);
