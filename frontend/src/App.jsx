/**
 * App.jsx — Router principal de El Códice del Narrador.
 * Fase 3: MainLayout con React Router Outlet + 6 vistas reales.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout.jsx'

// Las 6 vistas principales
import Dashboard       from './views/Dashboard.jsx'
import Grimorio        from './views/Grimorio.jsx'
import Forja           from './views/Forja.jsx'
import PantallaNarrador from './views/PantallaNarrador.jsx'
import HubCronica      from './views/HubCronica.jsx'
import BitacoraSesion  from './views/BitacoraSesion.jsx'

// 404 simple
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Todas las rutas comparten el MainLayout (sidebar + contenido) */}
        <Route element={<MainLayout />}>
          <Route index              element={<Dashboard />} />
          <Route path="/grimorio"   element={<Grimorio />} />
          <Route path="/forja"      element={<Forja />} />
          <Route path="/narrador"   element={<PantallaNarrador />} />
          <Route path="/cronica/:id" element={<HubCronica />} />
          <Route path="/bitacora"   element={<BitacoraSesion />} />
          <Route path="*"           element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
