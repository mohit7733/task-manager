const { loadSharePayload, ensureCalendarShareLink, revokeCalendarShareLink, shareUrl, calendarShareUrl  } = require("./share.service");

async function getPublicShare(req, res) {
  try {
    res.set("Cache-Control", "no-store");
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.set("Referrer-Policy", "no-referrer");

    const payload = await loadSharePayload(req.params.token);
    if (!payload) {
      return res.status(404).json({ message: "This share link is invalid or has expired." });
    }
    res.json(payload);
  } catch (error) {
    console.error("Public share error:", error);
    res.status(500).json({ message: "Failed to load shared content" });
  }
}

async function generateCalendarShare(req, res) {
  try {
    const token = await ensureCalendarShareLink(req.user._id, req.user.coo_id);
     res.json({ url: calendarShareUrl(token) });
  } catch (error) {
    console.error("Generate calendar share error:", error);
    res.status(500).json({ message: "Failed to generate calendar link" });
  }
}

async function revokeCalendarShare(req, res) {
  try {
    await revokeCalendarShareLink(req.user.coo_id);
    res.json({ success: true });
  } catch (error) {
    console.error("Revoke calendar share error:", error);
    res.status(500).json({ message: "Failed to revoke calendar link" });
  }
}

module.exports = { getPublicShare, generateCalendarShare, revokeCalendarShare };