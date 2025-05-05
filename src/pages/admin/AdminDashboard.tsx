import React, { useEffect, useState, Component, ErrorInfo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RootState, AppDispatch } from "../../store";
import { setError, clearError } from "../../store/slices/authSlice";
import apiService from "../../api/apiService";
import { Pencil, Trash2, X, AlertCircle, Plus } from "lucide-react";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

interface UpdateUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  isActive: boolean;
  emailVerified: boolean;
  password?: string;
}

interface CreateUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

const updateUserSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  role: Yup.string()
    .oneOf(["admin", "doctor", "patient"], "Invalid role")
    .required("Role is required"),
  profilePicture: Yup.string()
    .url("Invalid URL")
    .optional()
    .nullable(),
  isActive: Yup.boolean().required("Active status is required"),
  emailVerified: Yup.boolean().required("Email verification status is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .nullable(),
});

const createUserSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  role: Yup.string()
    .oneOf(["doctor", "patient"], "Role must be doctor or patient")
    .required("Role is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

class AdminDashboardErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in AdminDashboard:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-error">
            Something went wrong
          </h2>
          <p className="text-gray-600 mt-2">
            Please try refreshing the page or contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error, accessToken } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!accessToken) {
          throw new Error("No access token available. Please log in again.");
        }
        console.log("Fetching users with accessToken:", accessToken);
        const response = await apiService.get<UsersResponse>("/users");
        console.log("Raw API response:", response);
        if (!Array.isArray(response.data.data)) {
          throw new Error(
            "Invalid user data format: expected an array in response.data.data"
          );
        }
        setUsers(response.data.data);
        dispatch(clearError());
      } catch (err: unknown) {
        console.error("Fetch users error:", err);
        setUsers([]);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch users";
        dispatch(setError(errorMessage));
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [dispatch, accessToken]);

  // Handle user deletion
  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await apiService.delete(`/users/${userId}`);
      setUsers(users.filter((user) => user._id !== userId));
      setSuccessMessage("User deleted successfully");
      dispatch(clearError());
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Delete user error:", err);
      dispatch(setError("Failed to delete user"));
    } finally {
      setLoading(false);
    }
  };

  // Handle user update
  const handleUpdate = async (values: UpdateUserFormValues) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const payload = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        profilePicture: values.profilePicture || undefined,
        isActive: values.isActive,
        emailVerified: values.emailVerified,
        ...(values.password && { password: values.password }),
      };
      console.log("Updating user with _id:", selectedUser._id);
      console.log("Update payload:", payload);
      const response = await apiService.patch<User>(
        `/users/${selectedUser._id}`,
        payload
      );
      console.log("Update response:", response);
      setUsers(
        users.map((user) =>
          user._id === selectedUser._id ? response.data : user
        )
      );
      setIsUpdateModalOpen(false);
      setSelectedUser(null);
      setSuccessMessage("User updated successfully");
      dispatch(clearError());
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Update user error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message.includes("404")
            ? `User with ID ${selectedUser._id} not found`
            : err.message
          : "Failed to update user";
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Handle user creation
  const handleCreate = async (values: CreateUserFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
      };
      console.log("Creating user with payload:", payload);
      const response = await apiService.post<User>("/users", payload);
      console.log("Create response:", response);
      setUsers([...users, response.data]);
      setIsCreateModalOpen(false);
      setSuccessMessage(`${values.role.charAt(0).toUpperCase() + values.role.slice(1)} created successfully`);
      dispatch(clearError());
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error("Create user error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create user";
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <AdminDashboardErrorBoundary>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          Admin Dashboard - Manage Users
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md flex items-start">
            <AlertCircle
              size={20}
              className="text-error mr-3 mt-0.5 flex-shrink-0"
            />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border-l-4 border-success rounded-md flex items-start">
            <p className="text-sm text-success">{successMessage}</p>
          </div>
        )}

        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center"
            disabled={loading}
          >
            <Plus size={18} className="mr-2" />
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px]">
                      {user._id}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 break-words max-w-[200px]">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.firstName}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsUpdateModalOpen(true);
                        }}
                        className="text-primary hover:text-primary/80 mr-4"
                        disabled={loading}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-error hover:text-error/80"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Update User Modal */}
        {isUpdateModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Update User</h2>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <Formik
                initialValues={{
                  email: selectedUser.email,
                  firstName: selectedUser.firstName,
                  lastName: selectedUser.lastName,
                  role: selectedUser.role,
                  profilePicture: selectedUser.profilePicture || "",
                  isActive: selectedUser.isActive ?? true,
                  emailVerified: selectedUser.emailVerified ?? false,
                  password: "",
                }}
                validationSchema={updateUserSchema}
                onSubmit={handleUpdate}
              >
                {({ isValid, dirty }) => (
                  <Form className="space-y-4">
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="form-label">
                        Password (optional)
                      </label>
                      <Field
                        id="password"
                        name="password"
                        type="password"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="password"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="firstName" className="form-label">
                        First Name
                      </label>
                      <Field
                        id="firstName"
                        name="firstName"
                        type="text"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="firstName"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="form-label">
                        Last Name
                      </label>
                      <Field
                        id="lastName"
                        name="lastName"
                        type="text"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="lastName"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="form-label">
                        Role
                      </label>
                      <Field
                        as="select"
                        id="role"
                        name="role"
                        className="form-input"
                        disabled={loading}
                      >
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                      </Field>
                      <ErrorMessage
                        name="role"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="profilePicture" className="form-label">
                        Profile Picture URL
                      </label>
                      <Field
                        id="profilePicture"
                        name="profilePicture"
                        type="text"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="profilePicture"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div className="flex items-center">
                      <Field
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="isActive" className="ml-2 form-label">
                        Active
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Field
                        id="emailVerified"
                        name="emailVerified"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="emailVerified" className="ml-2 form-label">
                        Email Verified
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsUpdateModalOpen(false)}
                        className="btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !isValid || !dirty}
                        className={`btn-primary ${
                          loading || !isValid || !dirty
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {loading ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add User</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <Formik
                initialValues={{
                  email: "",
                  firstName: "",
                  lastName: "",
                  role: "doctor", // Default to doctor
                  password: "",
                }}
                validationSchema={createUserSchema}
                onSubmit={handleCreate}
                enableReinitialize
              >
                {({ isValid, dirty, resetForm }) => (
                  <Form className="space-y-4">
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <Field
                        id="password"
                        name="password"
                        type="password"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="password"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="firstName" className="form-label">
                        First Name
                      </label>
                      <Field
                        id="firstName"
                        name="firstName"
                        type="text"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="firstName"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="form-label">
                        Last Name
                      </label>
                      <Field
                        id="lastName"
                        name="lastName"
                        type="text"
                        className="form-input"
                        disabled={loading}
                      />
                      <ErrorMessage
                        name="lastName"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label htmlFor="role" className="form-label">
                        Role
                      </label>
                      <Field
                        as="select"
                        id="role"
                        name="role"
                        className="form-input"
                        disabled={loading}
                      >
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                      </Field>
                      <ErrorMessage
                        name="role"
                        component="p"
                        className="form-error"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          handleCloseCreateModal();
                        }}
                        className="btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !isValid || !dirty}
                        className={`btn-primary ${
                          loading || !isValid || !dirty
                            ? "opacity-70 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {loading ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardErrorBoundary>
  );
};

export default AdminDashboard;