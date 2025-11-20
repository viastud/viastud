import type { ReducedProfessorDto } from '@viastud/server/routers/professor_auth_router'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthStateAuthenticated {
  professor: ReducedProfessorDto
  isAuthenticated: true
}

interface AuthStateNotAuthenticated {
  professor: undefined
  isAuthenticated: false
}

export type AuthState = AuthStateAuthenticated | AuthStateNotAuthenticated

interface AuthActions {
  updateAuth: (state: AuthStateAuthenticated | AuthStateNotAuthenticated) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      professor: undefined,
      isAuthenticated: false,
      updateAuth: (state) => {
        set(state)
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage<AuthState>(() => localStorage),
    }
  )
)
