const { loadSharePayload } = require("./share.service");

async function getPublicShare(req, res) {
  try {
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

module.exports = { getPublicShare };
