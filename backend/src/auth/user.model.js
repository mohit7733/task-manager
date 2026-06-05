const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Super Admin", "Admin", "PA Assistant"],
      default: "PA Assistant"
    },
    coo_id: { type: String, required: true, index: true },
    email_notifications_enabled: { type: Boolean, default: true },
    reminder_lead_hours: { type: Number, default: 24 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_User", userSchema);
