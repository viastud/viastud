import type { Grade, Subject } from '@viastud/utils'
import { create } from 'zustand'

export interface OnboardingState {
  page: number
  grade?: Grade
  interestedIn: Subject[]
  doneModules: number[]
  doingModules: number[]
  updateOnBoardingState: (state: Partial<OnboardingState>) => void
}

export const useOnBoardingStore = create<OnboardingState>()((set) => ({
  page: 1,
  interestedIn: [],
  doneModules: [],
  doingModules: [],
  updateOnBoardingState: (state) => {
    set((prev) => ({ ...prev, ...state }))
  },
}))
