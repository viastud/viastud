import type { UserDto } from '@viastud/ui/shared/edit-profile'
import type { UserRole } from '@viastud/utils'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface UserAuthStateAuthenticated {
  user: UserDto
  role: UserRole
  isAuthenticated: true
}

interface AuthStateNotAuthenticated {
  user: undefined
  role: null
  isAuthenticated: false
}

export type AuthState = UserAuthStateAuthenticated | AuthStateNotAuthenticated

interface AuthActions {
  updateAuth: (state: AuthState) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: undefined,
      role: null,
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
