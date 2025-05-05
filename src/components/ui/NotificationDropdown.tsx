import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Check, AlertCircle, Activity, Calendar, MessageCircle } from 'lucide-react';
import { RootState } from '../../store';
import { markAsRead, clearAllNotifications } from '../../store/slices/notificationSlice';
import { format } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const dispatch = useDispatch();

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} className="text-primary" />;
      case 'alert':
        return <AlertCircle size={18} className="text-error" />;
      case 'message':
        return <MessageCircle size={18} className="text-secondary" />;
      case 'health':
        return <Activity size={18} className="text-warning" />;
      default:
        return <Bell size={18} className="text-primary" />;
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-medium">Notifications</h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-primary hover:text-primary/80"
        >
          Clear all
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Bell size={24} className="mx-auto mb-2 text-gray-400" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start ${
                !notification.read ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex-shrink-0 mr-3 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-gray-500">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="ml-2 flex-shrink-0 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-center">
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;