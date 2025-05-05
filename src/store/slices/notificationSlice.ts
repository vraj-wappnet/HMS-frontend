import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'appointment' | 'alert' | 'message' | 'health' | 'system';
  read: boolean;
  userId: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/notifications/user/${userId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/notifications/${notificationId}/read`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const clearAllUserNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/notifications/user/${userId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear notifications');
    }
  }
);

const initialState: NotificationState = {
  notifications: [
    {
      id: '1',
      title: 'New Appointment',
      message: 'You have a new appointment scheduled with Dr. Smith tomorrow at 10:00 AM.',
      timestamp: new Date().toISOString(),
      type: 'appointment',
      read: false,
      userId: '1',
    },
    {
      id: '2',
      title: 'Abnormal Heart Rate',
      message: 'Your heart rate was above normal levels at 105 bpm for 15 minutes.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'alert',
      read: false,
      userId: '1',
    },
    {
      id: '3',
      title: 'Message from Dr. Johnson',
      message: 'Your test results have been reviewed. Please schedule a follow-up appointment.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'message',
      read: true,
      userId: '1',
    },
  ],
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const notification = state.notifications.find(
          (n) => n.id === action.payload.id
        );
        if (notification) {
          notification.read = true;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Clear all notifications
      .addCase(clearAllUserNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearAllUserNotifications.fulfilled, (state) => {
        state.loading = false;
        state.notifications = [];
      })
      .addCase(clearAllUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { markAsRead, clearAllNotifications, addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;