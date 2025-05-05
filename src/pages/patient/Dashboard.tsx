import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Clock, MessageCircle, Bell, ChevronRight} from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { fetchAppointments } from '../../store/slices/appointmentSlice';
import { fetchRealtimeHealthData } from '../../store/slices/healthDataSlice';
import UpcomingAppointments from '../../components/patient/UpcomingAppointments';
import { format } from 'date-fns';

const PatientDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { appointments, loading: appointmentsLoading } = useSelector((state: RootState) => state.appointments);
  const {  abnormalReadings, loading: healthDataLoading } = useSelector((state: RootState) => state.healthData);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAppointments(user.id));
      dispatch(fetchRealtimeHealthData(user.id));
      
      // Poll for real-time data updates
      const interval = setInterval(() => {
        dispatch(fetchRealtimeHealthData(user.id));
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, user]);

  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === 'scheduled'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}</h1>
          <p className="mt-1 text-gray-600">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-3">
          <Link to="/patient/appointments" className="btn-primary">
            <Calendar size={16} className="mr-2" /> Book Appointment
          </Link>
          <Link to="/patient/chatbot" className="btn-secondary">
            <MessageCircle size={16} className="mr-2" /> Health Assistant
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="data-card-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
              <p className="mt-2 text-3xl font-semibold">
                {appointmentsLoading ? '...' : upcomingAppointments.length}
              </p>
            </div>
            <Calendar className="text-primary" size={24} />
          </div>
          <Link to="/patient/appointments" className="mt-4 text-xs flex items-center font-medium text-primary">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="data-card-secondary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Health Alerts</p>
              <p className="mt-2 text-3xl font-semibold">
                {healthDataLoading ? '...' : abnormalReadings.length}
              </p>
            </div>
            <Bell className="text-secondary" size={24} />
          </div>
          <Link to="/patient/health-data" className="mt-4 text-xs flex items-center font-medium text-secondary">
            View alerts <ChevronRight size={14} />
          </Link>
        </div>

        <div className="data-card-accent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Medical Reports</p>
              <p className="mt-2 text-3xl font-semibold">
                5
              </p>
            </div>
            <FileText className="text-accent" size={24} />
          </div>
          <Link to="/patient/medical-history" className="mt-4 text-xs flex items-center font-medium text-accent">
            View reports <ChevronRight size={14} />
          </Link>
        </div>

        <div className="data-card-success">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Last Checkup</p>
              <p className="mt-2 text-lg font-semibold">
                Mar 15, 2025
              </p>
            </div>
            <Clock className="text-success" size={24} />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Next recommended: Jun 15, 2025
          </p>
        </div>
      </div>
      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
            <UpcomingAppointments 
              appointments={upcomingAppointments.slice(0, 3)} 
              loading={appointmentsLoading} 
            />
            {upcomingAppointments.length > 3 && (
              <div className="mt-4 text-center">
                <Link 
                  to="/patient/appointments" 
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  View all appointments
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;