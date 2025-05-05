import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Video, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppointmentProps {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  type: 'in-person' | 'video' | 'phone';
  notes?: string;
  symptoms?: string[];
  patientName?: string;
  doctorName?: string;
}

interface UpcomingAppointmentsProps {
  appointments: AppointmentProps[];
  loading: boolean;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-100 h-24 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">No upcoming appointments</p>
        <Link
          to="/patient/appointments"
          className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary/80"
        >
          Book an appointment
        </Link>
      </div>
    );
  }

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={18} className="text-primary" />;
      case 'phone':
        return <Phone size={18} className="text-secondary" />;
      default:
        return <User size={18} className="text-accent" />;
    }
  };

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                {getAppointmentTypeIcon(appointment.type)}
              </div>
              <div>
                <h3 className="font-medium">
                  Dr. {appointment.doctorName || 'Unknown'}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar size={14} className="mr-1" />
                  <span>
                    {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock size={14} className="mr-1" />
                  <span>
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-0 flex space-x-2">
              {appointment.type === 'video' && (
                <Link
                  to={`/consultation/${appointment.id}`}
                  className="btn-primary text-sm"
                >
                  Join Video
                </Link>
              )}
              <Link
                to={`/patient/appointments`}
                className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingAppointments;