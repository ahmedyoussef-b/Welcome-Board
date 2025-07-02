import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import authReducer from './slices/authSlice';
import { entityApi } from './api/entityApi';
import classesReducer from './features/classes/classesSlice';
import subjectsReducer from './features/subjects/subjectsSlice';
import teachersReducer from './features/teachers/teachersSlice';
import classroomsReducer from './features/classrooms/classroomsSlice';
import scheduleReducer from './features/schedule/scheduleSlice';
import sessionReducer from './slices/sessionSlice';
import notificationReducer from './slices/notificationSlice';
import reportReducer from './slices/reportSlice';
import lessonRequirementsReducer from './features/lessonRequirements/lessonRequirementsSlice';
import gradesReducer from './features/grades/gradesSlice';
import teacherConstraintsReducer from './features/teacherConstraintsSlice';
import subjectRequirementsReducer from './features/subjectRequirementsSlice';
import teacherAssignmentsReducer from './features/teacherAssignmentsSlice';
import schoolConfigReducer from './features/schoolConfigSlice';


const WIZARD_STATE_KEY = 'shuddleWizardState';

const loadState = () => {
  try {
    const serializedState = typeof window !== 'undefined' ? localStorage.getItem(WIZARD_STATE_KEY) : null;
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.warn("Could not load wizard state from localStorage", err);
    return undefined;
  }
};

const saveState = (state: any) => {
  try {
    const stateToPersist = {
      schoolConfig: state.schoolConfig,
      classes: state.classes,
      subjects: state.subjects,
      teachers: state.teachers,
      classrooms: state.classrooms,
      grades: state.grades,
      lessonRequirements: state.lessonRequirements,
      teacherConstraints: state.teacherConstraints,
      subjectRequirements: state.subjectRequirements,
      teacherAssignments: state.teacherAssignments,
      schedule: state.schedule,
    };
    const serializedState = JSON.stringify(stateToPersist);
    localStorage.setItem(WIZARD_STATE_KEY, serializedState);
  } catch (err) {
    console.warn("Could not save wizard state to localStorage", err);
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [entityApi.reducerPath]: entityApi.reducer,
    auth: authReducer,
    classes: classesReducer,
    subjects: subjectsReducer,
    teachers: teachersReducer,
    classrooms: classroomsReducer,
    schedule: scheduleReducer,
    session: sessionReducer,
    notifications: notificationReducer,
    reports: reportReducer,
    lessonRequirements: lessonRequirementsReducer,
    grades: gradesReducer,
    teacherConstraints: teacherConstraintsReducer,
    subjectRequirements: subjectRequirementsReducer,
    teacherAssignments: teacherAssignmentsReducer,
    schoolConfig: schoolConfigReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(entityApi.middleware),
});

store.subscribe(() => {
  saveState(store.getState());
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
