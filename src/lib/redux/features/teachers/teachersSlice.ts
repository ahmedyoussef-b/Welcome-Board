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

export const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setAllTeachers(state, action: PayloadAction<TeacherWithDetails[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    assignClassToTeacher(state, action: PayloadAction<{ teacherId: string; classData: ClassWithGrade }>) {
        console.log('[teachersSlice] ACTION: assignClassToTeacher, Payload:', action.payload);
        const { teacherId, classData } = action.payload;
        const teacherIndex = state.items.findIndex(t => t.id === teacherId);

        if (teacherIndex !== -1) {
            console.log('[teachersSlice] Teacher Found:', state.items[teacherIndex].name, 'at index', teacherIndex);
            console.log('[teachersSlice] Old classes:', state.items[teacherIndex].classes.map(c => c.name));
            
            // Create a new teacher object with a new, sorted array for classes
            const updatedTeacher = {
                ...state.items[teacherIndex],
                classes: [...state.items[teacherIndex].classes, classData].sort((a,b) => a.name.localeCompare(b.name)),
            };
            
            console.log('[teachersSlice] New classes:', updatedTeacher.classes.map(c => c.name));
            
            // Create a new items array, replacing the old teacher object with the updated one
            const newItems = [...state.items];
            newItems[teacherIndex] = updatedTeacher;
            state.items = newItems;
            console.log('[teachersSlice] State updated.');
        } else {
            console.log('[teachersSlice] Teacher not found for ID:', teacherId);
        }
    },
    unassignClassFromTeacher(state, action: PayloadAction<{ teacherId: string; classId: number }>) {
        console.log('[teachersSlice] ACTION: unassignClassFromTeacher, Payload:', action.payload);
        const { teacherId, classId } = action.payload;
        const teacherIndex = state.items.findIndex(t => t.id === teacherId);

        if (teacherIndex !== -1) {
             console.log('[teachersSlice] Teacher Found:', state.items[teacherIndex].name, 'at index', teacherIndex);
            console.log('[teachersSlice] Old classes:', state.items[teacherIndex].classes.map(c => c.name));
            // Create a new teacher object with a new, filtered array for classes
            const updatedTeacher = {
                ...state.items[teacherIndex],
                classes: state.items[teacherIndex].classes.filter(c => c.id !== classId),
            };
            
            console.log('[teachersSlice] New classes after unassign:', updatedTeacher.classes.map(c => c.name));

            // Create a new items array, replacing the old teacher object with the updated one
            const newItems = [...state.items];
            newItems[teacherIndex] = updatedTeacher;
            state.items = newItems;
            console.log('[teachersSlice] State updated.');
        } else {
            console.log('[teachersSlice] Teacher not found for ID:', teacherId);
        }
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
      .addMatcher(
        (action): action is PayloadAction<string> => action.type.endsWith('/rejected'),
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

export const { setAllTeachers, assignClassToTeacher, unassignClassFromTeacher } = teachersSlice.actions;
export const { selectAllProfesseurs, getProfesseursStatus, getProfesseursError } = teachersSlice.selectors;
export default teachersSlice.reducer;
