require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const connectDb = require("./shared/db");
const { notFound, errorHandler } = require("./shared/middleware/errorMiddleware");
const authRoutes = require("./auth/auth.routes");
const meetingRoutes = require("./meetings/meetings.routes");
const remarkRoutes = require("./remarks/remarks.routes");
const notificationRoutes = require("./notifications/notifications.routes");
const dashboardRoutes = require("./dashboard/dashboard.routes");
const taskRoutes = require("./tasks/tasks.routes");
const externalUserRoutes = require("./externalUsers/externalUsers.routes");
const publicShareRoutes = require("./share/share.routes");
const { startReminderEngine } = require("./notifications/reminderCron");

const app = express();
connectDb();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/public", publicShareRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/remarks", remarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/external-users", externalUserRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5001;
app.listen(port, () => {
  startReminderEngine();
  console.log(`Backend running on port ${port}`);
});
