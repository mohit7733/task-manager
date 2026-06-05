const mongoose = require("mongoose");

const DEPARTMENTS = [
  "HR",
  "Finance",
  "Operations",
  "IT",
  "Sales",
  "Marketing",
  "Legal",
  "Procurement",
  "Administration",
  "Other"
];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    department: { type: String, enum: DEPARTMENTS, required: true, index: true },
    assigned_to: { type: String, required: true, trim: true },
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

taskSchema.statics.DEPARTMENTS = DEPARTMENTS;

module.exports = mongoose.model("PA_Task", taskSchema);
