const router = require("express").Router();
const {
  listExternalUsers,
  getExternalUser,
  createExternalUser,
  updateExternalUser,
  removeExternalUser
} = require("./externalUsers.controller");
const { protect } = require("../shared/middleware/authMiddleware");

router.use(protect);
router.get("/", listExternalUsers);
router.get("/:id", getExternalUser);
router.post("/", createExternalUser);
router.put("/:id", updateExternalUser);
router.delete("/:id", removeExternalUser);

module.exports = router;
