
// src/lib/redux/features/classes/classesSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { ClassWithGrade, CreateClassPayload } from '@/types';

export type ClassesState = {
  items: Array<ClassWithGrade>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ClassesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchClasses = createAsyncThunk<Array<ClassWithGrade>, void, { rejectValue: string }>(
  'classes/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la récupération des classes');
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

export const addClasse = createAsyncThunk<ClassWithGrade, CreateClassPayload, { rejectValue: string }>(
  'classes/addClasse',
  async (newClass, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de l\'ajout de la classe');
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

export const deleteClasse = createAsyncThunk<number, number, { rejectValue: string }>(
  'classes/deleteClasse',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la suppression');
      }
      return id;
    } catch (error) {
       if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);


export const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setAllClasses(state, action: PayloadAction<ClassWithGrade[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action: PayloadAction<Array<ClassWithGrade>>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(addClasse.fulfilled, (state, action: PayloadAction<ClassWithGrade>) => {
        state.items.push(action.payload);
      })
      .addCase(deleteClasse.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(c => c.id !== action.payload);
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
    selectAllClasses: (state) => state.items,
    getClassesStatus: (state) => state.status,
    getClassesError: (state) => state.error,
  }
});

export const { setAllClasses } = classesSlice.actions;
export const { selectAllClasses, getClassesStatus, getClassesError } = classesSlice.selectors;
export default classesSlice.reducer;
