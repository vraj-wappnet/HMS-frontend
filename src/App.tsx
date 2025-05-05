import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "./components/layouts/AuthLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PatientDashboard from "./pages/patient/Dashboard";
import VideoConsultation from "./pages/shared/VideoConsultation";
import { RootState, AppDispatch } from "./store";
import { checkAuth } from "./store/slices/authSlice";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import Dashboard from "./pages/doctor/Dashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import HealthAssistant from "./pages/patient/HealthAssistant";

const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, userRole, loading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />
          }
        />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route element={<DashboardLayout />}>
          {/* Redirect to role-specific dashboard */}
          <Route
            path="/dashboard"
            element={
              <Navigate
                to={
                  userRole === "admin"
                    ? "/admin/dashboard"
                    : userRole === "doctor"
                    ? "/doctor/dashboard"
                    : "/patient/dashboard"
                }
                replace
              />
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="admin"
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-users"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="admin"
              >
                <div>Manage Users (Placeholder)</div>
              </ProtectedRoute>
            }
          />
      

          {/* Doctor routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="doctor"
              >
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
           <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="doctor"
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="doctor"
              >
                <div>Patient List (Placeholder)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="doctor"
              >
                <div>Patient Details (Placeholder)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="doctor"
              >
                <div>Medical Reports (Placeholder)</div>
              </ProtectedRoute>
            }
          />

          {/* Patient routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <div>Appointments (Placeholder)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medical-history"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <div>Medical History (Placeholder)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/health-data"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <div>Health Data (Placeholder)</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/chatbot"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                requiredRole="patient"
              >
                <HealthAssistant />
              </ProtectedRoute>
            }
          />

          {/* Shared routes */}
          <Route
            path="/consultation/:id"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <VideoConsultation />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Default routes */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

export default App;