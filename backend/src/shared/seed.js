require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDb = require("./db");
const User = require("../auth/user.model");
const Meeting = require("../meetings/meeting.model");
const Remark = require("../remarks/remark.model");
const Task = require("../tasks/task.model");
const TaskRemark = require("../tasks/taskRemark.model");

async function seed() {
  await connectDb();
  await Promise.all([
    Meeting.deleteMany({}),
    Remark.deleteMany({}),
    Task.deleteMany({}),
    TaskRemark.deleteMany({}),
    User.deleteMany({})
  ]);

  const password = await bcrypt.hash("pa123456", 10);
  const users = await User.insertMany([
    { name: "Super Admin", email: "super@coo.com", password, role: "Super Admin", coo_id: "coo_alpha" },
    { name: "COO Admin", email: "admin@coo.com", password, role: "Admin", coo_id: "coo_alpha" },
    { name: "PA Assistant", email: "pa@coo.com", password, role: "PA Assistant", coo_id: "coo_alpha" }
  ]);
  const pa = users[2];

  const m1 = await Meeting.create({
    task_create_date: new Date("2026-05-10"),
    meeting_date: new Date("2026-05-15"),
    meeting_time: "10:30",
    meeting_type: "internal",
    title: "Q2 Operations Review",
    description: "Review quarterly KPIs with COO",
    responsible_person: [{ name: "Rahul Sharma", email: "rahul@aimantra.co", emp_code: "EMP001" }],
    status: "In Progress",
    discussion_topic: "Budget allocation & hiring plan",
    priority: "High",
    reminder_date: new Date("2026-05-14"),
    created_by: pa._id,
    coo_id: "coo_alpha"
  });

  await Remark.insertMany([
    {
      meeting_id: m1._id,
      remark_number: 1,
      remark_date: new Date("2026-05-15"),
      remark_description: "Hiring freeze discussed; need finance sign-off",
      next_meeting_date: new Date("2026-05-22"),
      next_meeting_time: "11:00",
      next_agenda: "Finance approval follow-up",
      next_followup_note: "PA to chase CFO",
      status: "Pending",
      created_by: pa._id
    }
  ]);

  await Meeting.create({
    task_create_date: new Date(),
    meeting_date: new Date(),
    meeting_time: "14:00",
    meeting_type: "external",
    title: "Vendor Contract Renewal",
    description: "Annual SaaS renewal negotiation",
    responsible_person: [{ name: "Priya Nair", email: "priya@aimantra.co", emp_code: "EMP002" }],
    status: "Pending",
    discussion_topic: "Pricing & SLA terms",
    priority: "Critical",
    reminder_date: new Date(),
    created_by: pa._id,
    coo_id: "coo_alpha"
  });

  const t1 = await Task.create({
    title: "Update employee handbook",
    description: "Annual policy refresh for HR",
    department: "HR",
    assigned_to: "Anita Desai",
    status: "In Progress",
    priority: "High",
    next_review_date: new Date("2026-06-05"),
    weekly_meeting_day: "Monday",
    created_by: pa._id,
    coo_id: "coo_alpha"
  });

  await TaskRemark.create({
    task_id: t1._id,
    remark_number: 1,
    meeting_date: new Date("2026-05-26"),
    remark_description: "Legal review pending on leave policy section",
    pending_reason: "Waiting for legal sign-off on clause 4.2",
    status_after: "In Progress",
    next_review_date: new Date("2026-06-05"),
    created_by: pa._id
  });
  t1.latest_pending_reason = "Waiting for legal sign-off on clause 4.2";
  await t1.save();

  await Task.create({
    title: "Q3 budget forecast submission",
    department: "Finance",
    assigned_to: "Vikram Patel",
    status: "Pending",
    priority: "Critical",
    next_review_date: new Date("2026-06-02"),
    weekly_meeting_day: "Wednesday",
    created_by: pa._id,
    coo_id: "coo_alpha"
  });

  await Task.create({
    title: "Migrate legacy CRM data",
    department: "IT",
    assigned_to: "Sneha Iyer",
    status: "Done",
    priority: "Medium",
    final_outcome: "Migration completed; UAT passed on 22 May",
    created_by: pa._id,
    coo_id: "coo_alpha"
  });

  console.log("Seed complete. Login: pa@coo.com / pa123456");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
