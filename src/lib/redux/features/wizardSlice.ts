// src/lib/redux/features/wizardSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Subject } from '@/types';

export interface WizardState {
    selectedSubject: Subject | null;
}

const initialState: WizardState = {
    selectedSubject: null,
};

const wizardSlice = createSlice({
    name: 'wizard',
    initialState,
    reducers: {
        toggleSelectedSubject: (state, action: PayloadAction<Subject>) => {
            if (state.selectedSubject?.id === action.payload.id) {
                state.selectedSubject = null;
            } else {
                state.selectedSubject = action.payload;
            }
        },
        clearSelectedSubject: (state) => {
            state.selectedSubject = null;
        }
    },
    selectors: {
        selectCurrentSubject: (state) => state.selectedSubject,
    }
});

export const { toggleSelectedSubject, clearSelectedSubject } = wizardSlice.actions;
export const { selectCurrentSubject } = wizardSlice.selectors;
export default wizardSlice.reducer;
