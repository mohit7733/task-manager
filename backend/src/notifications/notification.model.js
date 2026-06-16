const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User", index: true },
    meeting_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_Meeting", index: true },
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_Task", index: true },
    reminder_key: { type: String, index: true },
    recipient_email: { type: String, lowercase: true, trim: true },
    title: String,
    message: String,
    type: { type: String, enum: ["upcoming", "overdue", "system"], default: "system" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_Notification", notificationSchema);
