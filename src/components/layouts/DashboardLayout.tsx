import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, Bell, User, LogOut, Home, Calendar, FileText, Activity, Users, MessageCircle } from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { resetAuth } from '../../store/slices/authSlice';
import NotificationDropdown from '../ui/NotificationDropdown';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, userRole } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const handleLogout = () => {
    dispatch(resetAuth());
    navigate('/login');
  };

  // Close sidebar when route changes (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate navigation links based on user role
  const getNavLinks = () => {
    switch (userRole) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        ];
      case 'doctor':
        return [
          { path: '/doctor/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
          { path: '/doctor/patients', label: 'Patients', icon: <Users size={20} /> },
          { path: '/doctor/consultations', label: 'Consultations', icon: <MessageCircle size={20} /> },
          { path: '/doctor/reports', label: 'Medical Reports', icon: <FileText size={20} /> },
        ];
      case 'patient':
        return [
          { path: '/patient/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
          { path: '/patient/profile', label: 'Profile', icon: <User size={20} /> },
          { path: '/patient/chatbot', label: 'Health Assistant', icon: <MessageCircle size={20} /> },
          { path: '/patient/appointments', label: 'Appointments', icon: <Calendar size={20} /> },
          { path: '/patient/medical-history', label: 'Medical History', icon: <FileText size={20} /> },
          { path: '/patient/health-data', label: 'Health Data', icon: <Activity size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-20 p-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:fixed lg:top-0 lg:bottom-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 bg-white shadow-md flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-6 bg-primary text-white">
          <h1 className="text-xl font-bold">Healthcare Platform</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-white focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar content with scrollable area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => console.log(`Navigating to ${link.path}`)}
                    className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                      location.pathname === link.path
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="flex items-center justify-end px-4 py-4 lg:py-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none relative"
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center rounded-full bg-error text-white text-xs transform translate-x-1 -translate-y-1">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <NotificationDropdown
                  onClose={() => setNotificationsOpen(false)}
                />
              )}
            </div>

            {/* User Profile */}
            <div className="relative ml-3" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                <User size={20} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;