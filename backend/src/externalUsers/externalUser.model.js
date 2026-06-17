const mongoose = require("mongoose");

const externalUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    designation: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    coo_id: { type: String, required: true, index: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "PA_User" }
  },
  { timestamps: true }
);

externalUserSchema.index({ coo_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("PA_ExternalUser", externalUserSchema);
