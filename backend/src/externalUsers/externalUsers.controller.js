const ExternalUser = require("./externalUser.model");

function buildFilter(query, user) {
  const filter = { coo_id: user.coo_id };
  if (query.search) {
    const term = new RegExp(query.search, "i");
    filter.$or = [{ name: term }, { email: term }, { designation: term }, { company: term }];
  }
  return filter;
}

async function listExternalUsers(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const sortBy = req.query.sortBy || "name";
    const order = req.query.order === "desc" ? -1 : 1;
    const filter = buildFilter(req.query, req.user);

    const [items, total] = await Promise.all([
      ExternalUser.find(filter)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit),
      ExternalUser.countDocuments(filter)
    ]);

    res.json({ items, total, page, limit });
  } catch (error) {
    console.error("List External Users Error:", error);
    res.status(500).json({ message: "Failed to fetch external users", error: error.message });
  }
}

async function getExternalUser(req, res) {
  try {
    const item = await ExternalUser.findOne({ _id: req.params.id, coo_id: req.user.coo_id });
    if (!item) return res.status(404).json({ message: "External user not found" });
    res.json(item);
  } catch (error) {
    console.error("Get External User Error:", error);
    res.status(500).json({ message: "Failed to fetch external user", error: error.message });
  }
}

async function createExternalUser(req, res) {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const designation = (req.body.designation || "").trim();
    const company = (req.body.company || "").trim();

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existing = await ExternalUser.findOne({ coo_id: req.user.coo_id, email });
    if (existing) return res.status(400).json({ message: "A user with this email already exists" });

    const item = await ExternalUser.create({
      name,
      email,
      designation,
      company,
      coo_id: req.user.coo_id,
      created_by: req.user._id
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Create External User Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }
    res.status(500).json({ message: "Failed to create external user", error: error.message });
  }
}

async function updateExternalUser(req, res) {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const designation = (req.body.designation || "").trim();
    const company = (req.body.company || "").trim();

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });

    const duplicate = await ExternalUser.findOne({
      coo_id: req.user.coo_id,
      email,
      _id: { $ne: req.params.id }
    });
    if (duplicate) return res.status(400).json({ message: "A user with this email already exists" });

    const item = await ExternalUser.findOneAndUpdate(
      { _id: req.params.id, coo_id: req.user.coo_id },
      { name, email, designation, company },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "External user not found" });
    res.json(item);
  } catch (error) {
    console.error("Update External User Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }
    res.status(500).json({ message: "Failed to update external user", error: error.message });
  }
}

async function removeExternalUser(req, res) {
  try {
    const item = await ExternalUser.findOneAndDelete({ _id: req.params.id, coo_id: req.user.coo_id });
    if (!item) return res.status(404).json({ message: "External user not found" });
    res.json({ message: "External user deleted" });
  } catch (error) {
    console.error("Delete External User Error:", error);
    res.status(500).json({ message: "Failed to delete external user", error: error.message });
  }
}

module.exports = {
  listExternalUsers,
  getExternalUser,
  createExternalUser,
  updateExternalUser,
  removeExternalUser
};
