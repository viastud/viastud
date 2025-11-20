import type { AdminDto } from '@viastud/server/routers/admin_auth_router'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthStateAuthenticated {
  admin: AdminDto
  isAuthenticated: true
}

interface AuthStateNotAuthenticated {
  admin: undefined
  isAuthenticated: false
}

export type AuthState = AuthStateAuthenticated | AuthStateNotAuthenticated

interface AuthActions {
  updateAuth: (state: AuthState) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      admin: undefined,
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
