const router = require("express").Router();
const { getPublicShare } = require("./share.controller");

router.get("/share/:token", getPublicShare);

module.exports = router;
