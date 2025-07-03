
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionReport {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  startTime: string; // Changed from Date
  endTime?: string; // Changed from Date
  duration: number; // en secondes
  participants: Array<{
    id: string;
    name: string;
    email: string;
    joinTime: string; // Changed from Date
    leaveTime?: string; // Changed from Date
    duration: number; // temps passé dans la session en secondes
  }>;
  maxParticipants: number;
  status: 'active' | 'completed';
}

interface ReportState {
  sessions: SessionReport[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  sessions: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    addSessionReport: (state, action: PayloadAction<SessionReport>) => {
      state.sessions.unshift(action.payload);
    },
    updateSessionReport: (state, action: PayloadAction<Partial<SessionReport> & { id: string }>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = { ...state.sessions[index], ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addSessionReport,
  updateSessionReport,
  setLoading,
  setError,
} = reportSlice.actions;

export default reportSlice.reducer;
