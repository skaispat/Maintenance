import React, { useState, useEffect } from "react";
import { fetchUsers, createUser, updateUser, toggleUserStatus, uploadProfilePicture, User } from "../services/userService";
import useAuthStore from "../store/authStore";
import {
  Save,
  Eye,
  EyeOff,
  Users,
  Plus,
  Edit,
  X,
  Ban,
  CheckCircle,
  Upload,
} from "lucide-react";

const AVAILABLE_PAGES = [
  "Dashboard",
  "Machines",
  "Assign Task",
  "Tasks",
  "Admin Approval",
  "Daily Report",
  "Calendar",
];

// --- USER FORM COMPONENT ---
interface UserFormProps {
  userToEdit: User | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isEditorAdmin: boolean;
  isModal?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  userToEdit,
  onClose,
  onSave,
  isEditorAdmin,
  isModal = true
}) => {
  const [formData, setFormData] = useState(
    userToEdit
      ? {
        ...userToEdit,
        allowedPages:
          userToEdit.allowedPages && userToEdit.allowedPages.length > 0
            ? userToEdit.allowedPages
            : ["Dashboard"],
      }
      : {
        employeeName: "",
        department: "",
        phoneNumber: "",
        employeeCode: "",
        username: "",
        password: "",
        pageAccess: "User" as const,
        allowedPages: ["Dashboard"],
        profilePicture: "",
      }
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const url = await uploadProfilePicture(e.target.files[0]);
        setFormData((prev) => ({ ...prev, profilePicture: url }));
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateEmployeeCode = (name: string) => {
    const initials = name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${initials}${random}`;
  };

  const handleNameBlur = () => {
    if (!userToEdit && formData.employeeName) {
      setFormData((prev) => ({
        ...prev,
        employeeCode: generateEmployeeCode(prev.employeeName),
      }));
    }
  };

  const handlePageToggle = (page: string) => {
    setFormData((prev) => {
      const currentPages = prev.allowedPages || [];
      if (currentPages.includes(page)) {
        return { ...prev, allowedPages: currentPages.filter((p) => p !== page) };
      } else {
        return { ...prev, allowedPages: [...currentPages, page] };
      }
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.employeeName ||
      !formData.department ||
      !formData.username ||
      (!userToEdit && !formData.password)
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      // The parent component handles closing/success
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isUserAdmin = formData.pageAccess === "Admin";

  const containerClasses = isModal
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
    : "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden";

  const wrapperClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]"
    : "w-full flex flex-col";

  return (
    <div className={containerClasses}>
      <div className={wrapperClasses}>
        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b border-gray-100 ${isModal ? 'bg-gray-50/50 rounded-t-2xl' : 'bg-white'}`}>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isModal
                ? (userToEdit ? "Edit User Account" : "Add New User")
                : "Profile Details"
              }
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isModal
                ? (userToEdit ? "Update user details and permissions" : "Create a new user account")
                : "Update your personal information"
              }
            </p>
          </div>
          {isModal && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Personal Information
            </h4>

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-50 flex items-center justify-center">
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-10 h-10 text-gray-300" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                  <Upload size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900">Profile Picture</h5>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a profile picture. Recommended size: 400x400px.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employee Name<span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department<span className="text-primary">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                >
                  <option value="">Select Department</option>
                  {["Rolling Mill", "Furnace", "Slag Crusher", "CCM", "Admin"].map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employee Code
                </label>
                <input
                  type="text"
                  name="employeeCode"
                  value={formData.employeeCode}
                  readOnly
                  placeholder="Auto-generated"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. +1 234 567 890"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Account Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username (ID)<span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {userToEdit ? "New Password" : "Password"}
                  {!userToEdit && <span className="text-primary">*</span>}
                  {userToEdit && <span className="text-xs text-gray-400 font-normal ml-1">(Optional)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    placeholder={userToEdit ? "Leave blank to keep current" : "Enter secure password"}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role & Permissions - Only show if Editor is Admin */}
            {isEditorAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role & Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["Admin", "User", "Viewer"].map((role) => (
                      <label
                        key={role}
                        className={`
                          relative flex flex-col p-3 border-2 rounded-xl cursor-pointer transition-all
                          ${formData.pageAccess === role
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-primary/20 hover:bg-gray-50"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="pageAccess"
                          value={role}
                          checked={formData.pageAccess === role}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className={`font-semibold ${formData.pageAccess === role ? "text-primary-dark" : "text-gray-900"}`}>
                          {role}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {role === "Admin" ? "Full access to all pages" : role === "User" ? "Can edit assigned pages" : "Read-only access"}
                        </span>
                        {formData.pageAccess === role && (
                          <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-primary" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Allowed Pages - Only show if NOT Admin User (User being edited) */}
                <div className={`space-y-3 transition-all duration-300 ${isUserAdmin ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Page Access
                    </label>
                    {isUserAdmin && (
                      <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                        Admin has access to all pages
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVAILABLE_PAGES.map((page) => {
                      const isChecked = isUserAdmin || (formData.allowedPages || []).includes(page);
                      return (
                        <label
                          key={page}
                          className={`
                            flex items-center space-x-3 p-3 rounded-lg border transition-all
                            ${isChecked
                              ? "bg-white border-primary/20 shadow-sm"
                              : "bg-gray-50 border-transparent text-gray-500"
                            }
                            ${!isUserAdmin && "cursor-pointer hover:bg-white hover:shadow-sm hover:border-gray-200"}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded border flex items-center justify-center transition-colors
                            ${isChecked
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-gray-300"
                            }
                          `}>
                            {isChecked && <CheckCircle size={12} fill="currentColor" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => !isUserAdmin && handlePageToggle(page)}
                            disabled={isUserAdmin}
                            className="sr-only"
                          />
                          <span className={`text-sm font-medium ${isChecked ? "text-gray-900" : "text-gray-500"}`}>
                            {page}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 px-6 py-4 border-t border-gray-100 ${isModal ? 'bg-gray-50/50 rounded-b-2xl' : 'bg-gray-50'}`}>
          {isModal && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:ring-4 focus:ring-primary/10 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {userToEdit ? "Save Changes" : "Create User"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN SETTINGS COMPONENT ---
const Settings = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const { user: currentUser, setUser: setCurrentUser } = useAuthStore();

  const isAdmin = currentUser?.pageAccess === 'Admin';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, userData);
        setUsers(users.map((u) => (u.id === editingUser.id ? updated : u)));

        // If we updated the currently logged in user, update the auth store
        if (currentUser && currentUser.id === updated.id) {
          setCurrentUser(updated);
        }

        showToast(`User ${userData.employeeName} updated successfully.`);
      } else {
        const created = await createUser(userData);
        setUsers([created, ...users]);
        showToast(`User ${created.employeeName} added successfully.`);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      showToast("Error saving user. Please try again.");
    }
  };

  const handleUpdateProfile = async (userData: any) => {
    if (!currentUser) return;
    try {
      const updated = await updateUser(currentUser.id, userData);
      setCurrentUser(updated);
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error updating profile. Please try again.");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? "disable" : "enable";
    if (window.confirm(`Are you sure you want to ${action} user ${user.employeeName}?`)) {
      try {
        const updated = await toggleUserStatus(user.id, user.isActive);
        setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u)));
        showToast(`User ${user.employeeName} ${action}d successfully.`);
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showToast(`Error ${action}ing user. Please try again.`);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-primary",
      "bg-primary",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // --- NON-ADMIN VIEW ---
  if (!isAdmin && currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {toastMessage && (
          <div className="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg bg-green-500 text-white font-semibold z-50">
            {toastMessage}
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account settings</p>
          </div>
          <UserForm
            userToEdit={currentUser}
            onSave={handleUpdateProfile}
            onClose={() => { }}
            isEditorAdmin={false}
            isModal={false}
          />
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {toastMessage && (
        <div className="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg bg-green-500 text-white font-semibold z-50">
          {toastMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Account Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage user accounts and access permissions
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors duration-200 shadow-md text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add New User</span>
            <span className="sm:hidden">Add User</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Department
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    ID (Username)
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Page Access
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${!u.profilePicture && getAvatarColor(
                            u.employeeName
                          )} text-white font-bold text-sm overflow-hidden bg-gray-100`}
                        >
                          {u.profilePicture ? (
                            <img
                              src={u.profilePicture}
                              alt={u.employeeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(u.employeeName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {u.employeeName}
                          </div>
                          <div className="text-xs text-gray-500">{u.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 break-words">
                      {u.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 break-words">
                      {u.phoneNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-mono whitespace-nowrap">
                      {u.username}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${u.pageAccess === "Admin"
                            ? "bg-purple-100 text-purple-800"
                            : u.pageAccess === "User"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {u.pageAccess}
                        </span>
                        <span className="text-xs text-gray-500 break-words whitespace-normal max-w-[200px]">
                          {u.pageAccess === "Admin"
                            ? "All Pages"
                            : u.allowedPages && u.allowedPages.length > 0
                              ? u.allowedPages.join(", ")
                              : "No pages assigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${u.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-primary rounded-lg hover:text-primary hover:bg-primary/5 transition-colors"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-2 rounded-lg transition-colors ${u.isActive
                            ? "text-primary hover:text-primary hover:bg-primary/5"
                            : "text-green-600 hover:text-green-800 hover:bg-green-50"
                            }`}
                          title={u.isActive ? "Disable User" : "Enable User"}
                        >
                          {u.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No user accounts found</p>
              <p className="text-sm mt-1">Click "Add New User" to create your first user account</p>
            </div>
          ) : null}
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${!u.profilePicture && getAvatarColor(
                      u.employeeName
                    )} text-white font-bold overflow-hidden bg-gray-100`}
                  >
                    {u.profilePicture ? (
                      <img
                        src={u.profilePicture}
                        alt={u.employeeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(u.employeeName)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{u.employeeName}</div>
                    <div className="text-xs text-gray-500">{u.employeeCode}</div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.pageAccess === "Admin"
                    ? "bg-primary/10 text-primary"
                    : u.pageAccess === "User"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                    }`}
                >
                  {u.pageAccess}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-gray-900 font-medium">{u.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900 font-medium">{u.phoneNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Username:</span>
                  <span className="text-primary font-mono font-medium">{u.username}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm pt-1">
                  <span className="text-gray-500">Page Access:</span>
                  <span className="text-gray-900 font-medium">
                    {u.pageAccess === "Admin"
                      ? "All Pages"
                      : u.allowedPages && u.allowedPages.length > 0
                        ? u.allowedPages.join(", ")
                        : "No pages assigned"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(u)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors font-medium"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(u)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${u.isActive
                    ? "text-primary bg-primary/5 hover:bg-primary/10"
                    : "text-green-600 bg-green-50 hover:bg-green-100"
                    }`}
                >
                  {u.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                  {u.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No user accounts found</p>
              <p className="text-sm mt-1">Click "Add New User" to create your first user account</p>
            </div>
          ) : null}
        </div>

        {isModalOpen && (
          <UserForm
            userToEdit={editingUser}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveUser}
            isEditorAdmin={true}
            isModal={true}
          />
        )}
      </div>
    </div>
  );
};

export default Settings;