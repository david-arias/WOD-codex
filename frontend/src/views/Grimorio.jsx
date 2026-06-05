/**
 * Grimorio.jsx — Enciclopedia/Diccionario A-Z de El Códice del Narrador.
 * Fase 5.5: Pantalla completa tipo enciclopedia con Oráculo AI flotante.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, authFetch } from '../context/AuthContext'
import OracleChat from '../components/ui/OracleChat.jsx'

// ── Mapeo categoría DB → label en pantalla ────────────────────
const CATEGORY_LABELS = {
  discipline: 'Disciplinas', clan: 'Clanes', sect: 'Sectas',
  ritual: 'Rituales', virtue: 'Virtudes', path: 'Caminos',
  background: 'Trasfondos', gift: 'Dones', tribe: 'Tribus',
  rite: 'Ritos', rank: 'Rangos', sphere: 'Esferas',
  tradition: 'Tradiciones', paradigm: 'Paradigmas', merit: 'Méritos',
  flaw: 'Defectos', other: 'Otros',
}

// ── Slugify (fallback si la API no devuelve slug) ─────────────
function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Mapeo categorías (filtro) por juego ───────────────────────
const CATEGORY_FILTERS = {
  V20: { Todas: null, Disciplinas:'discipline', Clanes:'clan', Sectas:'sect', Trasfondos:'background', Virtudes:'virtue', Caminos:'path', Rituales:'ritual' },
  W20: { Todas: null, Dones:'gift', Tribus:'tribe', Rangos:'rank', Ritos:'rite', Galliardos:'other', Tótems:'other', Objetos:'other' },
  M20: { Todas: null, Esferas:'sphere', Tradiciones:'tradition', Paradigmas:'paradigm', Paradoja:'other', Quintaesencia:'other', Legajos:'other', Talismanes:'other' },
}

const GAME_THEME = {
  V20: { label:'Vampiro V20', short:'V20', accent:'#c62828', accentDim:'#8b1a1a', accentText:'#f87171', glow:'rgba(139,26,26,0.18)', border:'rgba(198,40,40,0.35)', tag:'Vampiro' },
  W20: { label:'Hombre Lobo W20', short:'W20', accent:'#d97706', accentDim:'#92400e', accentText:'#fbbf24', glow:'rgba(146,64,14,0.18)', border:'rgba(217,119,6,0.35)', tag:'Hombre Lobo' },
  M20: { label:'Mago M20', short:'M20', accent:'#7c3aed', accentDim:'#4c1d95', accentText:'#a78bfa', glow:'rgba(76,29,149,0.18)', border:'rgba(124,58,237,0.35)', tag:'Mago' },
}

const CATEGORIES = {
  V20: ['Todas','Disciplinas','Clanes','Sectas','Trasfondos','Virtudes','Caminos','Rituales'],
  W20: ['Todas','Dones','Tribus','Rangos','Ritos','Galliardos','Tótems','Objetos'],
  M20: ['Todas','Esferas','Tradiciones','Paradigmas','Paradoja','Quintaesencia','Legajos','Talismanes'],
}

const GLOSARIO = {
  V20: [
    { id:'v-animalismo', name:'Animalismo', category:'Disciplinas', level:'Nv 1-5', description:'Permite al vampiro comunicarse y controlar animales. A niveles altos, puede suprimir la Bestia en otros.' },
    { id:'v-auspex', name:'Auspex', category:'Disciplinas', level:'Nv 1-5', description:'Agudiza los sentidos sobrenaturales y abre la mente a percepciones extrasensoriales, telepatía y viaje astral.' },
    { id:'v-brujah', name:'Brujah', category:'Clanes', level:null, description:'Clan de rebeldes idealistas. Antaño guardianes de Cartago, hoy rabiosamente apasionados del Sabbat y la Camarilla.' },
    { id:'v-camarilla', name:'Camarilla', category:'Sectas', level:null, description:'La más poderosa de las sectas vampíricas. Defiende la Mascarada y los Seis Principios de la noche.' },
    { id:'v-celeridad', name:'Celeridad', category:'Disciplinas', level:'Nv 1-5', description:'Otorga velocidad sobrehumana. Cada punto permite acciones adicionales por turno sin penalización.' },
    { id:'v-camino', name:'Camino de la Humanidad', category:'Caminos', level:'Ética 1-10', description:'El estándar moral más común entre los vampiros recientes. Mide cuánto del ser humano original permanece.' },
    { id:'v-dominacion', name:'Dominación', category:'Disciplinas', level:'Nv 1-5', description:'Control mental directo. Requiere contacto visual. Los efectos van desde órdenes simples hasta borrar memorias.' },
    { id:'v-fortitud', name:'Fortaleza', category:'Disciplinas', level:'Nv 1-5', description:'Resistencia sobrenatural al daño físico, incluyendo fuego, luz solar y armas normales.' },
    { id:'v-gangrel', name:'Gangrel', category:'Clanes', level:null, description:'Vagabundos solitarios con afinidad animal. Pueden manifestar rasgos bestiales sin control al perder humanidad.' },
    { id:'v-mascarada', name:'Mascarada', category:'Sectas', level:null, description:'La gran mentira: el ocultamiento de la existencia vampírica ante la humanidad. Primer Principio de la Camarilla.' },
    { id:'v-nosferatu', name:'Nosferatu', category:'Clanes', level:null, description:'Monstruosos en apariencia, maestros de los secretos. Viven en las alcantarillas y venden información.' },
    { id:'v-ofuscacion', name:'Ofuscación', category:'Disciplinas', level:'Nv 1-5', description:'Invisibilidad mental. No distorsiona la luz, sino la mente de los observadores para que ignoren al vampiro.' },
    { id:'v-potencia', name:'Potencia', category:'Disciplinas', level:'Nv 1-5', description:'Fuerza sobrehumana. Cada punto añade dados a Fuerza y permite feats imposibles para los mortales.' },
    { id:'v-presencia', name:'Presencia', category:'Disciplinas', level:'Nv 1-5', description:'Carisma sobrenatural. Inspira amor, terror o devoción ciega en quienes la sufren.' },
    { id:'v-quietus', name:'Quietus', category:'Disciplinas', level:'Nv 1-5', description:'Disciplina exclusiva de los Assamitas. Manipula sangre con efectos letales desde venenos hasta detener el corazón.' },
    { id:'v-sabbat', name:'Sabbat', category:'Sectas', level:null, description:'Secta que rechaza la humanidad. Sus miembros buscan liberar al Antediluvio y destruir a los Ancianos.' },
    { id:'v-toreador', name:'Toreador', category:'Clanes', level:null, description:'Amantes del arte y la belleza. Se quedan paralizados ante la perfección estética, lo cual puede ser fatal.' },
    { id:'v-tremere', name:'Tremere', category:'Clanes', level:null, description:'Clan de magos que robaron la inmortalidad. Siguen usando su Taumaturgia de sangre con fines oscuros.' },
    { id:'v-ventrue', name:'Ventrue', category:'Clanes', level:null, description:'El clan de los reyes. Líderes natos con restricciones dietéticas: solo pueden beber de ciertos humanos.' },
  ],
  W20: [
    { id:'w-ahroun', name:'Ahroun', category:'Galliardos', level:'Aspecto', description:'Guerreros de Gaia. La luna llena marca a los nacidos bajo ella como combatientes feroces y líderes de batalla.' },
    { id:'w-crinos', name:'Crinos', category:'Rangos', level:'Forma', description:'La forma híbrida de lobo-hombre. Dos metros y medio de músculo y furia. Induce el Delerio en humanos.' },
    { id:'w-delirio', name:'Delerio', category:'Dones', level:'Efecto', description:'El terror primigenio que los humanos sienten al ver la forma Crinos. Un reflejo evolutivo de la presa ante el depredador.' },
    { id:'w-gnosis', name:'Gnosis', category:'Quintaesencia', level:'Stat 1-10', description:'Conexión espiritual con Gaia. Se usa para activar Dones y atravesar el Umbral hacia el Umbra.' },
    { id:'w-get-fenris', name:'Get of Fenris', category:'Tribus', level:null, description:'Guerreros del norte, honran la batalla sobre todo. Su código de honor es severo y no toleran la debilidad.' },
    { id:'w-kaos', name:'Kaos', category:'Paradoja', level:'Fuerza', description:'La entropía primordial que amenaza la creación. Los Fomori y el Wyrm son sus herramientas en el mundo físico.' },
    { id:'w-luna', name:'Luna', category:'Tótems', level:'Patrona', description:'La diosa lunar que marca a los Garou. Su fase en el nacimiento determina el Aspecto del hombre lobo.' },
    { id:'w-ragabash', name:'Ragabash', category:'Galliardos', level:'Aspecto', description:'Los bribones de luna nueva. Maestros del engaño y la infiltración. Cuestionan las reglas para fortalecerlas.' },
    { id:'w-rabia', name:'Rabia', category:'Rangos', level:'Stat 1-10', description:'La furia sagrada de Gaia. Permite acciones adicionales y potencia los Dones, pero amenaza el control.' },
    { id:'w-silver-fangs', name:'Silver Fangs', category:'Tribus', level:null, description:'La tribu noble, considerada la realeza Garou. Su linaje puro los ha llevado a la locura generacional.' },
    { id:'w-theurge', name:'Theurge', category:'Galliardos', level:'Aspecto', description:'Chamanes de luna creciente. Intermediarios entre el mundo físico y el Umbra. Hablan con los espíritus.' },
    { id:'w-totem', name:'Tótem', category:'Tótems', level:'Espíritu', description:'Espíritu patrón de una manada o tribu. Otorga Dones a cambio de devoción y tabúes que respetar.' },
    { id:'w-umbra', name:'Umbra', category:'Rangos', level:'Plano', description:'El mundo espiritual paralelo a la realidad física. Los Garou atraviesan el Umbral con Gnosis para navegarlo.' },
    { id:'w-wyrm', name:'Wyrm', category:'Paradoja', level:'Fuerza', description:'La fuerza de corrupción y destrucción. Adversario primordial de Gaia. Sus siervos son los Fomori y el Pentex.' },
  ],
  M20: [
    { id:'m-akashic', name:'Hermanos Akáshicos', category:'Tradiciones', level:null, description:'Maestros del Do, arte marcial que es también filosofía y magia. Creen que la mente supera a la materia.' },
    { id:'m-arete', name:'Areté', category:'Paradoja', level:'Stat 1-10', description:'Habilidad mágica fundamental del Mago. Limita el rango de Esferas accesibles y la potencia de los efectos.' },
    { id:'m-correspondencia', name:'Correspondencia', category:'Esferas', level:'Esfera 1-5', description:'Conexión y espacio. Permite teleportación, percepción a distancia y vincular lugares separados físicamente.' },
    { id:'m-coincidente', name:'Efecto Coincidente', category:'Paradoja', level:'Regla', description:'Magia que puede explicarse racionalmente. No genera Paradoja si tiene éxito porque los Durmientes no la detectan.' },
    { id:'m-entropia', name:'Entropía', category:'Esferas', level:'Esfera 1-5', description:'Descomposición, suerte y destino. Desde arreglar máquinas hasta invocar el caos en sistemas complejos.' },
    { id:'m-fuerzas', name:'Fuerzas', category:'Esferas', level:'Esfera 1-5', description:'Control de energías físicas: calor, electricidad, gravedad, luz. La esfera más visualmente espectacular.' },
    { id:'m-euthanatos', name:'Euthanatos', category:'Tradiciones', level:null, description:'Maestros de la muerte y el karma. Su magia sirve para guiar a las almas y mantener el ciclo de la vida.' },
    { id:'m-materia', name:'Materia', category:'Esferas', level:'Esfera 1-5', description:'Manipulación de sustancias inorgánicas. Transmutar plomo en oro, moldear piedra o crear objetos de la nada.' },
    { id:'m-mente', name:'Mente', category:'Esferas', level:'Esfera 1-5', description:'El reino de la consciencia. Telepatía, ilusiones, control mental y exploración de los estados de conciencia.' },
    { id:'m-paradoja', name:'Paradoja', category:'Paradoja', level:'Mecánica', description:'El contragolpe de la Consensualidad cuando la magia es vulgar. Se acumula hasta un estallido destructivo.' },
    { id:'m-paradigma', name:'Paradigma', category:'Paradigmas', level:'Concepto', description:'El marco conceptual del Mago para entender la magia. Define su estética, vocabulario y limitaciones.' },
    { id:'m-primer-plano', name:'Primer Plano', category:'Esferas', level:'Esfera 1-5', description:'La esfera del Yo y la quintaesencia. Permite ver el Hilo de Plata, manipular el alma y la magia pura.' },
    { id:'m-quintaesencia', name:'Quintaesencia', category:'Quintaesencia', level:'Recurso', description:'Energía mágica pura del Tapiz. Combustible para la magia y signo del equilibrio espiritual del Mago.' },
    { id:'m-sons-ether', name:'Sons of Ether', category:'Tradiciones', level:null, description:'Científicos locos que operan en una física alternativa victoriana. La tecnología imposible como magia.' },
    { id:'m-tiempo', name:'Tiempo', category:'Esferas', level:'Esfera 1-5', description:'Percibir y manipular el flujo temporal. Desde ver el futuro hasta bucles temporales y viaje en el tiempo.' },
    { id:'m-verbal', name:'Efecto Vulgar', category:'Paradoja', level:'Regla', description:'Magia que viola las leyes naturales de forma obvia. Genera Paradoja inmediata, más si hay testigos Durmientes.' },
    { id:'m-vida', name:'Vida', category:'Esferas', level:'Esfera 1-5', description:'Control de organismos vivos. Curación, transformación, control de plantas y animales, evolución acelerada.' },
    { id:'m-virtual-adepts', name:'Virtual Adepts', category:'Tradiciones', level:null, description:'Hackers ciberpunk que ven el mundo como código. Su magia es programación directa de la realidad.' },
  ],
}

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const IconClear = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <line x1="2" y1="2" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11" y1="2" x2="2" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

function groupByLetter(entries) {
  const groups = {}
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  for (const entry of sorted) {
    const letter = entry.name[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(entry)
  }
  return groups
}

function EntryCard({ entry, theme, gameLine }) {
  const entrySlug    = entry.slug || slugify(entry.name)
  const categoryLabel = CATEGORY_LABELS[entry.category] ?? entry.category
  const levelLabel   = entry.level ? (typeof entry.level === 'number' ? `Nv ${entry.level}` : entry.level) : null

  return (
    <Link
      to={`/grimorio/${gameLine.toLowerCase()}/${entrySlug}`}
      className="flex items-center gap-3 w-full rounded-lg transition-all duration-150 group"
      style={{
        display: 'flex',
        textDecoration: 'none',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '11px 14px',
        marginBottom: '2px',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = theme.border
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
      }}
    >
      <span className="font-playfair text-[15px] font-semibold leading-tight transition-colors"
        style={{ color: '#e5e2e1' }}
        onMouseEnter={e => e.target.style.color = theme.accentText}
        onMouseLeave={e => e.target.style.color = '#e5e2e1'}>
        {entry.name}
      </span>
      {levelLabel && (
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
          style={{ color: theme.accentText, backgroundColor: `${theme.accentDim}40`, border: `1px solid ${theme.accentDim}60` }}>
          {levelLabel}
        </span>
      )}
      <span className="ml-auto font-inter text-[11px] shrink-0" style={{ color: '#444748' }}>
        {categoryLabel}
      </span>
      {/* Flecha indicadora */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.accentText }}>
        <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  )
}

export default function Grimorio() {
  const [selectedGame, setSelectedGame]         = useState('V20')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [searchQuery, setSearchQuery]           = useState('')
  const [apiEntries, setApiEntries]             = useState(null)   // null = no cargado aún
  const [loadingApi, setLoadingApi]             = useState(false)
  const searchRef = useRef(null)
  const { token } = useAuth()
  const theme = GAME_THEME[selectedGame]

  // ── Fetch desde API (con fallback a mock si está vacío) ───────
  const fetchGlossary = useCallback(async (game) => {
    if (!token) return
    setLoadingApi(true)
    try {
      const res = await authFetch(token, `/api/v1/gamerules/glossary/${game}`)
      if (res.ok) {
        const data = await res.json()
        setApiEntries(data.length > 0 ? data : null)  // null → usar mock
      }
    } catch {
      setApiEntries(null)
    } finally {
      setLoadingApi(false)
    }
  }, [token])

  useEffect(() => { fetchGlossary(selectedGame) }, [selectedGame, fetchGlossary])

  const handleGameChange = (game) => {
    setSelectedGame(game)
    setSelectedCategory('Todas')
    setSearchQuery('')
    setApiEntries(null)
  }

  // Usar datos de API si existen, si no usar mock
  const baseEntries = useMemo(() => {
    if (apiEntries) return apiEntries
    // Mock: adaptar al mismo formato que la API
    return (GLOSARIO[selectedGame] ?? []).map(e => ({
      ...e,
      game_line: selectedGame,
      level: e.level ? parseInt(e.level) || e.level : null,
    }))
  }, [apiEntries, selectedGame])

  // ── Filtros del catálogo de categorías ───────────────────────
  const categoryFilter = CATEGORY_FILTERS[selectedGame] ?? {}

  const filteredEntries = useMemo(() => {
    let entries = [...baseEntries]
    // Filtro por categoría
    const catValue = categoryFilter[selectedCategory]
    if (selectedCategory !== 'Todas' && catValue) {
      entries = entries.filter(e => e.category === catValue)
    }
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      entries = entries.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      )
    }
    return entries
  }, [baseEntries, selectedCategory, categoryFilter, searchQuery])

  const grouped = useMemo(() => groupByLetter(filteredEntries), [filteredEntries])
  const letters  = Object.keys(grouped).sort()

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ position: 'relative' }}>

      {/* Header: tabs + búsqueda + categorías */}
      <div className="shrink-0 px-6 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${theme.border}`, background: `linear-gradient(180deg, ${theme.glow} 0%, transparent 100%)`, transition: 'all 0.3s' }}>

        {/* Tabs de juego + buscador */}
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(GAME_THEME).map(([key, t]) => {
            const active = selectedGame === key
            return (
              <button key={key} onClick={() => handleGameChange(key)}
                className="rounded-md font-inter font-medium transition-all duration-200"
                style={{
                  padding: '7px 18px', fontSize: '13px', letterSpacing: '0.04em',
                  backgroundColor: active ? t.accentDim : 'transparent',
                  color: active ? t.accentText : '#6b7280',
                  border: `1px solid ${active ? t.border : 'transparent'}`,
                  boxShadow: active ? `0 0 12px ${t.glow}` : 'none',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#c4c7c8' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#6b7280' }}
              >
                {t.short} · {t.tag}
              </button>
            )
          })}

          {/* Buscador */}
          <div className="flex-1 ml-2 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b7280' }}>
              <IconSearch />
            </div>
            <input ref={searchRef} type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Buscar en el Grimorio ${selectedGame}…`}
              className="w-full font-inter text-[14px] outline-none rounded-md transition-all duration-150"
              style={{
                backgroundColor: '#121212',
                border: `1px solid ${searchQuery ? theme.border : 'rgba(255,255,255,0.07)'}`,
                color: '#e5e2e1', padding: '8px 36px',
                boxShadow: searchQuery ? `0 0 0 3px ${theme.glow}` : 'none',
              }}
              onFocus={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = `0 0 0 3px ${theme.glow}` }}
              onBlur={e => { if (!searchQuery) { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' } }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#6b7280' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c4c7c8'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                <IconClear />
              </button>
            )}
          </div>
        </div>

        {/* Categorías */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES[selectedGame].map(cat => {
            const active = selectedCategory === cat
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="rounded font-inter text-[11px] font-medium transition-all duration-150"
                style={{
                  padding: '4px 12px', letterSpacing: '0.03em',
                  backgroundColor: active ? `${theme.accentDim}60` : 'rgba(255,255,255,0.04)',
                  color: active ? theme.accentText : '#6b7280',
                  border: `1px solid ${active ? theme.border : 'rgba(255,255,255,0.06)'}`,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color='#c4c7c8'; e.currentTarget.style.backgroundColor='rgba(255,255,255,0.07)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)' } }}
              >
                {cat}
              </button>
            )
          })}
          <span className="ml-auto font-mono text-[11px]" style={{ color: '#444748' }}>
            {filteredEntries.length} entrada{filteredEntries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Glosario A-Z */}
      <div className="flex-1 overflow-y-auto scrollable px-6 py-4">
        {letters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="font-playfair text-[18px]" style={{ color: '#444748' }}>Sin entradas en el Grimorio.</p>
            <p className="font-inter text-[13px] italic" style={{ color: '#2a2a2a' }}>
              {searchQuery ? `No se encontró "${searchQuery}"` : 'Selecciona una categoría o escribe en el buscador.'}
            </p>
          </div>
        )}

        {letters.map(letter => (
          <div key={letter} className="mb-6">
            <div className="flex items-center gap-3 mb-2 sticky top-0 py-1"
              style={{ backgroundColor: '#141313', zIndex: 1 }}>
              <span className="font-playfair text-[22px] font-semibold w-8 shrink-0" style={{ color: theme.accent }}>
                {letter}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
            </div>
            <div className="pl-11">
              {grouped[letter].map(entry => (
                <EntryCard key={entry.id || entry.name} entry={entry} theme={theme} gameLine={selectedGame} />
              ))}
            </div>
          </div>
        ))}

        <div style={{ height: '80px' }} />
      </div>

      {/* Oráculo flotante */}
      <OracleChat theme={theme} />
    </div>
  )
}
