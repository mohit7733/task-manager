const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User", index: true },
    meeting_id: { type: mongoose.Schema.Types.ObjectId, ref: "PA_Meeting", index: true },
    title: String,
    message: String,
    type: { type: String, enum: ["upcoming", "overdue", "system"], default: "system" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_Notification", notificationSchema);
