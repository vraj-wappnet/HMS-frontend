import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

interface HealthDataPoint {
  id: string;
  patientId: string;
  timestamp: string;
  type: string; // 'heartRate', 'bloodPressure', 'bloodOxygen', 'temperature', etc.
  value: number;
  unit: string;
  isAbnormal: boolean;
}

interface HealthDataState {
  realtimeData: {
    heartRate: HealthDataPoint[];
    bloodPressure: HealthDataPoint[];
    bloodOxygen: HealthDataPoint[];
    temperature: HealthDataPoint[];
  };
  historicalData: HealthDataPoint[];
  abnormalReadings: HealthDataPoint[];
  loading: boolean;
  error: string | null;
}

export const fetchPatientHealthData = createAsyncThunk(
  'healthData/fetchPatientHealthData',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/health-data/${patientId}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch health data');
    }
  }
);

export const fetchRealtimeHealthData = createAsyncThunk(
  'healthData/fetchRealtimeHealthData',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/health-data/${patientId}/realtime`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch realtime health data');
    }
  }
);

export const fetchAbnormalReadings = createAsyncThunk(
  'healthData/fetchAbnormalReadings',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/health-data/${patientId}/abnormal`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch abnormal readings');
    }
  }
);

const initialState: HealthDataState = {
  realtimeData: {
    heartRate: [],
    bloodPressure: [],
    bloodOxygen: [],
    temperature: [],
  },
  historicalData: [],
  abnormalReadings: [],
  loading: false,
  error: null,
};

const healthDataSlice = createSlice({
  name: 'healthData',
  initialState,
  reducers: {
    // For simulating realtime data updates in dev
    updateRealtimeData: (state, action) => {
      const { type, data } = action.payload;
      if (type === 'heartRate') {
        state.realtimeData.heartRate.push(data);
        // Keep only last 20 points for realtime display
        if (state.realtimeData.heartRate.length > 20) {
          state.realtimeData.heartRate.shift();
        }
      } else if (type === 'bloodPressure') {
        state.realtimeData.bloodPressure.push(data);
        if (state.realtimeData.bloodPressure.length > 20) {
          state.realtimeData.bloodPressure.shift();
        }
      } else if (type === 'bloodOxygen') {
        state.realtimeData.bloodOxygen.push(data);
        if (state.realtimeData.bloodOxygen.length > 20) {
          state.realtimeData.bloodOxygen.shift();
        }
      } else if (type === 'temperature') {
        state.realtimeData.temperature.push(data);
        if (state.realtimeData.temperature.length > 20) {
          state.realtimeData.temperature.shift();
        }
      }

      // Check for abnormal readings
      if (data.isAbnormal) {
        state.abnormalReadings.push(data);
      }
    },
    clearHealthData: (state) => {
      state.realtimeData = {
        heartRate: [],
        bloodPressure: [],
        bloodOxygen: [],
        temperature: [],
      };
      state.historicalData = [];
      state.abnormalReadings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patient health data
      .addCase(fetchPatientHealthData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientHealthData.fulfilled, (state, action) => {
        state.loading = false;
        state.historicalData = action.payload;
      })
      .addCase(fetchPatientHealthData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch realtime health data
      .addCase(fetchRealtimeHealthData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRealtimeHealthData.fulfilled, (state, action) => {
        state.loading = false;
        // Group data by type
        const heartRate: HealthDataPoint[] = [];
        const bloodPressure: HealthDataPoint[] = [];
        const bloodOxygen: HealthDataPoint[] = [];
        const temperature: HealthDataPoint[] = [];
        
        action.payload.forEach((item: HealthDataPoint) => {
          switch (item.type) {
            case 'heartRate':
              heartRate.push(item);
              break;
            case 'bloodPressure':
              bloodPressure.push(item);
              break;
            case 'bloodOxygen':
              bloodOxygen.push(item);
              break;
            case 'temperature':
              temperature.push(item);
              break;
            default:
              break;
          }
        });
        
        state.realtimeData = {
          heartRate,
          bloodPressure,
          bloodOxygen,
          temperature,
        };
      })
      .addCase(fetchRealtimeHealthData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch abnormal readings
      .addCase(fetchAbnormalReadings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAbnormalReadings.fulfilled, (state, action) => {
        state.loading = false;
        state.abnormalReadings = action.payload;
      })
      .addCase(fetchAbnormalReadings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateRealtimeData, clearHealthData } = healthDataSlice.actions;

export default healthDataSlice.reducer;