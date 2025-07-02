// src/lib/redux/features/teacherAssignmentsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TeacherAssignment {
  teacherId: string;
  subjectId: number;
  classIds: number[];
}

export type TeacherAssignmentsState = {
  items: TeacherAssignment[];
};

const initialState: TeacherAssignmentsState = {
  items: [],
};

export const teacherAssignmentsSlice = createSlice({
  name: 'teacherAssignments',
  initialState,
  reducers: {
    setAllTeacherAssignments(state, action: PayloadAction<TeacherAssignment[]>) {
      state.items = action.payload;
    },
    updateTeacherAssignment(state, action: PayloadAction<TeacherAssignment>) {
      const { teacherId, subjectId, classIds } = action.payload;
      const existingIndex = state.items.findIndex(
        (a) => a.teacherId === teacherId && a.subjectId === subjectId
      );

      if (existingIndex > -1) {
        // Update existing assignment
        state.items[existingIndex].classIds = classIds;
      } else {
        // Add new assignment
        state.items.push(action.payload);
      }
      // Remove assignments that have no classes
      state.items = state.items.filter(a => a.classIds.length > 0);
    },
    clearAllAssignments(state) {
        state.items = [];
    }
  },
  selectors: {
    selectTeacherAssignments: (state) => state.items,
  }
});

export const { setAllTeacherAssignments, updateTeacherAssignment, clearAllAssignments } = teacherAssignmentsSlice.actions;
export const { selectTeacherAssignments } = teacherAssignmentsSlice.selectors;
export default teacherAssignmentsSlice.reducer;
