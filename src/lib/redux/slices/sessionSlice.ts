import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { arrayMove } from '@dnd-kit/sortable';

export interface Badge {
  id: string;
  type: 'participation' | 'correct_answer' | 'helpful' | 'creative' | 'leader' | 'consistent';
  name: string;
  description: string;
  icon: string;
  earnedAt: string; 
}

export interface SessionParticipant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  img?: string | null;
  isOnline: boolean;
  isInSession: boolean;
  hasRaisedHand?: boolean;
  raisedHandAt?: string;
  points: number;
  badges: Badge[];
}

export interface ClassRoom {
  id: number;
  name: string;
  students: SessionParticipant[];
  abbreviation: string | null; // Keep nullable as per previous definition
  capacity: number; // Change to number (non-nullable)
  building: string | null;
}

export interface Reaction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'thumbs_up' | 'thumbs_down' | 'heart' | 'laugh' | 'understood' | 'confused';
  timestamp: string; 
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; 
  timeLimit: number; 
}

export interface QuizAnswer {
  studentId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  startTime: string; 
  endTime?: string; 
  answers: QuizAnswer[];
  timeRemaining: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; 
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: string; 
  endedAt?: string; 
  totalVotes: number;
}

export interface RewardAction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'manual' | 'quiz_correct' | 'participation' | 'poll_vote';
  points: number;
  badge?: Badge;
  reason: string;
  timestamp: string;
}

export interface ActiveSession {
  id: string;
  sessionType: 'class' | 'meeting';
  classId: string;
  className: string;
  participants: SessionParticipant[];
  startTime: string; 
  raisedHands: string[];
  reactions: Reaction[];
  polls: Poll[];
  activePoll?: Poll;
  quizzes: Quiz[];
  activeQuiz?: Quiz;
  rewardActions: RewardAction[];
  classTimer: {
    duration: number;
    remaining: number;
    isActive: boolean;
  } | null;
}

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    message?: string;
    timestamp: string;
    userRole: 'admin' | 'teacher' | 'student';
    documentUrl?: string;
    documentType?: 'image' | 'pdf' | 'other';
    documentName?: string;
}


interface SessionState {
  classes: ClassRoom[];
  selectedClass: ClassRoom | null;
  selectedStudents: string[];
  meetingCandidates: SessionParticipant[];
  selectedTeachers: string[];
  activeSession: ActiveSession | null;
  loading: boolean;
  chatMessages: ChatMessage[];
}

const initialState: SessionState = {
  classes: [],
  selectedClass: null,
  selectedStudents: [],
  meetingCandidates: [],
  selectedTeachers: [],
  activeSession: null,
  loading: false,
  chatMessages: [],
};

export const fetchChatroomClasses = createAsyncThunk<ClassRoom[], void, { rejectValue: string }>(
  'session/fetchChatroomClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/chatroom/classes');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Échec de la récupération des classes');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Une erreur réseau inconnue est survenue');
    }
  }
);

export const fetchMeetingParticipants = createAsyncThunk<SessionParticipant[], void, { rejectValue: string }>(
    'session/fetchMeetingParticipants',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chatroom/teachers');
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message || 'Échec de la récupération des professeurs');
            }
            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue('Une erreur réseau inconnue est survenue');
        }
    }
);


const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSelectedClass: (state, action: PayloadAction<ClassRoom | null>) => {
      state.selectedClass = action.payload;
      state.selectedStudents = [];
    },
    toggleStudentSelection: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.selectedStudents.includes(studentId)) {
        state.selectedStudents = state.selectedStudents.filter(id => id !== studentId);
      } else {
        state.selectedStudents.push(studentId);
      }
    },
    toggleTeacherSelection: (state, action: PayloadAction<string>) => {
        const teacherId = action.payload;
        if (state.selectedTeachers.includes(teacherId)) {
            state.selectedTeachers = state.selectedTeachers.filter(id => id !== teacherId);
        } else {
            state.selectedTeachers.push(teacherId);
        }
    },
    startSession: (state, action: PayloadAction<{ classId: string; className: string }>) => {
      const { classId, className } = action.payload;
      const selectedStudentsData = state.selectedClass?.students.filter(
        student => state.selectedStudents.includes(student.id)
      ) || [];
      
      state.activeSession = {
        id: `session_${Date.now()}`,
        sessionType: 'class',
        classId,
        className,
        participants: selectedStudentsData.map(s => ({ 
          ...s, 
          isInSession: true, 
          hasRaisedHand: false,
          points: s.points || 0,
          badges: s.badges || []
        })),
        startTime: new Date().toISOString(),
        raisedHands: [],
        reactions: [],
        polls: [],
        activePoll: undefined,
        quizzes: [],
        activeQuiz: undefined,
        rewardActions: [],
        classTimer: null,
      };
      state.chatMessages = []; // Clear chat on new session
    },
    startMeeting: (state, action: PayloadAction<{ meetingTitle: string; participants: SessionParticipant[] }>) => {
        const { meetingTitle, participants } = action.payload;
        state.activeSession = {
            id: `meeting_${Date.now()}`,
            sessionType: 'meeting',
            classId: 'admin-meeting', // Generic ID for meetings
            className: meetingTitle,
            participants: participants.map(p => ({ ...p, isInSession: true, points: 0, badges: [] })),
            startTime: new Date().toISOString(),
            raisedHands: [],
            reactions: [],
            polls: [],
            quizzes: [],
            rewardActions: [],
            classTimer: null,
        };
        state.chatMessages = []; // Clear chat on new session
    },
    moveParticipant: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
        if (state.activeSession) {
            const { fromIndex, toIndex } = action.payload;
            state.activeSession.participants = arrayMove(state.activeSession.participants, fromIndex, toIndex);
        }
    },
    removeStudentFromSession: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        state.activeSession.participants = state.activeSession.participants.filter(
          p => p.id !== action.payload
        );
        state.activeSession.raisedHands = state.activeSession.raisedHands.filter(
          id => id !== action.payload
        );
      }
    },
    addStudentToSession: (state, action: PayloadAction<SessionParticipant>) => {
      if (state.activeSession) {
        state.activeSession.participants.push({ 
          ...action.payload, 
          isInSession: true, 
          hasRaisedHand: false,
          points: action.payload.points || 0,
          badges: action.payload.badges || []
        });
      }
    },
    raiseHand: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.activeSession) {
        if (!state.activeSession.raisedHands.includes(studentId)) {
          state.activeSession.raisedHands.push(studentId);
        }
        
        const participant = state.activeSession.participants.find(p => p.id === studentId);
        if (participant) {
          participant.hasRaisedHand = true;
          participant.raisedHandAt = new Date().toISOString();
        }
      }
    },
    lowerHand: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.activeSession) {
        state.activeSession.raisedHands = state.activeSession.raisedHands.filter(
          id => id !== studentId
        );
        
        const participant = state.activeSession.participants.find(p => p.id === studentId);
        if (participant) {
          participant.hasRaisedHand = false;
          participant.raisedHandAt = undefined;
        }
      }
    },
    clearAllRaisedHands: (state) => {
      if (state.activeSession) {
        state.activeSession.raisedHands = [];
        state.activeSession.participants.forEach(p => {
          p.hasRaisedHand = false;
          p.raisedHandAt = undefined;
        });
      }
    },
    sendReaction: (state, action: PayloadAction<{ studentId: string; studentName: string; type: 'thumbs_up' | 'thumbs_down' | 'heart' | 'laugh' | 'understood' | 'confused' }>) => {
      if (state.activeSession) {
        const reaction: Reaction = {
          id: `reaction_${Date.now()}`,
          studentId: action.payload.studentId,
          studentName: action.payload.studentName,
          type: action.payload.type,
          timestamp: new Date().toISOString(),
        };
        
        state.activeSession.reactions.unshift(reaction);
        
        if (state.activeSession.reactions.length > 50) {
          state.activeSession.reactions = state.activeSession.reactions.slice(0, 50);
        }
      }
    },
    clearReactions: (state) => {
      if (state.activeSession) {
        state.activeSession.reactions = [];
      }
    },
    createPoll: (state, action: PayloadAction<{ question: string; options: string[] }>) => {
      if (state.activeSession) {
        const poll: Poll = {
          id: `poll_${Date.now()}`,
          question: action.payload.question,
          options: action.payload.options.map((text, index) => ({
            id: `option_${index}`,
            text,
            votes: [],
          })),
          isActive: true,
          createdAt: new Date().toISOString(),
          totalVotes: 0,
        };
        
        state.activeSession.polls.push(poll);
        state.activeSession.activePoll = poll;
      }
    },
    votePoll: (state, action: PayloadAction<{ pollId: string; optionId: string; studentId: string }>) => {
        if (!state.activeSession) return;
        const poll = state.activeSession.polls.find(p => p.id === action.payload.pollId);
        if (!poll || !poll.isActive) return;

        const hasVoted = poll.options.some(opt => opt.votes.includes(action.payload.studentId));
        
        poll.options.forEach(option => {
            option.votes = option.votes.filter(id => id !== action.payload.studentId);
        });

        const option = poll.options.find(o => o.id === action.payload.optionId);
        if (option) {
            option.votes.push(action.payload.studentId);
        }

        if (!hasVoted) {
            const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
            if (student && state.activeSession.sessionType === 'class') {
                student.points = (student.points || 0) + 2;
                const rewardAction: RewardAction = {
                    id: `reward_poll_${Date.now()}`,
                    studentId: action.payload.studentId,
                    studentName: student.name,
                    type: 'poll_vote',
                    points: 2,
                    reason: `A voté au sondage: "${poll.question.substring(0, 20)}..."`,
                    timestamp: new Date().toISOString(),
                };
                state.activeSession.rewardActions.unshift(rewardAction);
            }
        }

        poll.totalVotes = poll.options.reduce((total, opt) => total + opt.votes.length, 0);
        
        if (state.activeSession.activePoll?.id === poll.id) {
            state.activeSession.activePoll = { ...poll };
        }
    },
    endPoll: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const poll = state.activeSession.polls.find(p => p.id === action.payload);
        if (poll) {
          poll.isActive = false;
          poll.endedAt = new Date().toISOString();
          
          if (state.activeSession.activePoll?.id === poll.id) {
            state.activeSession.activePoll = undefined;
          }
        }
      }
    },
    endSession: (state) => {
      state.activeSession = null;
      state.selectedStudents = [];
      state.selectedTeachers = [];
    },
    updateStudentPresence: (state, action: PayloadAction<{ studentId: string; isOnline: boolean }>) => {
      const { studentId, isOnline } = action.payload;
      state.classes.forEach(classroom => {
        const student = classroom.students.find(s => s.id === studentId);
        if (student) {
          student.isOnline = isOnline;
        }
      });
      
      if (state.activeSession) {
        const participant = state.activeSession.participants.find(p => p.id === studentId);
        if (participant) {
          participant.isOnline = isOnline;
        }
      }
    },
    
    // Quiz Actions
    createQuiz: (state, action: PayloadAction<{ title: string; questions: Omit<QuizQuestion, 'id'>[] }>) => {
      if (state.activeSession) {
        const quiz: Quiz = {
          id: `quiz_${Date.now()}`,
          title: action.payload.title,
          questions: action.payload.questions.map((q, index) => ({
            ...q,
            id: `question_${index}`,
          })),
          currentQuestionIndex: 0,
          isActive: true,
          startTime: new Date().toISOString(),
          answers: [],
          timeRemaining: action.payload.questions[0]?.timeLimit || 30,
        };
        
        state.activeSession.quizzes.push(quiz);
        state.activeSession.activeQuiz = quiz;
      }
    },
    
    answerQuiz: (state, action: PayloadAction<{ quizId: string; questionId: string; selectedOption: number; studentId: string }>) => {
        if (!state.activeSession) return;
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
        if (!quiz || !quiz.isActive) return;

        const question = quiz.questions.find(q => q.id === action.payload.questionId);
        if (!question) return;

        const hasAnswered = quiz.answers.some(a => a.studentId === action.payload.studentId && a.questionId === action.payload.questionId);
        if (hasAnswered) return;

        const isCorrect = action.payload.selectedOption === question.correctAnswer;
        const answer: QuizAnswer = {
            studentId: action.payload.studentId,
            questionId: action.payload.questionId,
            selectedOption: action.payload.selectedOption,
            isCorrect,
            answeredAt: new Date().toISOString(),
        };
        quiz.answers.push(answer);
        
        const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
        if (student && state.activeSession.sessionType === 'class') {
            const pointsAwarded = isCorrect ? 10 : 1;
            const reason = isCorrect ? 'Bonne réponse au quiz' : 'Participation au quiz';
            student.points = (student.points || 0) + pointsAwarded;
            const rewardAction: RewardAction = {
                id: `reward_quiz_${Date.now()}`,
                studentId: action.payload.studentId,
                studentName: student.name,
                type: isCorrect ? 'quiz_correct' : 'participation',
                points: pointsAwarded,
                reason: `${reason}: "${question.question.substring(0, 20)}..."`,
                timestamp: new Date().toISOString(),
            };
            state.activeSession.rewardActions.unshift(rewardAction);
        }

        if (state.activeSession.activeQuiz?.id === quiz.id) {
            state.activeSession.activeQuiz = { ...quiz };
        }
    },
    
    nextQuizQuestion: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
        if (quiz && quiz.isActive) {
          if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
            quiz.currentQuestionIndex += 1;
            quiz.timeRemaining = quiz.questions[quiz.currentQuestionIndex].timeLimit;
          } else {
            quiz.isActive = false;
            quiz.endTime = new Date().toISOString();
            if (state.activeSession.activeQuiz?.id === quiz.id) {
              state.activeSession.activeQuiz = undefined;
            }
          }
          
          if (state.activeSession.activeQuiz?.id === quiz.id) {
            state.activeSession.activeQuiz = { ...quiz };
          }
        }
      }
    },
    
    updateQuizTimer: (state, action: PayloadAction<{ quizId: string; timeRemaining: number }>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
        if (quiz && quiz.isActive) {
          quiz.timeRemaining = action.payload.timeRemaining;
          
          if (state.activeSession.activeQuiz?.id === quiz.id) {
            state.activeSession.activeQuiz = { ...quiz };
          }
        }
      }
    },
    
    endQuiz: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
        if (quiz) {
          quiz.isActive = false;
          quiz.endTime = new Date().toISOString();
          
          if (state.activeSession.activeQuiz?.id === quiz.id) {
            state.activeSession.activeQuiz = undefined;
          }
        }
      }
    },
    
    awardReward: (state, action: PayloadAction<{ studentId: string; points: number; badge?: Omit<Badge, 'id' | 'earnedAt'>; reason: string }>) => {
      if (state.activeSession) {
        const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
        if (student) {
          student.points = (student.points || 0) + action.payload.points;
          
          let badge: Badge | undefined;
          if (action.payload.badge) {
            badge = {
              ...action.payload.badge,
              id: `badge_${Date.now()}`,
              earnedAt: new Date().toISOString(),
            };
            
            if (!student.badges) student.badges = [];
            student.badges.push(badge);
          }
          
          const rewardAction: RewardAction = {
            id: `reward_${Date.now()}`,
            studentId: action.payload.studentId,
            studentName: student.name,
            type: 'manual',
            points: action.payload.points,
            badge,
            reason: action.payload.reason,
            timestamp: new Date().toISOString(),
          };
          
          state.activeSession.rewardActions.unshift(rewardAction);
        }
      }
    },
    
    awardParticipationPoints: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const student = state.activeSession.participants.find(p => p.id === action.payload);
        if (student) {
          student.points = (student.points || 0) + 5;
          
          const rewardAction: RewardAction = {
            id: `reward_${Date.now()}`,
            studentId: action.payload,
            studentName: student.name,
            type: 'participation',
            points: 5,
            reason: 'Participation active',
            timestamp: new Date().toISOString(),
          };
          
          state.activeSession.rewardActions.push(rewardAction);
        }
      }
    },
    sendMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
        if (state.activeSession) {
            const message: ChatMessage = {
                ...action.payload,
                id: `msg_${Date.now()}`,
                timestamp: new Date().toISOString(),
            };
            state.chatMessages.push(message);
        }
    },
    shareDocument: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
        if (state.activeSession) {
            const documentMessage: ChatMessage = {
                ...action.payload,
                id: `doc_${Date.now()}`,
                timestamp: new Date().toISOString(),
            };
            state.chatMessages.push(documentMessage);
        }
    },
    clearChatMessages: (state) => {
        state.chatMessages = [];
    },

    // Timer Actions
    setTimer: (state, action: PayloadAction<number>) => {
      if (state.activeSession) {
        state.activeSession.classTimer = {
          duration: action.payload,
          remaining: action.payload,
          isActive: false,
        };
      }
    },
    toggleTimer: (state) => {
      if (state.activeSession?.classTimer) {
        state.activeSession.classTimer.isActive = !state.activeSession.classTimer.isActive;
      }
    },
    resetTimer: (state) => {
      if (state.activeSession?.classTimer) {
        state.activeSession.classTimer.remaining = state.activeSession.classTimer.duration;
        state.activeSession.classTimer.isActive = false;
      }
    },
    stopTimer: (state) => {
      if (state.activeSession) {
        state.activeSession.classTimer = null;
      }
    },
    tickTimer: (state) => {
      if (state.activeSession?.classTimer?.isActive && state.activeSession.classTimer.remaining > 0) {
        state.activeSession.classTimer.remaining--;
      } else if (state.activeSession?.classTimer) {
          state.activeSession.classTimer.isActive = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatroomClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChatroomClasses.fulfilled, (state, action: PayloadAction<ClassRoom[]>) => {
        state.classes = action.payload;
        state.loading = false;
      })
      .addCase(fetchChatroomClasses.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMeetingParticipants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMeetingParticipants.fulfilled, (state, action: PayloadAction<SessionParticipant[]>) => {
        state.meetingCandidates = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingParticipants.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setSelectedClass,
  toggleStudentSelection,
  toggleTeacherSelection,
  startSession,
  startMeeting,
  moveParticipant,
  removeStudentFromSession,
  addStudentToSession,
  raiseHand,
  lowerHand,
  clearAllRaisedHands,
  sendReaction,
  clearReactions,
  createPoll,
  votePoll,
  endPoll,
  endSession,
  updateStudentPresence,
  createQuiz,
  answerQuiz,
  nextQuizQuestion,
  updateQuizTimer,
  endQuiz,
  awardReward,
  awardParticipationPoints,
  sendMessage,
  shareDocument,
  clearChatMessages,
  setTimer,
  toggleTimer,
  resetTimer,
  stopTimer,
  tickTimer,
} = sessionSlice.actions;

export default sessionSlice.reducer;
