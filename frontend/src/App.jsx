/**
 * App.jsx — Router principal de El Códice del Narrador
 *
 * Las 6 vistas principales se añaden en Fase 2 (Líder Frontend).
 * Por ahora expone un placeholder que confirma que el stack funciona.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Placeholder hasta Fase 2
function ComingSoon({ name }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        color: '#a09890',
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.5rem',
          color: '#e8e6e1',
          letterSpacing: '0.05em',
        }}
      >
        El Códice del Narrador
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
        {name} — Próximamente
      </p>
      <div
        style={{
          width: '240px',
          height: '1px',
          background: 'rgba(232, 230, 225, 0.08)',
        }}
      />
      <p style={{ fontSize: '0.75rem', color: '#6b6560' }}>
        Mundo de Tinieblas · V20 · W20 · M20
      </p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Fase 2: reemplazar placeholders con los componentes de página reales */}
        <Route path="/"           element={<ComingSoon name="Tablero Principal" />} />
        <Route path="/grimorio"   element={<ComingSoon name="El Grimorio" />} />
        <Route path="/forja"      element={<ComingSoon name="La Forja" />} />
        <Route path="/narrador"   element={<ComingSoon name="Pantalla del Narrador" />} />
        <Route path="/cronica/:id" element={<ComingSoon name="Hub de la Crónica" />} />
        <Route path="/bitacora"   element={<ComingSoon name="Bitácora de Sesión" />} />
        <Route path="*"           element={<ComingSoon name="404 — Página no encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}
