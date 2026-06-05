const Notification = require("./notification.model");

async function listNotifications(req, res) {
  const items = await Notification.find({ user_id: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(items);
}

async function markRead(req, res) {
  await Notification.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, { isRead: true });
  res.json({ success: true });
}

module.exports = { listNotifications, markRead };
