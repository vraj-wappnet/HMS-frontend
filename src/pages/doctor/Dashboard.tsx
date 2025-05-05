import React, { useEffect, useState, Component, ErrorInfo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { setError, clearError } from "../../store/slices/authSlice";
import apiService from "../../api/apiService";
import { AlertCircle, User, Stethoscope, MapPin, Phone, DollarSign, Clock, Calendar, Star } from "lucide-react";

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in Dashboard:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-xl">
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
            <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">
              An unexpected error occurred. Please try refreshing the page or contact support.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface WorkingHour {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface DoctorProfile {
  _id: string;
  user: User;
  specialization: string;
  qualifications: string[];
  licenseNumber: string;
  experience: number;
  bio: string;
  officeAddress: string;
  officePhone: string;
  consultationFee: number;
  isAvailableForAppointments: boolean;
  workingHours: {
    [key: string]: WorkingHour | string; // Allow _id field
    monday: WorkingHour;
    tuesday: WorkingHour;
    wednesday: WorkingHour;
    thursday: WorkingHour;
    friday: WorkingHour;
    saturday: WorkingHour;
    sunday: WorkingHour;
  };
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, user, error } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (!accessToken) {
          throw new Error("No access token available. Please log in again.");
        }
        if (!user || user.role !== "doctor") {
          throw new Error("Only doctors can view this profile.");
        }
        if (!user.id) {
          throw new Error("User ID is missing. Please log in again.");
        }

        const response = await apiService.get<DoctorProfile>(`/doctors/profile`);
        console.log("Doctor Profile API Response:", response.data);
        setProfile(response.data);
        dispatch(clearError());
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message.includes("CORS")
              ? "Failed to fetch profile: CORS error. Check server configuration."
              : err.message
            : "Failed to fetch doctor profile";
        console.error("Fetch profile error:", err);
        dispatch(setError(errorMessage));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, user, dispatch]);

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
          {!user && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
              <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">Please log in to view your profile.</p>
            </div>
          )}

          {user && user.role !== "doctor" && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
              <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">This page is only accessible to doctors.</p>
            </div>
          )}

          {error && user && user.role === "doctor" && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
              <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          )}

          {profile && user && user.role === "doctor" && !loading && (
            <div className="space-y-8">
              {/* User Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <User size={20} className="mr-2" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-lg font-medium">
                      {profile.user?.firstName ?? "N/A"} {profile.user?.lastName ?? "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-medium">{profile.user?.email ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="text-lg font-medium capitalize">{profile.user?.role ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <p className="text-lg font-medium">
                      {profile.user?.isActive ? "Active" : "Inactive"}
                      {profile.user?.emailVerified ? " (Verified)" : " (Unverified)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="text-lg font-medium">
                      {profile.user?.createdAt
                        ? new Date(profile.user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Profile Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <Stethoscope size={20} className="mr-2" /> Professional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="text-lg font-medium">{profile.specialization ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Qualifications</p>
                    <p className="text-lg font-medium">
                      {profile.qualifications?.length > 0 ? profile.qualifications.join(", ") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="text-lg font-medium">{profile.licenseNumber ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="text-lg font-medium">
                      {profile.experience != null ? `${profile.experience} years` : "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Bio</p>
                    <p className="text-lg font-medium">{profile.bio ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin size={16} className="mr-1" /> Office Address
                    </p>
                    <p className="text-lg font-medium">{profile.officeAddress ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone size={16} className="mr-1" /> Office Phone
                    </p>
                    <p className="text-lg font-medium">{profile.officePhone ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <DollarSign size={16} className="mr-1" /> Consultation Fee
                    </p>
                    <p className="text-lg font-medium">
                      {profile.consultationFee != null ? `$${profile.consultationFee}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className="text-lg font-medium">
                      {profile.isAvailableForAppointments
                        ? "Available for Appointments"
                        : "Not Available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Star size={16} className="mr-1" /> Rating
                    </p>
                    <p className="text-lg font-medium">
                      {profile.averageRating != null
                        ? `${profile.averageRating.toFixed(1)} (${profile.totalRatings} reviews)`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <Clock size={20} className="mr-2" /> Working Hours
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Availability
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {daysOfWeek.map((day) => {
                        const hours = profile.workingHours?.[day];
                        return (
                          <tr key={day}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {day}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hours && typeof hours !== "string"
                                ? hours.isAvailable
                                  ? "Available"
                                  : "Not Available"
                                : "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hours &&
                              typeof hours !== "string" &&
                              hours.isAvailable &&
                              hours.start &&
                              hours.end
                                ? `${hours.start} - ${hours.end}`
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profile Metadata */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <Calendar size={20} className="mr-2" /> Profile Metadata
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Profile ID</p>
                    <p className="text-lg font-medium">{profile._id ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="text-lg font-medium">
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="text-lg font-medium">
                      {profile.updatedAt
                        ? new Date(profile.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !profile && user && user.role === "doctor" && !error && (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">No profile found. Please create a doctor profile.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;