import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
  </div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
  </div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
