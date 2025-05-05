import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { RootState, AppDispatch } from "../../store";
import { setError, clearError } from "../../store/slices/authSlice";
import apiService from "../../api/apiService";
import { AlertCircle, X } from "lucide-react";

interface DoctorProfile {
  _id: string;
  user: string;
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
    [key: string]: { start: string; end: string; isAvailable: boolean };
  };
}

interface WorkingHour {
  day: string;
  start: string;
  end: string;
}

interface DoctorProfileFormValues {
  user: string;
  specialization: string;
  qualifications: string;
  licenseNumber: string;
  experience: number;
  bio: string;
  officeAddress: string;
  officePhone: string;
  consultationFee: number;
  isAvailableForAppointments: boolean;
  workingHours: WorkingHour[];
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const doctorProfileSchema = Yup.object().shape({
  user: Yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
    .required("User ID is required"),
  specialization: Yup.string().required("Specialization is required"),
  qualifications: Yup.string()
    .required("Qualifications are required")
    .test("is-comma-separated", "Must be a comma-separated list", (value) =>
      value ? value.split(",").every((item) => item.trim().length > 0) : false
    ),
  licenseNumber: Yup.string().required("License number is required"),
  experience: Yup.number()
    .min(0, "Experience cannot be negative")
    .required("Experience is required"),
  bio: Yup.string().required("Bio is required"),
  officeAddress: Yup.string().required("Office address is required"),
  officePhone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
    .required("Office phone is required"),
  consultationFee: Yup.number()
    .min(0, "Fee cannot be negative")
    .required("Consultation fee is required"),
  isAvailableForAppointments: Yup.boolean().required(
    "Availability status is required"
  ),
  workingHours: Yup.array()
    .of(
      Yup.object().shape({
        day: Yup.string().required("Day is required"),
        start: Yup.string()
          .matches(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:mm)"
          )
          .required("Start time is required"),
        end: Yup.string()
          .matches(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Invalid time format (HH:mm)"
          )
          .required("End time is required")
          .test(
            "end-after-start",
            "End time must be after start time",
            function (end) {
              const { start } = this.parent;
              if (!start || !end) return true;
              return end > start;
            }
          ),
      })
    )
    .optional(),
});

const DoctorProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error, accessToken, user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Hardcoded profile ID
  const PROFILE_ID = "6818518c839aec06166eb86e";

  // Get user ID from Redux store
  const userId = user?.id || "";

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setFetchLoading(true);
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
        setFetchLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken, user, dispatch]);

  const handleSubmit = async (values: DoctorProfileFormValues) => {
    setLoading(true);
    try {
      if (!accessToken) {
        throw new Error("No access token available. Please log in again.");
      }
      if (!userId) {
        throw new Error("No user ID available. Please log in again.");
      }

      // Validate profile ID format
      if (!/^[0-9a-fA-F]{24}$/.test(PROFILE_ID)) {
        throw new Error("Invalid profile ID format.");
      }

      // Initialize workingHours object with all days set to unavailable by default
      const workingHours: Record<string, { start: string; end: string; isAvailable: boolean }> = {
        monday: { start: "", end: "", isAvailable: false },
        tuesday: { start: "", end: "", isAvailable: false },
        wednesday: { start: "", end: "", isAvailable: false },
        thursday: { start: "", end: "", isAvailable: false },
        friday: { start: "", end: "", isAvailable: false },
        saturday: { start: "", end: "", isAvailable: false },
        sunday: { start: "", end: "", isAvailable: false },
      };

      // Update working hours for days that have been specified in the form
      values.workingHours.forEach((wh) => {
        const dayKey = wh.day.toLowerCase();
        workingHours[dayKey] = {
          start: wh.start,
          end: wh.end,
          isAvailable: true,
        };
      });

      let payload;
      let response;
      if (profile) {
        // Update existing profile using PATCH (exclude user)
        payload = {
          specialization: values.specialization,
          qualifications: values.qualifications
            .split(",")
            .map((q) => q.trim())
            .filter((q) => q),
          licenseNumber: values.licenseNumber,
          experience: values.experience,
          bio: values.bio,
          officeAddress: values.officeAddress,
          officePhone: values.officePhone,
          consultationFee: values.consultationFee,
          isAvailableForAppointments: values.isAvailableForAppointments,
          workingHours,
        };
        console.log("Sending update payload to /doctors:", payload);
        response = await apiService.patch(`/doctors/${PROFILE_ID}`, payload);
        setSuccessMessage("Doctor profile updated successfully");
      } else {
        // Create new profile (include user)
        payload = {
          user: userId,
          specialization: values.specialization,
          qualifications: values.qualifications
            .split(",")
            .map((q) => q.trim())
            .filter((q) => q),
          licenseNumber: values.licenseNumber,
          experience: values.experience,
          bio: values.bio,
          officeAddress: values.officeAddress,
          officePhone: values.officePhone,
          consultationFee: values.consultationFee,
          isAvailableForAppointments: values.isAvailableForAppointments,
          workingHours,
        };
        console.log("Sending create payload to /doctors:", payload);
        response = await apiService.post("/doctors", payload);
        setSuccessMessage("Doctor profile created successfully");
      }

      console.log("API Response:", response.data);
      setProfile(response.data);
      dispatch(clearError());
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      let errorMessage = "Failed to process doctor profile";
      if (err instanceof Error) {
        if (err.message.includes("CORS")) {
          errorMessage = "Failed to process profile: CORS error. Check server configuration.";
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === "object" && err !== null) {
        // Handle API error response
        const apiError = err as { response?: { data?: { message?: string[] | string } } };
        if (apiError.response?.data?.message) {
          errorMessage = Array.isArray(apiError.response.data.message)
            ? apiError.response.data.message.join(", ")
            : apiError.response.data.message;
        }
      }
      console.error("Profile error:", err);
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  // Convert profile data to form initial values
  const initialValues: DoctorProfileFormValues = profile
    ? {
        user: userId,
        specialization: profile.specialization || "",
        qualifications: profile.qualifications?.join(", ") || "",
        licenseNumber: profile.licenseNumber || "",
        experience: profile.experience || 0,
        bio: profile.bio || "",
        officeAddress: profile.officeAddress || "",
        officePhone: profile.officePhone || "",
        consultationFee: profile.consultationFee || 0,
        isAvailableForAppointments: profile.isAvailableForAppointments || true,
        workingHours: Object.entries(profile.workingHours || {})
          .filter(([_, hours]) => typeof hours !== "string" && hours.isAvailable)
          .map(([day, hours]) => ({
            day: day.charAt(0).toUpperCase() + day.slice(1),
            start: typeof hours !== "string" ? hours.start : "",
            end: typeof hours !== "string" ? hours.end : "",
          })),
      }
    : {
        user: userId,
        specialization: "",
        qualifications: "",
        licenseNumber: "",
        experience: 0,
        bio: "",
        officeAddress: "",
        officePhone: "",
        consultationFee: 0,
        isAvailableForAppointments: true,
        workingHours: [],
      };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-gray-800">
            {profile ? "Update Doctor Profile" : "Create Doctor Profile"}
          </h3>
        </div>

        {fetchLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!fetchLoading && (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start animate-fade-in">
                <AlertCircle
                  size={20}
                  className="text-red-500 mr-3 mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md flex items-start animate-fade-in">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={doctorProfileSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isValid, dirty, values }) => (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="hidden">
                      <Field
                        id="user"
                        name="user"
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled
                      />
                      <ErrorMessage
                        name="user"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="specialization"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Specialization
                      </label>
                      <Field
                        id="specialization"
                        name="specialization"
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., Cardiology"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="specialization"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="qualifications"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Qualifications (comma-separated)
                      </label>
                      <Field
                        id="qualifications"
                        name="qualifications"
                        type="text"
                        className="block w-full px-3 py-2 capitalize border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., MD, PhD, Board Certified"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="qualifications"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="licenseNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        License Number
                      </label>
                      <Field
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., MD12345"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="licenseNumber"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="experience"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Experience (years)
                      </label>
                      <Field
                        id="experience"
                        name="experience"
                        type="number"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus RING-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., 10"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="experience"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="consultationFee"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Consultation Fee ($)
                      </label>
                      <Field
                        id="consultationFee"
                        name="consultationFee"
                        type="number"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., 150"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="consultationFee"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="officeAddress"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Office Address
                      </label>
                      <Field
                        id="officeAddress"
                        name="officeAddress"
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., 123 Medical Center Dr, Suite 100"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="officeAddress"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="officePhone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Office Phone
                      </label>
                      <Field
                        id="officePhone"
                        name="officePhone"
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        disabled={loading}
                        placeholder="e.g., +1234567890"
                        aria-required="true"
                      />
                      <ErrorMessage
                        name="officePhone"
                        component="p"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bio
                    </label>
                    <Field
                      as="textarea"
                      id="bio"
                      name="bio"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 h-32"
                      disabled={loading}
                      placeholder="e.g., Dr. John Doe is a cardiologist with over 10 years of experience..."
                      aria-required="true"
                    />
                    <ErrorMessage
                      name="bio"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div className="flex items-center">
                    <Field
                      id="isAvailableForAppointments"
                      name="isAvailableForAppointments"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label
                      htmlFor="isAvailableForAppointments"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      Available for Appointments
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours
                    </label>
                    <FieldArray name="workingHours">
                      {({ push, remove }) => (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <select
                              className="block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                              disabled={loading}
                              onChange={(e) => {
                                const selectedDay = e.target.value;
                                if (
                                  selectedDay &&
                                  !values.workingHours.some(
                                    (wh) => wh.day === selectedDay
                                  )
                                ) {
                                  push({
                                    day: selectedDay,
                                    start: "",
                                    end: "",
                                  });
                                }
                                e.target.value = "";
                              }}
                            >
                              <option value="">Select a day</option>
                              {daysOfWeek
                                .filter(
                                  (day) =>
                                    !values.workingHours.some(
                                      (wh) => wh.day === day
                                    )
                                )
                                .map((day) => (
                                  <option key={day} value={day}>
                                    {day}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {values.workingHours.length > 0 && (
                            <div className="space-y-2">
                              {values.workingHours.map((wh, index) => (
                                <div
                                  key={wh.day}
                                  className="flex items-center space-x-4 bg-gray-50 p-3 rounded-md"
                                >
                                  <div className="w-1/4 text-sm font-medium text-gray-700">
                                    {wh.day}
                                  </div>
                                  <div className="w-1/3">
                                    <Field
                                      type="time"
                                      name={`workingHours[${index}].start`}
                                      className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                      disabled={loading}
                                      aria-required="true"
                                    />
                                    <ErrorMessage
                                      name={`workingHours[${index}].start`}
                                      component="p"
                                      className="mt-1 text-xs text-red-600"
                                    />
                                  </div>
                                  <div className="w-1/3">
                                    <Field
                                      type="time"
                                      name={`workingHours[${index}].end`}
                                      className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                      disabled={loading}
                                      aria-required="true"
                                    />
                                    <ErrorMessage
                                      name={`workingHours[${index}].end`}
                                      component="p"
                                      className="mt-1 text-xs text-red-600"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-700 disabled:text-red-300"
                                    disabled={loading}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <div className="flex justify-end space-x-3">
                 
                    <button
                      type="button"
                      onClick={() => {
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !isValid || !dirty}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors ${
                        loading ? "animate-pulse" : ""
                      }`}
                    >
                      {loading ? "Processing..." : profile ? "Update Profile" : "Create Profile"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;