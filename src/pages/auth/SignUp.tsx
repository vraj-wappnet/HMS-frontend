import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RootState, AppDispatch } from "../../store";
import { setAuthData, setError } from "../../store/slices/authSlice";
import { ArrowRight, AlertCircle } from "lucide-react";
import apiService from "../../api/apiService";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

const registerSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  role: Yup.string()
    .required("Role is required")
    .oneOf(["doctor", "patient"], "Invalid role"),
});

const SignUp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const initialValues: RegisterFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      // Make API call to register
      const response = await apiService.post<{ token: string; user: User }>('/auth/register', values);
      
      // Store token and set auth headers      
      // Update Redux state
      dispatch(setAuthData({
        accessToken: response.data.token,
        user: response.data.user,
      }));
      
      // Navigate to dashboard
      navigate("/");
    } catch (error: unknown) {
      // Set error in Redux state
      if (error instanceof Error) {
        dispatch(setError(error.message));
      } else {
        dispatch(setError('Registration failed'));
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-500">Sign Up</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md flex items-start">
          <AlertCircle
            size={20}
            className="text-error mr-3 mt-0.5 flex-shrink-0"
          />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ isValid, dirty }) => (
          <Form className="space-y-6">
            <div>
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <Field
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
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
                autoComplete="family-name"
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
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="form-input"
                disabled={loading}
              />
              <ErrorMessage name="email" component="p" className="form-error" />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <Field
                id="role"
                name="role"
                as="select"
                className="form-input"
                disabled={loading}
              >
                <option value="">Select a role</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </Field>
              <ErrorMessage name="role" component="p" className="form-error" />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isValid || !dirty}
                className={`btn-primary w-full flex items-center justify-center ${
                  loading || !isValid || !dirty
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <>
                    Sign up <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign in
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SignUp;