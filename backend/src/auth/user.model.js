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
    coo_id: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PA_User", userSchema);
