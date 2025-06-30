// src/lib/redux/features/subjectRequirementsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SubjectRequirement {
  subjectId: number;
  requiredRoomId: number | 'any'; 
}

const initialState: { items: SubjectRequirement[] } = {
  items: [],
};

const subjectRequirementsSlice = createSlice({
  name: 'subjectRequirements',
  initialState,
  reducers: {
    setSubjectRequirement: (state, action: PayloadAction<SubjectRequirement>) => {
        const existingIndex = state.items.findIndex(r => r.subjectId === action.payload.subjectId);
        if (existingIndex > -1) {
            state.items[existingIndex] = action.payload;
        } else {
            state.items.push(action.payload);
        }
    },
    setAllSubjectRequirements(state, action: PayloadAction<SubjectRequirement[]>) {
        state.items = action.payload;
    }
  },
  selectors: {
    selectSubjectRequirements: (state) => state.items,
  },
});

export const { setSubjectRequirement, setAllSubjectRequirements } = subjectRequirementsSlice.actions;
export const { selectSubjectRequirements } = subjectRequirementsSlice.selectors;
export default subjectRequirementsSlice.reducer;
