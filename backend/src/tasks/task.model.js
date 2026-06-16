const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    department: { type: String, required: true, index: true },
    assigned_to: { type: [{ type: Object, required: true }], required: true },
    status: { type: String, enum: ["Pending", "In Progress", "Done"], default: "Pending", index: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    task_create_date: { type: Date, default: Date.now },
    next_review_date: Date,
    weekly_meeting_day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", ""],
      default: ""
    },
    final_outcome: String,
    latest_pending_reason: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User" },
    coo_id: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_Task", taskSchema);
