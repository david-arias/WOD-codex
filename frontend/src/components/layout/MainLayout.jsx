import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

/**
 * MainLayout — envuelve todas las vistas protegidas.
 * Sidebar fijo a la izquierda + área de contenido scrollable a la derecha.
 * Usa React Router <Outlet /> para renderizar la vista activa.
 */
export default function MainLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#141313]">
      {/* Sidebar — fijo, no scrollea */}
      <Sidebar />

      {/* Área de contenido principal — scrollable */}
      <main
        className="flex-1 min-w-0 h-full overflow-y-auto scrollable"
        style={{ background: '#141313' }}
      >
        <Outlet />
      </main>
    </div>
  )
}
