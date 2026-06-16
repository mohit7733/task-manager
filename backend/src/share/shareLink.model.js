const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    resource_type: { type: String, enum: ["task", "meeting"], required: true, index: true },
    resource_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    coo_id: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true, index: true },
    revoked_at: Date
  },
  { timestamps: true }
);

shareLinkSchema.index({ resource_type: 1, resource_id: 1 });

module.exports = mongoose.model("PA_ShareLink", shareLinkSchema);
