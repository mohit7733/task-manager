import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Users, Pencil, Trash2, Search, Building2 } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import FormModal, { FieldLabel, fieldClass, FormSection } from "../components/FormModal";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { brand } from "../utils/theme";

const EMPTY_FORM = {
  name: "",
  email: "",
  designation: "",
  company: "",
};

function userToForm(user) {
  return {
    name: user.name || "",
    email: user.email || "",
    designation: user.designation || "",
    company: user.company || "",
  };
}

export default function ExternalUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.designation} ${u.company}`.toLowerCase().includes(term)
    );
  }, [users, search]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/external-users", { params: { limit: 500, search: search.trim() || undefined } });
      setUsers(data.items || []);
    } catch (error) {
      console.error("Failed to load external users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingId(user._id);
    setFormData(userToForm(user));
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!formData.email.trim()) {
      alert("Please enter an email");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/external-users/${editingId}`, formData);
      } else {
        await api.post("/external-users", formData);
      }
      closeModal();
      load();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save external user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/external-users/${user._id}`);
      load();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete external user");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="External Users"
        subtitle="Manage external contacts for meetings and task assignments"
        icon={Users}
      >
        <button type="button" onClick={load} className={brand.btnSecondary}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        <button
          type="button"
          onClick={openCreateModal}
          className={`${brand.btnPrimary} ${brand.gradient} ${brand.gradientHover}`}
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </PageHeader>

      <div className={`${brand.card} p-4`}>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, designation, or company..."
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No users found" : "No external users yet"}
          description={
            search
              ? "Try a different search term"
              : "Add external users to assign them as responsible persons in meetings and tasks"
          }
          action={
            !search && (
              <button
                type="button"
                onClick={openCreateModal}
                className={`${brand.btnPrimary} ${brand.gradient} ${brand.gradientHover}`}
              >
                <Plus className="h-4 w-4" />
                Add First User
              </button>
            )
          }
        />
      ) : (
        <div className={`${brand.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Designation</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.designation || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.company || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal
        open={showModal}
        onClose={closeModal}
        eyebrow="External User"
        title={editingId ? "Edit User" : "Add User"}
        subtitle="These users can be selected as responsible persons in meetings and tasks"
        footer={
          <>
            <button type="button" onClick={closeModal} className={brand.btnSecondary}>
              Cancel
            </button>
            <button
              type="submit"
              form="external-user-form"
              disabled={saving}
              className={`${brand.btnPrimary} ${brand.gradient} ${brand.gradientHover} disabled:opacity-60`}
            >
              {saving ? "Saving..." : editingId ? "Update User" : "Create User"}
            </button>
          </>
        }
      >
        <form id="external-user-form" onSubmit={handleSubmit} className="space-y-5">
          <FormSection title="Contact Details" icon={Users}>
            <div>
              <FieldLabel required>Name</FieldLabel>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <FieldLabel required>Email</FieldLabel>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="email@company.com"
                required
              />
            </div>
          </FormSection>

          <FormSection title="Organization" icon={Building2}>
            <div>
              <FieldLabel>Designation</FieldLabel>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="e.g. Project Manager"
              />
            </div>
            <div>
              <FieldLabel>Company</FieldLabel>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className={fieldClass}
                placeholder="Company or organization name"
              />
            </div>
          </FormSection>
        </form>
      </FormModal>
    </div>
  );
}
