/**
 * App.jsx — Router principal de El Códice del Narrador.
 * Fase 4: AuthProvider + ruta /login pública + rutas protegidas.
 *
 * Estructura de rutas:
 *   /login          → Login.jsx (pública, redirige al dashboard si ya autenticado)
 *   /               → Dashboard.jsx  ┐
 *   /grimorio       → Grimorio.jsx   │ Todas protegidas por <RequireAuth>
 *   /forja          → Forja.jsx      │ Redirigen a /login si no hay sesión activa
 *   /narrador       → PantallaNarrador.jsx │
 *   /cronica/:id    → HubCronica.jsx       │
 *   /bitacora       → BitacoraSesion.jsx   ┘
 */

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout.jsx'

// Vistas
import Login            from './views/Login.jsx'
import Dashboard        from './views/Dashboard.jsx'
import Grimorio         from './views/Grimorio.jsx'
import Forja            from './views/Forja.jsx'
import PantallaNarrador from './views/PantallaNarrador.jsx'
import HubCronica       from './views/HubCronica.jsx'
import BitacoraSesion   from './views/BitacoraSesion.jsx'

// 404
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="font-playfair text-[32px] text-[#e5e2e1]">404</p>
      <p className="text-[#9ca3af] font-inter text-[14px]">
        Esta página no existe en el Códice.
      </p>
    </div>
  )
}

// ── Pantalla de carga (hidratación inicial de sesión) ────────────
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#121212' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#9b1a1a' }}
        />
        <p className="font-inter text-[13px]" style={{ color: '#444748' }}>
          Abriendo el Códice…
        </p>
      </div>
    </div>
  )
}

// ── Guard: rutas protegidas ───────────────────────────────────────
function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading)   return <LoadingScreen />
  if (!session)  return <Navigate to="/login" replace />
  return <Outlet />
}

// ── Guard: ruta pública (login) ───────────────────────────────────
function PublicOnly() {
  const { session, loading } = useAuth()
  if (loading)  return <LoadingScreen />
  if (session)  return <Navigate to="/" replace />
  return <Outlet />
}

// ── Router ────────────────────────────────────────────────────────
function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route index                element={<Dashboard />} />
            <Route path="/grimorio"     element={<Grimorio />} />
            <Route path="/forja"        element={<Forja />} />
            <Route path="/narrador"     element={<PantallaNarrador />} />
            <Route path="/cronica/:id"  element={<HubCronica />} />
            <Route path="/bitacora"     element={<BitacoraSesion />} />
            <Route path="*"             element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// ── App: AuthProvider envuelve todo ──────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
