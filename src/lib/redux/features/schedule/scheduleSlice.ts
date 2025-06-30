// src/lib/redux/features/schedule/scheduleSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Lesson, Day } from '@/types';

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;

export type ScheduleState = {
  items: Lesson[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ScheduleState = {
  items: [],
  status: 'idle',
  error: null,
};

export const saveSchedule = createAsyncThunk<Lesson[], SchedulableLesson[], { rejectValue: string }>(
  'schedule/saveSchedule',
  async (newSchedule, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/lessons/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: newSchedule }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        return rejectWithValue(errorData.message ?? 'Échec de la sauvegarde de l\'emploi du temps');
      }
      return newSchedule as Lesson[];
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setInitialSchedule(state, action: PayloadAction<Lesson[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    updateLessonSlot(state, action: PayloadAction<{ lessonId: number; newDay: Day; newTime: string }>) {
        const { lessonId, newDay, newTime } = action.payload;
        const lesson = state.items.find(l => l.id === lessonId);

        if (lesson) {
            const start = new Date(lesson.startTime);
            const end = new Date(lesson.endTime);
            const durationMs = end.getTime() - start.getTime();

            const [hour, minute] = newTime.split(':').map(Number);
            
            const newStartDate = new Date(2000, 0, 1, hour, minute, 0);
            const newEndDate = new Date(newStartDate.getTime() + durationMs);

            lesson.day = newDay;
            lesson.startTime = newStartDate.toISOString();
            lesson.endTime = newEndDate.toISOString();
        }
    },
    updateLessonSubject(state, action: PayloadAction<{ lessonId: number; newSubjectId: number }>) {
      const { lessonId, newSubjectId } = action.payload;
      const lesson = state.items.find(l => l.id === lessonId);
      if (lesson) {
        lesson.subjectId = newSubjectId;
        // The name update is optional but good for consistency if displayed directly
        lesson.name = lesson.name.replace(/^[^ -]+/, 'Updated');
      }
    },
    updateLessonRoom(state, action: PayloadAction<{ lessonId: number; classroomId: number | null }>) {
      const lesson = state.items.find(l => l.id === action.payload.lessonId);
      if (lesson) {
        lesson.classroomId = action.payload.classroomId;
      }
    },
    addLesson(state, action: PayloadAction<SchedulableLesson>) {
      const tempId = -Date.now();
      const newLesson = { 
        ...action.payload, 
        id: tempId, 
        createdAt: new Date().toISOString(), // Use serializable string
        updatedAt: new Date().toISOString()  // Use serializable string
      };
      // Cast to Lesson type is necessary because the Prisma type expects Date objects,
      // but the application state uses strings for dates to ensure serializability.
      state.items.push(newLesson as Lesson);
    },
    removeLesson(state, action: PayloadAction<number>) {
      state.items = state.items.filter(lesson => lesson.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSchedule.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveSchedule.fulfilled, (state, action: PayloadAction<Lesson[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(saveSchedule.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save schedule';
      });
  },
  selectors: {
    selectSchedule: (state) => state.items,
    selectScheduleStatus: (state) => state.status,
  }
});

export const { setInitialSchedule, updateLessonSlot, updateLessonSubject, updateLessonRoom, addLesson, removeLesson } = scheduleSlice.actions;
export const { selectSchedule, selectScheduleStatus } = scheduleSlice.selectors;
export default scheduleSlice.reducer;
