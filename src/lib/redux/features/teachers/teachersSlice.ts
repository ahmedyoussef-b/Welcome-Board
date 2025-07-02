// src/lib/redux/features/teachers/teachersSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { TeacherWithDetails, CreateTeacherPayload, ClassWithGrade } from '@/types'; 

export type TeachersState = {
  items: Array<TeacherWithDetails>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: TeachersState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchProfesseurs = createAsyncThunk<Array<TeacherWithDetails>, void, { rejectValue: string }>(
  'teachers/fetchTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/teachers');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la récupération des professeurs');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const addProfesseur = createAsyncThunk<TeacherWithDetails, CreateTeacherPayload, { rejectValue: string }>(
  'teachers/addTeacher',
  async (newTeacher, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de l\'ajout du professeur');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const deleteProfesseur = createAsyncThunk<string, string, { rejectValue: string }>(
    'teachers/deleteTeacher',
    async (teacherId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Échec de la suppression');
            }
            return teacherId;
        } catch (error) {
            if (error instanceof Error) {
              return rejectWithValue(error.message);
            }
            return rejectWithValue('An unknown network error occurred');
        }
    }
);

export const saveTeacherAssignments = createAsyncThunk<
  void, 
  { teacherId: string; classIds: number[] }[],
  { rejectValue: string }
>(
  'teachers/saveAssignments',
  async (assignments, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/teachers/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignments),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la sauvegarde des assignations');
      }
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);


export const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setAllTeachers(state, action: PayloadAction<TeacherWithDetails[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    assignClassToTeacher(state, action: PayloadAction<{ teacherId: string; classData: ClassWithGrade }>) {
        const { teacherId, classData } = action.payload;
        // Step 1: Remove the class from any teacher who currently supervises it.
        // This ensures a class can only be supervised by one teacher at a time in the Redux state.
        state.items.forEach(teacher => {
            const classIndex = teacher.classes.findIndex(c => c.id === classData.id);
            if (classIndex > -1) {
                teacher.classes.splice(classIndex, 1);
            }
        });

        // Step 2: Find the new teacher and assign the class to them.
        const targetTeacher = state.items.find(teacher => teacher.id === teacherId);
        if (targetTeacher) {
            targetTeacher.classes.push(classData);
            targetTeacher.classes.sort((a, b) => a.name.localeCompare(b.name));
        }
    },
    unassignClassFromTeacher(state, action: PayloadAction<{ teacherId: string; classId: number }>) {
        const { teacherId, classId } = action.payload;
        state.items = state.items.map(teacher => 
            teacher.id !== teacherId
            ? teacher
            : {
                ...teacher,
                classes: teacher.classes.filter(c => c.id !== classId),
              }
        );
    },
    unassignAllClasses: (state) => {
        state.items.forEach(teacher => {
            teacher.classes = [];
        });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfesseurs.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfesseurs.fulfilled, (state, action: PayloadAction<Array<TeacherWithDetails>>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(addProfesseur.fulfilled, (state, action: PayloadAction<TeacherWithDetails>) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(deleteProfesseur.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      })
      .addCase(saveTeacherAssignments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveTeacherAssignments.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(saveTeacherAssignments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save assignments';
      })
      .addMatcher(
        (action): action is PayloadAction<string> => action.type.endsWith('/rejected') && !action.type.startsWith('teachers/saveAssignments'),
        (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        }
      );
  },
  selectors: {
    selectAllProfesseurs: (state) => state.items,
    getProfesseursStatus: (state) => state.status,
    getProfesseursError: (state) => state.error,
  }
});

export const { setAllTeachers, assignClassToTeacher, unassignClassFromTeacher, unassignAllClasses } = teachersSlice.actions;
export const { selectAllProfesseurs, getProfesseursStatus, getProfesseursError } = teachersSlice.selectors;
export default teachersSlice.reducer;
