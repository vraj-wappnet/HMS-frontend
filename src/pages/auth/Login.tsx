import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RootState, AppDispatch } from "../../store";
import { setAuthData, setError } from "../../store/slices/authSlice";
import { ArrowRight, AlertCircle } from "lucide-react";
import apiService from "../../api/apiService";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
    rememberMe: false,
  };

  const handleSubmit = async (values: LoginFormValues) => {
    const { email, password } = values;
    try {
      // Make API call to login
      const response = await apiService.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/login", { email, password });

      // Store tokens and set auth headers
      apiService.setToken(response.data.accessToken, response.data.refreshToken);

      // Update Redux state
      dispatch(
        setAuthData({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        })
      );

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error: unknown) {
      // Extract and display the API error message
      let errorMessage = "Authentication failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setError(errorMessage));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-500">Sign In</h1>
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
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {({ isValid, dirty }) => (
          <Form className="space-y-6">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <Field
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
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
                    Sign in <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account?</span>{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Login;