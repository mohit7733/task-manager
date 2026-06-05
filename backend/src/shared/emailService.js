const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || process.env.EMAIL_ENABLED === "false") return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

function appUrl() {
  return process.env.APP_URL || "http://localhost:5173";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(t) {
  // Expects string in "HH:mm" or "H:mm" or Date
  if (!t) return "";
  if (typeof t === "string" && /^([01]?\d|2[0-3]):[0-5]?\d$/.test(t)) return t;
  try {
    const d = new Date(`1970-01-01T${t}`);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return t;
  }
}

async function sendEmail({ to, subject, html, text, attachments }) {
  if (!to) return { skipped: true, reason: "no recipient" };
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@execuflow.app";

  if (!transport) {
    console.log(`[Email] SMTP not configured — would send to ${to}: ${subject}`);
    return { skipped: true, reason: "smtp not configured" };
  }

  try {
    const info = await transport.sendMail({ from, to, subject, html, text, attachments });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { sent: false, error: err.message };
  }
}

function fileAttachment(storedPath) {
  if (!storedPath) return null;
  const rel = storedPath.replace(/^\//, "");
  const abs = path.join(__dirname, "..", "..", rel);
  if (!fs.existsSync(abs)) return null;
  return { filename: path.basename(abs), path: abs };
}

const APP_NAME = "ExecuFlow";

function emailBaseTemplate({ title, body, customFooter }) {
  return `
    <div style="background:#f1f5f9;min-width:100vw;padding:24px 0">
      <table cellspacing="0" cellpadding="0" align="center" style="max-width:540px;background:#fff;border-radius:12px;box-shadow:0 2px 18px #4f46e51a;margin:0 auto;font-family:'Segoe UI',Roboto,sans-serif">
        <tr>
          <td style="padding:28px 30px 20px;text-align:center;border-top-left-radius:12px;border-top-right-radius:12px;background:linear-gradient(135deg,#2563eb,#4f46e5)">
            <div style="display:inline-block;width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,.2);line-height:44px;font-weight:700;color:#fff;font-size:15px">EF</div>
            <h2 style="margin:12px 0 0;font-weight:700;font-size:1.35rem;color:#ffffff">${title}</h2>
            <p style="margin:6px 0 0;font-size:.8rem;color:#c7d2fe">${APP_NAME}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 30px 16px">${body}</td>
        </tr>
        <tr>
          <td style="padding:0 30px 28px;text-align:center;font-size:.85em;color:#64748b">
            ${customFooter || "For support, contact your administrator."}
          </td>
        </tr>
      </table>
      <div style="max-width:540px;margin:16px auto 0;text-align:center;color:#94a3b8;font-size:12px">
        &copy; ${new Date().getFullYear()} ${APP_NAME}
      </div>
    </div>
  `;
}

// Generate details row for table
function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:.35em 16px .35em 0;color:#374151;font-weight:bold;width:130px">${label}</td>
      <td style="padding:.35em 0;color:#374151;">${value != null && value !== "" ? value : "—"}</td>
    </tr>
  `;
}

async function sendMeetingAssignedEmail(meeting, creator) {
  const to = meeting.responsible_email;
  if (!to) return;
  const subject = `Meeting Assigned: ${meeting.title}`;
  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin:14px 0">
      ${detailRow("Title", meeting.title)}
      ${detailRow("Scheduled By", creator?.name || "PA")}
      ${detailRow("Date", fmtDate(meeting.meeting_date))}
      ${detailRow("Time", meeting.meeting_time ? fmtTime(meeting.meeting_time) : "—")}
      ${detailRow("Responsible Person", meeting.responsible_person || "—")}
      ${detailRow("Status", meeting.status)}
      ${detailRow("Priority", meeting.priority || "Medium")}
      ${detailRow("Location", meeting.location || "—")}
      ${detailRow("Description", meeting.description || "—")}
    </table>
  `;
  const body = `
    <p style="font-size:1.06em;color:#374151">Hi ${meeting.responsible_person || "there"},</p>
    <p style="color:#374151">You have been assigned the following meeting:</p>
    ${detailsTable}
  `;
  const html = emailBaseTemplate({
    title: "New Meeting Assigned",
    body,
    // ctaLabel: "View in PA Manager",
    // ctaLink: `${appUrl()}/meetings`
  });

  return sendEmail({ to, subject, html, text: subject });
}

async function sendTaskAssignedEmail(task, creator) {
  const to = task.assigned_email;
  if (!to) return;
  const subject = `Task Assigned: ${task.title}`;
  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin:14px 0">
      ${detailRow("Task", task.title)}
      ${detailRow("Assigned By", creator?.name || "PA")}
      ${detailRow("Department", task.department || "—")}
      ${detailRow("Assigned To", task.assigned_to || "—")}
      ${detailRow("Status", task.status)}
      ${detailRow("Priority", task.priority || "Medium")}
      ${detailRow("Next Review", task.next_review_date ? fmtDate(task.next_review_date) : "—")}
      ${detailRow("Deadline", task.deadline ? fmtDate(task.deadline) : "—")}
      ${detailRow("Description", task.description || "—")}
    </table>
  `;
  const body = `
    <p style="font-size:1.06em;color:#374151">Hi ${task.assigned_to || "there"},</p>
    <p style="color:#374151">You have been assigned the following department task:</p>
    ${detailsTable}
  `;
  const html = emailBaseTemplate({
    title: "New Task Assigned",
    body,
    // ctaLabel: "View in PA Manager",
    // ctaLink: `${appUrl()}/tasks`
  });

  return sendEmail({ to, subject, html, text: subject });
}

async function sendMeetingRemarkEmail(meeting, remark, creator) {
  const recipients = [meeting.responsible_email].filter(Boolean);
  if (!recipients.length) return;
  const subject = `MOM Update: ${meeting.title} — Remark #${remark.remark_number}`;
  const attach = fileAttachment(remark.attachment);

  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin:14px 0">
      ${detailRow("Meeting", meeting.title)}
      ${detailRow("Remark #", remark.remark_number)}
      ${detailRow("By", creator?.name || "PA")}
      ${detailRow("Date", remark.remark_date ? fmtDate(remark.remark_date) : "—")}
      ${detailRow("Description", remark.remark_description || "—")}
      ${remark.next_meeting_date ? detailRow("Next Meeting", fmtDate(remark.next_meeting_date)) : ""}
      ${remark.next_meeting_time ? detailRow("Next Meeting Time", fmtTime(remark.next_meeting_time)) : ""}
      ${remark.next_agenda ? detailRow("Next Agenda", remark.next_agenda) : ""}
      ${remark.next_followup_note ? detailRow("Next Followup Note", remark.next_followup_note) : ""}
      ${attach ? detailRow("Attachment", `<span style="color:#4338ca">Attached below</span>`) : ""}
    </table>
  `;
  const body = `
    <p style="font-size:1.06em;color:#374151">Hello,</p>
    <p style="color:#374151">A new remark has been added to the meeting:</p>
    ${detailsTable}
    ${attach ? '<div style="margin:14px 0 0 0; font-size:0.95em; color: #374151;">MOM document is attached below.</div>' : ""}
  `;

  const html = emailBaseTemplate({
    title: "Meeting Remark Added",
    body,
    // ctaLabel: "View Timeline",
    // ctaLink: `${appUrl()}/meetings`
  });

  return sendEmail({
    to: recipients.join(","),
    subject,
    html,
    text: subject,
    attachments: attach ? [attach] : undefined
  });
}

async function sendTaskRemarkEmail(task, remark, creator) {
  const to = task.assigned_email;
  if (!to) return;
  const subject = `Task Remark: ${task.title} — #${remark.remark_number}`;
  const attach = fileAttachment(remark.attachment);

  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin:14px 0">
      ${detailRow("Task", task.title)}
      ${detailRow("Department", task.department || "—")}
      ${detailRow("Remark #", remark.remark_number)}
      ${detailRow("By", creator?.name || "PA")}
      ${detailRow("Date", remark.remark_date ? fmtDate(remark.remark_date) : "—")}
      ${detailRow("Description", remark.remark_description || "—")}
      ${remark.pending_reason ? detailRow("Pending Reason", remark.pending_reason) : ""}
      ${remark.completion_note ? detailRow("Completed Note", remark.completion_note) : ""}
      ${remark.next_review_date ? detailRow("Next Review", fmtDate(remark.next_review_date)) : ""}
      ${remark.next_agenda ? detailRow("Next Agenda", remark.next_agenda) : ""}
      ${remark.next_followup_note ? detailRow("Next Followup Note", remark.next_followup_note) : ""}
      ${attach ? detailRow("Attachment", `<span style="color:#4338ca">Attached below</span>`) : ""}
    </table>
  `;
  const body = `
    <p style="font-size:1.06em;color:#374151">Hello,</p>
    <p style="color:#374151">A new remark has been added to the department task:</p>
    ${detailsTable}
    ${attach ? '<div style="margin:14px 0 0 0; font-size:0.95em; color: #374151;">MOM document is attached below.</div>' : ""}
  `;

  const html = emailBaseTemplate({
    title: "Department Task Remark",
    body,
    // ctaLabel: "View Timeline",
    // ctaLink: `${appUrl()}/tasks`
  });

  return sendEmail({
    to,
    subject,
    html,
    text: subject,
    attachments: attach ? [attach] : undefined
  });
}

async function sendReminderEmail({ to, title, message, type }) {
  const color = type === "overdue" ? "#dc2626" : "#2563eb";
  const icon = type === "overdue"
    ? "🔔"
    : "⏰";
  const body = `
    <div style="color:#374151;font-size:1.07em;margin-bottom:12px;line-height:1.6">
      ${icon} ${message}
    </div>
  `;
  const html = emailBaseTemplate({
    title: title,
    body,
    customFooter: `<a href="${appUrl()}" style="color:#4f46e5">Open ${APP_NAME}</a>`
  });
  return sendEmail({ to, subject: title, html, text: `${title}\n${message}` });
}

module.exports = {
  sendEmail,
  sendMeetingAssignedEmail,
  sendTaskAssignedEmail,
  sendMeetingRemarkEmail,
  sendTaskRemarkEmail,
  sendReminderEmail
};
