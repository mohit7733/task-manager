export function getUserEmail(user) {
  return (user?.user_detail || user?.email || user?.work_email || user?.official_email || "").trim();
}

export function getUserKey(user) {
  if (user?.is_external && user?._id) return `ext-${user._id}`;
  return String(user?.emp_code || user?.id || user?._id || user?.name || "");
}

export function normalizeHrmsUsers(rawUsers) {
  return (Array.isArray(rawUsers) ? rawUsers : [])
    .map((u) => ({
      key: getUserKey(u),
      name: (u?.name || "").trim(),
      emp_code: (u?.emp_code || "").trim(),
      department_name: (u?.department_name || "").trim(),
      company: "",
      email: getUserEmail(u),
      is_external: false,
    }))
    .filter((u) => u.key && u.name);
}

export function normalizeExternalUsers(rawUsers) {
  return (Array.isArray(rawUsers) ? rawUsers : [])
    .map((u) => ({
      key: `ext-${u._id}`,
      name: (u?.name || "").trim(),
      emp_code: `EXT-${u._id}`,
      department_name: (u?.designation || "").trim(),
      company: (u?.company || "").trim(),
      designation: (u?.designation || "").trim(),
      email: (u?.email || "").trim(),
      is_external: true,
      external_id: u._id,
    }))
    .filter((u) => u.key && u.name);
}

export function mergeUserLists(hrmsUsers, externalUsers) {
  return [...normalizeHrmsUsers(hrmsUsers), ...normalizeExternalUsers(externalUsers)];
}

export function userSearchText(user) {
  return `${user.name} ${user.emp_code} ${user.email} ${user.department_name} ${user.company || ""}`.toLowerCase();
}

export function matchAssigneeKeys(users, assignees) {
  const codes = assignees.map((u) => (u.emp_code || "").trim().toLowerCase()).filter(Boolean);
  const emails = assignees.map((u) => (u.email || "").trim().toLowerCase()).filter(Boolean);

  return users
    .filter((u) => {
      const code = (u.emp_code || "").trim().toLowerCase();
      const email = (u.email || "").trim().toLowerCase();
      return (code && codes.includes(code)) || (email && emails.includes(email));
    })
    .map((u) => u.key);
}
