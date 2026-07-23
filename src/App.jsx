import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Landing, { AgeGateModal } from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Noticias from './pages/Noticias'
import NoticiaDetalle from './pages/NoticiaDetalle'
import ResetPassword from './pages/ResetPassword'
import Contacto from './pages/Contacto'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

function AppRoutes() {
  const { noticiasEnabled } = useAppSettings()
  return (
    <Routes>
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/noticias"
        element={noticiasEnabled ? <Layout><Noticias /></Layout> : <Navigate to="/" replace />}
      />
      <Route
        path="/noticias/:id"
        element={noticiasEnabled ? <Layout><NoticiaDetalle /></Layout> : <Navigate to="/" replace />}
      />
      <Route path="/contacto" element={<Layout><Contacto /></Layout>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout><Admin /></Layout>
          </AdminRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppSettingsProvider>
            <AgeGateModal />
            <AppRoutes />
          </AppSettingsProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
