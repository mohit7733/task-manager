const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { ensureShareLink, shareUrl } = require("../share/share.service");

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
        <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#2563eb,#4f46e5)">
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
                    <p style="margin:8px 0 0;font-size:13px;color:#dbeafe;font-family:'Segoe UI',Roboto,Arial,sans-serif">${APP_NAME}</p>
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
                ${customFooter || "For support, contact your administrator."}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;font-family:'Segoe UI',Roboto,Arial,sans-serif">
          &copy; ${new Date().getFullYear()} ${APP_NAME}
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

function detailRow(label, value) {
  const displayValue = value != null && value !== "" ? value : "—";
  return `
    <tr class="detail-row">
      <td class="detail-label" valign="top" style="padding:10px 16px 10px 0;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;width:34%;font-family:'Segoe UI',Roboto,Arial,sans-serif">${escapeHtml(label)}</td>
      <td class="detail-value" valign="top" style="padding:10px 0;color:#0f172a;font-size:15px;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif">${displayValue}</td>
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
    upcoming: { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", icon: "i" },
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

async function sendMeetingAssignedEmail(meeting, data, creator) {
  const to = data.email;
  const name = data.name;
  if (!to || !name) return;
  const shareToken = await ensureShareLink("meeting", meeting._id, meeting.coo_id);
  const subject = `Meeting Assigned: ${meeting.title}`;
  const detailsTable = detailsCard(`
    ${detailRow("Title", escapeHtml(meeting.title))}
    ${detailRow("Scheduled By", escapeHtml(creator?.name || "PA"))}
    ${detailRow("Date", escapeHtml(fmtDate(meeting.meeting_date)))}
    ${detailRow("Time", escapeHtml(meeting.meeting_time ? fmtTime(meeting.meeting_time) : "—"))}
    ${detailRow("Responsible Person", escapeHtml(name))}
    ${detailRow("Status", statusBadge(meeting.status, statusVariant(meeting.status)))}
    ${detailRow("Priority", statusBadge(meeting.priority || "Medium", priorityVariant(meeting.priority)))}
    ${detailRow("Location", escapeHtml(meeting.location || "—"))}
    ${detailRow("Description", escapeHtml(meeting.description || "—"))}
    ${detailRow("Meeting Link", meeting.meeting_link ? linkValue(meeting.meeting_link, "Open meeting link") : "—")}
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
    ctaLink: shareUrl(shareToken),
    // customFooter: `Need help? Contact your administrator or <a href="${appUrl()}" style="color:#4f46e5">open ${APP_NAME}</a>.`
  });

  return sendEmail({ to, subject, html, text: subject });
}

async function sendTaskAssignedEmail(task, data, creator) {
  const to = data.email;
  const name = data.name;
  if (!to || !name) return;
  const shareToken = await ensureShareLink("task", task._id, task.coo_id);
  const subject = `Task Assigned: ${task.title}`;
  const detailsTable = detailsCard(`
    ${detailRow("Task", escapeHtml(task.title))}
    ${detailRow("Assigned By", escapeHtml(creator?.name || "PA"))}
    ${detailRow("Department", escapeHtml(task.department || "—"))}
    ${detailRow("Assigned To", escapeHtml(name))}
    ${detailRow("Status", statusBadge(task.status, statusVariant(task.status)))}
    ${detailRow("Priority", statusBadge(task.priority || "Medium", priorityVariant(task.priority)))}
    ${detailRow("Next Review", escapeHtml(task.next_review_date ? fmtDate(task.next_review_date) : "—"))}
    ${detailRow("Deadline", escapeHtml(task.deadline ? fmtDate(task.deadline) : "—"))}
    ${detailRow("Description", escapeHtml(task.description || "—"))}
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
    ctaLink: shareUrl(shareToken),
    // customFooter: `Need help? Contact your administrator or <a href="${appUrl()}" style="color:#4f46e5">open ${APP_NAME}</a>.`
  });

  return sendEmail({ to, subject, html, text: subject });
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

  const detailsTable = detailsCard(`
    ${detailRow("Meeting", escapeHtml(meeting.title))}
    ${detailRow("Remark #", escapeHtml(String(remark.remark_number)))}
    ${detailRow("By", escapeHtml(creator?.name || "PA"))}
    ${detailRow("Date", escapeHtml(remark.remark_date ? fmtDate(remark.remark_date) : "—"))}
    ${detailRow("Description", escapeHtml(remark.remark_description || "—"))}
    ${remark.next_meeting_date ? detailRow("Next Meeting", escapeHtml(fmtDate(remark.next_meeting_date))) : ""}
    ${remark.next_meeting_time ? detailRow("Next Meeting Time", escapeHtml(fmtTime(remark.next_meeting_time))) : ""}
    ${remark.next_agenda ? detailRow("Next Agenda", escapeHtml(remark.next_agenda)) : ""}
    ${remark.next_followup_note ? detailRow("Next Followup Note", escapeHtml(remark.next_followup_note)) : ""}
    ${attach ? detailRow("Attachment", '<span style="color:#4f46e5;font-weight:600">Included with this email</span>') : ""}
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
    ctaLink: shareUrl(shareToken),
    // customFooter: `For support, contact your administrator or <a href="${appUrl()}" style="color:#4f46e5">open ${APP_NAME}</a>.`
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
  const recipients = Array.isArray(task.assigned_to)
    ? task.assigned_to.map((u) => u.email).filter(Boolean)
    : [];
  if (!recipients.length) return;
  const shareToken = await ensureShareLink("task", task._id, task.coo_id);
  const subject = `Task Remark: ${task.title} — #${remark.remark_number}`;
  const attach = fileAttachment(remark.attachment);

  const detailsTable = detailsCard(`
    ${detailRow("Task", escapeHtml(task.title))}
    ${detailRow("Department", escapeHtml(task.department || "—"))}
    ${detailRow("Remark #", escapeHtml(String(remark.remark_number)))}
    ${detailRow("By", escapeHtml(creator?.name || "PA"))}
    ${detailRow("Date", escapeHtml(remark.remark_date ? fmtDate(remark.remark_date) : "—"))}
    ${detailRow("Description", escapeHtml(remark.remark_description || "—"))}
    ${remark.pending_reason ? detailRow("Pending Reason", escapeHtml(remark.pending_reason)) : ""}
    ${remark.completion_note ? detailRow("Completed Note", escapeHtml(remark.completion_note)) : ""}
    ${remark.next_review_date ? detailRow("Next Review", escapeHtml(fmtDate(remark.next_review_date))) : ""}
    ${remark.next_agenda ? detailRow("Next Agenda", escapeHtml(remark.next_agenda)) : ""}
    ${remark.next_followup_note ? detailRow("Next Followup Note", escapeHtml(remark.next_followup_note)) : ""}
    ${attach ? detailRow("Attachment", '<span style="color:#4f46e5;font-weight:600">Included with this email</span>') : ""}
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
    ctaLink: shareUrl(shareToken),
    // customFooter: `For support, contact your administrator or <a href="${appUrl()}" style="color:#4f46e5">open ${APP_NAME}</a>.`
  });

  return sendEmail({
    to: recipients.join(","),
    subject,
    html,
    text: subject,
    attachments: attach ? [attach] : undefined
  });
}

async function sendReminderEmail({ to, title, message, type, meeting, task }) {
  const alertType = type === "overdue" ? "overdue" : "upcoming";
  const body = alertCard(message, alertType);
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
    // customFooter: `This is a read-only guest link. <a href="${appUrl()}" style="color:#4f46e5">Open ${APP_NAME}</a> to sign in.`
  });
  return sendEmail({ to, subject: title, html, text: `${title}\n${message}\n${ctaLink}` });
}

module.exports = {
  sendEmail,
  sendMeetingAssignedEmail,
  sendTaskAssignedEmail,
  sendMeetingRemarkEmail,
  sendTaskRemarkEmail,
  sendReminderEmail
};
