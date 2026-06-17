const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { ensureShareLink, shareUrl, appUrl } = require("../share/share.service");

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

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(t) {
  if (!t) return "";
  if (typeof t === "string" && /^([01]?\d|2[0-3]):[0-5]?\d$/.test(t)) {
    const [h, m] = t.split(":");
    try {
      const d = new Date(`1970-01-01T${h.padStart(2, "0")}:${(m || "0").padStart(2, "0")}:00`);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return t;
    }
  }
  try {
    const d = new Date(`1970-01-01T${t}`);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
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
const APP_TAGLINE = "Executive Meeting & Task Intelligence";

function escapeHtml(str) {
  if (str == null || str === "") return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priorityVariant(priority) {
  const map = {
    Low: "info",
    Medium: "default",
    High: "warning",
    Critical: "danger"
  };
  return map[priority] || "default";
}

function statusVariant(status) {
  const map = {
    Pending: "warning",
    "In Progress": "info",
    Done: "success",
    Completed: "success",
    Rescheduled: "default"
  };
  return map[status] || "default";
}

function statusBadge(text, variant = "default") {
  const colors = {
    default: { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
    success: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
    warning: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    danger: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    info: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }
  };
  const c = colors[variant] || colors.default;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${c.bg};color:${c.color};border:1px solid ${c.border};font-size:12px;font-weight:600;line-height:1.4;white-space:nowrap">${escapeHtml(text)}</span>`;
}

function standardFooterHtml({ guest = false } = {}) {
  const url = escapeHtml(appUrl());
  const app = escapeHtml(APP_NAME);
  if (guest) {
    return `This email includes a secure read-only guest link. For full access, sign in at <a href="${url}" style="color:#4f46e5;font-weight:600">${app}</a>.`;
  }
  return `Need assistance? Contact your administrator or open <a href="${url}" style="color:#4f46e5;font-weight:600">${app}</a>.`;
}

function emailStyles() {
  return `
    <style type="text/css">
      body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
      img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; }
      a { color: #4f46e5; text-decoration: none; }
      a:hover { text-decoration: underline; }
      @media only screen and (max-width: 620px) {
        .email-shell { padding: 12px !important; }
        .email-container { width: 100% !important; max-width: 100% !important; border-radius: 14px !important; }
        .email-header { padding: 24px 20px 20px !important; }
        .email-body { padding: 22px 18px 12px !important; }
        .email-footer { padding: 0 18px 22px !important; }
        .email-title { font-size: 22px !important; line-height: 1.25 !important; }
        .email-intro { font-size: 15px !important; }
        .details-card { border-radius: 12px !important; }
        .details-card-inner { padding: 14px !important; }
        .detail-label,
        .detail-value {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .detail-label {
          padding: 0 0 4px !important;
          font-size: 11px !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          color: #64748b !important;
        }
        .detail-value {
          padding: 0 0 14px !important;
          margin: 0 0 2px !important;
          font-size: 15px !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .detail-row:last-child .detail-value {
          border-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        .cta-button {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        .alert-card { padding: 16px !important; }
      }
    </style>
  `;
}

function emailButton(label, href) {
  if (!label || !href) return "";
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto 8px">
      <tr>
        <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#2563eb,#4f46e5);box-shadow:0 4px 14px rgba(79,70,229,0.35)">
          <a href="${escapeHtml(href)}" class="cta-button" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;border-radius:10px;line-height:1.2">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function emailBaseTemplate({ title, preheader, body, ctaLabel, ctaLink, customFooter }) {
  const preheaderText = preheader || title;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  ${emailStyles()}
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">
    ${escapeHtml(preheaderText)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9">
    <tr>
      <td align="center" class="email-shell" style="padding:24px 16px">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08)">
          <tr>
            <td class="email-header" style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 55%,#6366f1 100%)">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.18);line-height:48px;font-weight:700;color:#ffffff;font-size:16px;letter-spacing:0.04em">EF</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px">
                    <h1 class="email-title" style="margin:0;font-size:26px;line-height:1.2;font-weight:700;color:#ffffff;font-family:'Segoe UI',Roboto,Arial,sans-serif">${escapeHtml(title)}</h1>
                    <p style="margin:8px 0 0;font-size:13px;color:#dbeafe;font-family:'Segoe UI',Roboto,Arial,sans-serif">${APP_NAME} · ${APP_TAGLINE}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="padding:30px 32px 10px;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#334155;line-height:1.6">
              ${body}
              ${emailButton(ctaLabel, ctaLink)}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:8px 32px 28px;text-align:center;font-family:'Segoe UI',Roboto,Arial,sans-serif">
              <div style="height:1px;background:#e2e8f0;margin:0 0 18px"></div>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
                ${customFooter || standardFooterHtml()}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;font-family:'Segoe UI',Roboto,Arial,sans-serif">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function introBlock(greeting, message) {
  return `
    <p class="email-intro" style="margin:0 0 8px;font-size:17px;font-weight:600;color:#0f172a">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7">${escapeHtml(message)}</p>
  `;
}

function detailsCard(rowsHtml) {
  return `
    <table role="presentation" class="details-card" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
      <tr>
        <td class="details-card-inner" style="padding:18px 20px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function detailRow(label, value, { html = false } = {}) {
  const isEmpty = value == null || value === "";
  const displayValue = isEmpty ? "—" : value;
  const safeValue = html ? displayValue : escapeHtml(String(displayValue));
  return `
    <tr class="detail-row">
      <td class="detail-label" valign="top" style="padding:10px 16px 10px 0;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;width:34%;font-family:'Segoe UI',Roboto,Arial,sans-serif">${escapeHtml(label)}</td>
      <td class="detail-value" valign="top" style="padding:10px 0;color:#0f172a;font-size:15px;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif">${safeValue}</td>
    </tr>
  `;
}

function linkValue(url, label) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label || url);
  return `<a href="${safeUrl}" style="color:#4f46e5;font-weight:600;word-break:break-all">${safeLabel}</a>`;
}

function alertCard(message, type = "info") {
  const styles = {
    overdue: { bg: "#fef2f2", border: "#fecaca", accent: "#dc2626", icon: "!" },
    upcoming: { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", icon: "⏱" },
    info: { bg: "#f8fafc", border: "#e2e8f0", accent: "#475569", icon: "i" }
  };
  const s = styles[type] || styles.info;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="alert-card" style="width:100%;background:${s.bg};border:1px solid ${s.border};border-radius:14px">
      <tr>
        <td style="padding:18px 20px">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td valign="top" style="padding-right:12px">
                <div style="width:28px;height:28px;border-radius:999px;background:${s.accent};color:#ffffff;text-align:center;line-height:28px;font-size:14px;font-weight:700">${s.icon}</div>
              </td>
              <td valign="top" style="font-size:15px;color:#334155;line-height:1.7;font-family:'Segoe UI',Roboto,Arial,sans-serif">
                ${escapeHtml(message)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function meetingDetailRows(meeting, { assigneeName } = {}) {
  return `
    ${detailRow("Title", meeting.title)}
    ${detailRow("Date", fmtDate(meeting.meeting_date))}
    ${detailRow("Time", meeting.meeting_time ? fmtTime(meeting.meeting_time) : "—")}
    ${assigneeName ? detailRow("Responsible Person", assigneeName) : ""}
    ${detailRow("Status", statusBadge(meeting.status, statusVariant(meeting.status)), { html: true })}
    ${detailRow("Priority", statusBadge(meeting.priority || "Medium", priorityVariant(meeting.priority)), { html: true })}
    ${meeting.location ? detailRow("Location", meeting.location) : ""}
    ${meeting.meeting_link ? detailRow("Meeting Link", linkValue(meeting.meeting_link, "Open meeting link"), { html: true }) : ""}
  `;
}

function taskDetailRows(task, { assigneeName } = {}) {
  return `
    ${detailRow("Task", task.title)}
    ${detailRow("Department", task.department || "—")}
    ${assigneeName ? detailRow("Assigned To", assigneeName) : ""}
    ${detailRow("Status", statusBadge(task.status, statusVariant(task.status)), { html: true })}
    ${detailRow("Priority", statusBadge(task.priority || "Medium", priorityVariant(task.priority)), { html: true })}
    ${detailRow("Next Review", task.next_review_date ? fmtDate(task.next_review_date) : "—")}
    ${task.deadline ? detailRow("Deadline", fmtDate(task.deadline)) : ""}
  `;
}

function buildPlainText({ greeting, message, rows = [], ctaLabel, ctaLink }) {
  const lines = [];
  if (greeting) lines.push(greeting);
  if (message) lines.push(message, "");
  for (const [label, value] of rows) {
    lines.push(`${label}: ${value ?? "—"}`);
  }
  if (ctaLabel && ctaLink) lines.push("", `${ctaLabel}: ${ctaLink}`);
  lines.push("", `— ${APP_NAME}`);
  return lines.join("\n");
}

async function sendMeetingAssignedEmail(meeting, data, creator) {
  const to = data.email;
  const name = data.name;
  if (!to || !name) return;
  const shareToken = await ensureShareLink("meeting", meeting._id, meeting.coo_id);
  const subject = `Meeting Assigned: ${meeting.title}`;
  const ctaLink = shareUrl(shareToken);
  const detailsTable = detailsCard(`
    ${detailRow("Scheduled By", creator?.name || "PA")}
    ${meetingDetailRows(meeting, { assigneeName: name })}
    ${meeting.description ? detailRow("Description", meeting.description) : ""}
  `);
  const body = `
    ${introBlock(`Hi ${name},`, "You have been assigned the following meeting. Please review the details below.")}
    ${detailsTable}
  `;
  const html = emailBaseTemplate({
    title: "New Meeting Assigned",
    preheader: `Meeting assigned: ${meeting.title}`,
    body,
    ctaLabel: "View Meeting Details",
    ctaLink,
    customFooter: standardFooterHtml({ guest: true })
  });
  const text = buildPlainText({
    greeting: `Hi ${name},`,
    message: "You have been assigned the following meeting.",
    rows: [
      ["Title", meeting.title],
      ["Date", fmtDate(meeting.meeting_date)],
      ["Time", meeting.meeting_time ? fmtTime(meeting.meeting_time) : "—"],
      ["Status", meeting.status],
      ["Priority", meeting.priority || "Medium"]
    ],
    ctaLabel: "View Meeting Details",
    ctaLink
  });

  return sendEmail({ to, subject, html, text });
}

async function sendTaskAssignedEmail(task, data, creator) {
  const to = data.email;
  const name = data.name;
  if (!to || !name) return;
  const shareToken = await ensureShareLink("task", task._id, task.coo_id);
  const subject = `Task Assigned: ${task.title}`;
  const ctaLink = shareUrl(shareToken);
  const detailsTable = detailsCard(`
    ${detailRow("Assigned By", creator?.name || "PA")}
    ${taskDetailRows(task, { assigneeName: name })}
    ${task.description ? detailRow("Description", task.description) : ""}
  `);
  const body = `
    ${introBlock(`Hi ${name},`, "You have been assigned a new department task. Please review the details below.")}
    ${detailsTable}
  `;
  const html = emailBaseTemplate({
    title: "New Task Assigned",
    preheader: `Task assigned: ${task.title}`,
    body,
    ctaLabel: "View Task Details",
    ctaLink,
    customFooter: standardFooterHtml({ guest: true })
  });
  const text = buildPlainText({
    greeting: `Hi ${name},`,
    message: "You have been assigned a new department task.",
    rows: [
      ["Task", task.title],
      ["Department", task.department],
      ["Status", task.status],
      ["Next Review", task.next_review_date ? fmtDate(task.next_review_date) : "—"]
    ],
    ctaLabel: "View Task Details",
    ctaLink
  });

  return sendEmail({ to, subject, html, text });
}

function meetingResponsibleEmails(meeting) {
  if (Array.isArray(meeting.responsible_person)) {
    return meeting.responsible_person.map((u) => u.email).filter(Boolean);
  }
  return [];
}

async function sendMeetingRemarkEmail(meeting, remark, creator) {
  const recipients = meetingResponsibleEmails(meeting);
  if (!recipients.length) return;
  const shareToken = await ensureShareLink("meeting", meeting._id, meeting.coo_id);
  const subject = `MOM Update: ${meeting.title} — Remark #${remark.remark_number}`;
  const attach = fileAttachment(remark.attachment);
  const ctaLink = shareUrl(shareToken);

  const detailsTable = detailsCard(`
    ${detailRow("Meeting", meeting.title)}
    ${detailRow("Remark #", String(remark.remark_number))}
    ${detailRow("By", creator?.name || "PA")}
    ${detailRow("Date", remark.remark_date ? fmtDate(remark.remark_date) : "—")}
    ${detailRow("Description", remark.remark_description || "—")}
    ${remark.next_meeting_date ? detailRow("Next Meeting", fmtDate(remark.next_meeting_date)) : ""}
    ${remark.next_meeting_time ? detailRow("Next Meeting Time", fmtTime(remark.next_meeting_time)) : ""}
    ${remark.next_agenda ? detailRow("Next Agenda", remark.next_agenda) : ""}
    ${remark.next_followup_note ? detailRow("Next Followup Note", remark.next_followup_note) : ""}
    ${attach ? detailRow("Attachment", "Included with this email") : ""}
  `);
  const body = `
    ${introBlock("Hello,", "A new remark has been added to your meeting. Review the update below.")}
    ${detailsTable}
    ${attach ? '<p style="margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6">The MOM document is attached to this email.</p>' : ""}
  `;

  const html = emailBaseTemplate({
    title: "Meeting Remark Added",
    preheader: `New remark added for ${meeting.title}`,
    body,
    ctaLabel: "View Meeting Details",
    ctaLink,
    customFooter: standardFooterHtml({ guest: true })
  });

  return sendEmail({
    to: recipients.join(","),
    subject,
    html,
    text: buildPlainText({
      greeting: "Hello,",
      message: `New remark #${remark.remark_number} added for meeting: ${meeting.title}`,
      rows: [
        ["Description", remark.remark_description],
        ["By", creator?.name || "PA"]
      ],
      ctaLabel: "View Meeting Details",
      ctaLink
    }),
    attachments: attach ? [attach] : undefined
  });
}

async function sendTaskRemarkEmail(task, remark, creator) {
  const recipients = Array.isArray(task.assigned_to)
    ? task.assigned_to.map((u) => u.email).filter(Boolean)
    : [];
  if (!recipients.length) return;
  const shareToken = await ensureShareLink("task", task._id, task.coo_id);
  const subject = `Task Remark: ${task.title} — #${remark.remark_number}`;
  const attach = fileAttachment(remark.attachment);
  const ctaLink = shareUrl(shareToken);

  const detailsTable = detailsCard(`
    ${detailRow("Task", task.title)}
    ${detailRow("Department", task.department || "—")}
    ${detailRow("Remark #", String(remark.remark_number))}
    ${detailRow("By", creator?.name || "PA")}
    ${detailRow("Date", remark.remark_date ? fmtDate(remark.remark_date) : "—")}
    ${detailRow("Description", remark.remark_description || "—")}
    ${remark.pending_reason ? detailRow("Pending Reason", remark.pending_reason) : ""}
    ${remark.completion_note ? detailRow("Completed Note", remark.completion_note) : ""}
    ${remark.next_review_date ? detailRow("Next Review", fmtDate(remark.next_review_date)) : ""}
    ${remark.next_agenda ? detailRow("Next Agenda", remark.next_agenda) : ""}
    ${remark.next_followup_note ? detailRow("Next Followup Note", remark.next_followup_note) : ""}
    ${attach ? detailRow("Attachment", "Included with this email") : ""}
  `);
  const body = `
    ${introBlock("Hello,", "A new remark has been added to your department task. Review the update below.")}
    ${detailsTable}
    ${attach ? '<p style="margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6">The supporting document is attached to this email.</p>' : ""}
  `;

  const html = emailBaseTemplate({
    title: "Department Task Remark",
    preheader: `New remark added for ${task.title}`,
    body,
    ctaLabel: "View Task Details",
    ctaLink,
    customFooter: standardFooterHtml({ guest: true })
  });

  return sendEmail({
    to: recipients.join(","),
    subject,
    html,
    text: buildPlainText({
      greeting: "Hello,",
      message: `New remark #${remark.remark_number} added for task: ${task.title}`,
      rows: [
        ["Description", remark.remark_description],
        ["By", creator?.name || "PA"]
      ],
      ctaLabel: "View Task Details",
      ctaLink
    }),
    attachments: attach ? [attach] : undefined
  });
}

async function sendReminderEmail({ to, title, message, type, meeting, task }) {
  const alertType = type === "overdue" ? "overdue" : "upcoming";
  const introMessage =
    type === "overdue"
      ? "The following item requires your attention. Please review and take action."
      : "This is a reminder about an upcoming item on your schedule.";

  let detailsHtml = "";
  const plainRows = [];
  if (meeting) {
    detailsHtml = detailsCard(meetingDetailRows(meeting));
    plainRows.push(
      ["Meeting", meeting.title],
      ["Date", fmtDate(meeting.meeting_date)],
      ["Time", meeting.meeting_time ? fmtTime(meeting.meeting_time) : "—"],
      ["Status", meeting.status]
    );
  } else if (task) {
    detailsHtml = detailsCard(taskDetailRows(task));
    plainRows.push(
      ["Task", task.title],
      ["Department", task.department],
      ["Next Review", task.next_review_date ? fmtDate(task.next_review_date) : "—"],
      ["Status", task.status]
    );
  }

  const body = `
    ${introBlock("Hello,", introMessage)}
    ${alertCard(message, alertType)}
    ${detailsHtml ? `<div style="margin-top:20px">${detailsHtml}</div>` : ""}
  `;

  let ctaLabel = `Open ${APP_NAME}`;
  let ctaLink = appUrl();
  if (meeting?._id && meeting?.coo_id) {
    const shareToken = await ensureShareLink("meeting", meeting._id, meeting.coo_id);
    ctaLabel = "View Meeting Details";
    ctaLink = shareUrl(shareToken);
  } else if (task?._id && task?.coo_id) {
    const shareToken = await ensureShareLink("task", task._id, task.coo_id);
    ctaLabel = "View Task Details";
    ctaLink = shareUrl(shareToken);
  }

  const html = emailBaseTemplate({
    title,
    preheader: message,
    body,
    ctaLabel,
    ctaLink,
    customFooter: standardFooterHtml({ guest: Boolean(meeting || task) })
  });

  return sendEmail({
    to,
    subject: title,
    html,
    text: buildPlainText({
      greeting: "Hello,",
      message: `${message}${type === "overdue" ? " (Action required)" : ""}`,
      rows: plainRows,
      ctaLabel,
      ctaLink
    })
  });
}

module.exports = {
  sendEmail,
  sendMeetingAssignedEmail,
  sendTaskAssignedEmail,
  sendMeetingRemarkEmail,
  sendTaskRemarkEmail,
  sendReminderEmail
};
