import { atom } from 'jotai';

export interface LMSState {
  currentCourse: string | null;
  currentLesson: string | null;
  progress: Record<string, number>;
}

export const lmsStateAtom = atom<LMSState>({
  currentCourse: null,
  currentLesson: null,
  progress: {}
});