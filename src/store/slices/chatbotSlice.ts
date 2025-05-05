import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../config';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

interface ChatbotState {
  messages: Message[];
  reportedSymptoms: Symptom[];
  loading: boolean;
  analysisLoading: boolean;
  analysisResult: { analysis: string; [key: string]: any } | null;
  error: string | null;
}

export const sendMessage = createAsyncThunk(
  'chatbot/sendMessage',
  async (message: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chatbot/message`, { message });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message');
    }
  }
);

export const analyzeSymptoms = createAsyncThunk(
  'chatbot/analyzeSymptoms',
  async (symptoms: Symptom[], { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chatbot/analyze`, { symptoms });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to analyze symptoms');
    }
  }
);

const initialState: ChatbotState = {
  messages: [
    {
      id: '1',
      sender: 'bot',
      content: 'Hello! I\'m your healthcare assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ],
  reportedSymptoms: [],
  loading: false,
  analysisLoading: false,
  analysisResult: null,
  error: null,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    addSymptom: (state, action) => {
      state.reportedSymptoms.push(action.payload);
    },
    removeSymptom: (state, action) => {
      state.reportedSymptoms = state.reportedSymptoms.filter(
        (symptom) => symptom.id !== action.payload
      );
    },
    clearChat: (state) => {
      state.messages = [
        {
          id: Date.now().toString(),
          sender: 'bot',
          content: 'Hello! I\'m your healthcare assistant. How can I help you today?',
          timestamp: new Date().toISOString(),
        },
      ];
      state.reportedSymptoms = [];
      state.analysisResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
        
        // If symptoms were detected in the response, add them
        if (action.payload.detectedSymptoms) {
          action.payload.detectedSymptoms.forEach((symptom: Symptom) => {
            if (!state.reportedSymptoms.some((s) => s.name === symptom.name)) {
              state.reportedSymptoms.push(symptom);
            }
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Analyze symptoms
      .addCase(analyzeSymptoms.pending, (state) => {
        state.analysisLoading = true;
        state.error = null;
      })
      .addCase(analyzeSymptoms.fulfilled, (state, action) => {
        state.analysisLoading = false;
        state.analysisResult = action.payload;
        
        // Add the analysis result as a bot message
        state.messages.push({
          id: Date.now().toString(),
          sender: 'bot',
          content: `Based on your symptoms, here's my analysis: ${action.payload.analysis}`,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(analyzeSymptoms.rejected, (state, action) => {
        state.analysisLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addMessage, addSymptom, removeSymptom, clearChat } = chatbotSlice.actions;

export default chatbotSlice.reducer;

