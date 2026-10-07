import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider
      value={{
        user: null,
        isAuthenticated: true,
        isLoading: false,
        isAuthModalOpen: false,
        isAuthenticating: false,
        authError: null,
        signInWithGoogle: async () => ({ success: true }),
        signOut: async () => {},
        openAuthModal: () => {},
        closeAuthModal: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
