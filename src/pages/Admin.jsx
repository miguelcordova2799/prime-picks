import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Stars from '../components/Stars'
import { Plus, CheckCircle, XCircle, Clock, ChevronDown, Newspaper, Trash2, Upload, X, BarChart2, RefreshCw } from 'lucide-react'
import { formatOdds, americanToDecimal } from '../lib/odds'

const EMPTY_PICK = {
  match_name: '', pick_text: '', odds: '', bookmaker: '', stake_percent: 2,
  stars: 3, analysis: '', scheduled_at: '',
}

const EMPTY_NEWS = {
  title: '', summary: '', content: '', image_url: '',
  category: 'General', scheduled_at: '',
}

const NEWS_CATEGORIES = ['General', 'México', 'Resultados', 'Análisis', 'Selecciones', 'Fixtures']

export default function Admin() {
  const [tab, setTab] = useState('picks')

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Panel de Admin</h1>
          <p className="text-white/40 text-sm mt-1">Gestiona picks y noticias</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#111111] border border-white/8 rounded-xl w-fit mb-8">
          <TabBtn active={tab === 'picks'} onClick={() => setTab('picks')} icon={Plus} label="Picks" />
          <TabBtn active={tab === 'noticias'} onClick={() => setTab('noticias')} icon={Newspaper} label="Noticias" />
          <TabBtn active={tab === 'lineas'} onClick={() => setTab('lineas')} icon={BarChart2} label="Líneas" />
        </div>

        {tab === 'picks' && <PicksAdmin />}
        {tab === 'noticias' && <NoticiasAdmin />}
        {tab === 'lineas' && <LineasAdmin />}
      </div>

      <style>{`
        .input-style {
          width: 100%;
          padding: 10px 14px;
          background: #0A0A0A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-style::placeholder { color: rgba(255,255,255,0.2); }
        .input-style:focus { border-color: rgba(0,217,100,0.45); }
        select.input-style option { background: #111; }
      `}</style>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

/* ── PICKS ADMIN ───────────────────────────────────────────── */
function PicksAdmin() {
  const [form, setForm] = useState(EMPTY_PICK)
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { fetchPicks() }, [])

  async function fetchPicks() {
    setLoading(true)
    const { data } = await supabase.from('picks').select('*').order('published_at', { ascending: false })
    setPicks(data || [])
    setLoading(false)
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handlePublish(e) {
    e.preventDefault()
    setSubmitting(true)
    const decimalOdds = americanToDecimal(form.odds) ?? parseFloat(form.odds)
    const { error } = await supabase.from('picks').insert({
      match_name: form.match_name,
      pick_text: form.pick_text,
      odds: decimalOdds,
      bookmaker: form.bookmaker,
      stake_percent: parseFloat(form.stake_percent) || 2,
      stars: parseInt(form.stars),
      analysis: form.analysis,
      result: 'pending',
      published_at: form.scheduled_at || new Date().toISOString(),
    })
    setSubmitting(false)
    if (error) showToast('Error: ' + error.message)
    else { showToast('Pick publicado ✓'); setForm(EMPTY_PICK); fetchPicks() }
  }

  async function setResult(id, result) {
    await supabase.from('picks').update({ result }).eq('id', id)
    setPicks(ps => ps.map(p => p.id === id ? { ...p, result } : p))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-[#00D964] text-black text-sm font-semibold rounded-lg shadow-xl">
          {toast}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Plus size={18} className="text-[#00D964]" /> Nuevo pick
          </h2>
          <form onSubmit={handlePublish} className="space-y-4 bg-[#111111] border border-white/8 rounded-2xl p-5">
            <Field label="Partido *">
              <input value={form.match_name} onChange={e => field('match_name', e.target.value)} required placeholder="Real Madrid vs Barcelona" className="input-style" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pick *">
                <input value={form.pick_text} onChange={e => field('pick_text', e.target.value)} required placeholder="Ambos anotan" className="input-style" />
              </Field>
              <Field label="Cuota * (americano)">
                <input type="text" value={form.odds} onChange={e => field('odds', e.target.value)} required placeholder="+110 o -110" className="input-style" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Casa de apuestas">
                <input value={form.bookmaker} onChange={e => field('bookmaker', e.target.value)} placeholder="Bet365" className="input-style" />
              </Field>
              <Field label="Stake % del bank">
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <button key={n} type="button" onClick={() => field('stake_percent', n)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                        form.stake_percent === n
                          ? 'bg-[#00D964]/20 border-[#00D964]/60 text-[#00D964]'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >{n}%</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Confianza (estrellas)">
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n} type="button" onClick={() => field('stars', n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.stars === n
                        ? 'bg-[#EF9F27]/20 border-[#EF9F27]/60 text-[#EF9F27]'
                        : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >{'★'.repeat(n)}</button>
                ))}
              </div>
            </Field>
            <Field label="Análisis">
              <textarea value={form.analysis} onChange={e => field('analysis', e.target.value)} rows={4} placeholder="Razonamiento detrás del pick..." className="input-style resize-none" />
            </Field>
            <Field label="Fecha/hora programada (opcional)">
              <input type="datetime-local" value={form.scheduled_at} onChange={e => field('scheduled_at', e.target.value)} className="input-style" />
            </Field>
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 text-sm">
              {submitting ? 'Publicando...' : 'Publicar pick'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-base font-bold mb-4">
            Publicados <span className="text-white/30 font-normal">({picks.length})</span>
          </h2>
          {loading
            ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" /></div>
            : picks.length === 0
              ? <div className="text-center py-12 text-white/30 text-sm">Sin picks aún</div>
              : <div className="space-y-3">{picks.map(p => <AdminPickCard key={p.id} pick={p} onResult={setResult} />)}</div>
          }
        </div>
      </div>
    </>
  )
}

function AdminPickCard({ pick, onResult }) {
  const [open, setOpen] = useState(false)
  const date = new Date(pick.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const resultStyles = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    won: 'bg-[#00D964]/12 text-[#00D964]',
    lost: 'bg-red-500/15 text-red-400',
  }
  const resultLabels = { pending: 'Pendiente', won: 'Ganado', lost: 'Perdido' }

  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="min-w-0">
          <div className="text-xs text-white/35 mb-0.5">{date}</div>
          <div className="text-sm font-semibold text-white truncate">{pick.match_name}</div>
          <div className="text-xs text-white/50 mt-0.5">{pick.pick_text} · {formatOdds(pick.odds)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars count={pick.stars} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${resultStyles[pick.result] || resultStyles.pending}`}>
            {resultLabels[pick.result] || 'Pendiente'}
          </span>
          <ChevronDown size={15} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="border-t border-white/8 p-4">
          {pick.analysis && <p className="text-xs text-white/50 mb-4 leading-relaxed">{pick.analysis}</p>}
          <div className="flex gap-2">
            {[
              { r: 'won', label: 'Ganado', Icon: CheckCircle, active: 'bg-[#00D964]/15 text-[#00D964] border-[#00D964]/30', hover: 'hover:border-[#00D964]/30 hover:text-[#00D964]' },
              { r: 'pending', label: 'Pendiente', Icon: Clock, active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', hover: 'hover:border-yellow-500/30 hover:text-yellow-400' },
              { r: 'lost', label: 'Perdido', Icon: XCircle, active: 'bg-red-500/20 text-red-400 border-red-500/30', hover: 'hover:border-red-500/30 hover:text-red-400' },
            ].map(({ r, label, Icon, active, hover }) => (
              <button key={r} onClick={() => onResult(pick.id, r)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                  pick.result === r ? active : `border-white/10 text-white/40 ${hover}`
                }`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── NOTICIAS ADMIN ────────────────────────────────────────── */
function NoticiasAdmin() {
  const [form, setForm] = useState(EMPTY_NEWS)
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [imageMode, setImageMode] = useState('file')
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => { fetchNews() }, [])

  async function fetchNews() {
    setLoading(true)
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    setNews(data || [])
    setLoading(false)
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => field('image_url', ev.target.result)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    field('image_url', '')
    setFileInputKey(k => k + 1)
  }

  function switchMode(mode) {
    setImageMode(mode)
    clearImage()
  }

  async function handlePublish(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('news').insert({
      title: form.title,
      summary: form.summary,
      content: form.content,
      image_url: form.image_url || null,
      category: form.category,
      published_at: form.scheduled_at || new Date().toISOString(),
    })
    setSubmitting(false)
    if (error) showToast('Error: ' + error.message)
    else {
      showToast('Noticia publicada ✓')
      setForm(EMPTY_NEWS)
      setFileInputKey(k => k + 1)
      fetchNews()
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta noticia?')) return
    await supabase.from('news').delete().eq('id', id)
    setNews(ns => ns.filter(n => n.id !== id))
    showToast('Noticia eliminada')
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-[#00D964] text-black text-sm font-semibold rounded-lg shadow-xl">
          {toast}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Newspaper size={18} className="text-[#00D964]" /> Nueva noticia
          </h2>
          <form onSubmit={handlePublish} className="space-y-4 bg-[#111111] border border-white/8 rounded-2xl p-5">
            <Field label="Título *">
              <input value={form.title} onChange={e => field('title', e.target.value)} required placeholder="México sorprende al campeón del mundo" className="input-style" />
            </Field>
            <Field label="Resumen">
              <textarea value={form.summary} onChange={e => field('summary', e.target.value)} rows={2} placeholder="Una o dos frases para el preview de la tarjeta..." className="input-style resize-none" />
            </Field>
            <Field label="Contenido completo *">
              <textarea value={form.content} onChange={e => field('content', e.target.value)} required rows={6} placeholder="Escribe el artículo completo aquí. Separa párrafos con doble salto de línea." className="input-style resize-none" />
            </Field>
            <Field label="Categoría">
              <select value={form.category} onChange={e => field('category', e.target.value)} className="input-style">
                {NEWS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>

            {/* ── IMAGE FIELD ── */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Imagen (opcional)</label>
              {/* Mode toggle */}
              <div className="flex gap-0.5 p-0.5 bg-[#0A0A0A] border border-white/10 rounded-lg w-fit mb-2">
                <button type="button" onClick={() => switchMode('file')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    imageMode === 'file' ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
                  }`}>
                  <Upload size={11} /> Subir archivo
                </button>
                <button type="button" onClick={() => switchMode('url')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    imageMode === 'url' ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
                  }`}>
                  URL externa
                </button>
              </div>

              {imageMode === 'file' ? (
                <label className="block cursor-pointer">
                  <div className="input-style flex items-center gap-2 text-white/30 hover:border-[#00D964]/45 transition-colors cursor-pointer">
                    <Upload size={14} className="shrink-0" />
                    <span>{form.image_url ? 'Cambiar imagen' : 'Seleccionar imagen desde el dispositivo...'}</span>
                  </div>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>
              ) : (
                <input
                  value={form.image_url}
                  onChange={e => field('image_url', e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="input-style"
                />
              )}

              {/* Preview */}
              {form.image_url && (
                <div className="mt-2 relative rounded-lg overflow-hidden h-32 bg-[#0A0A0A] border border-white/10">
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  {imageMode === 'file' && (
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 text-xs text-white/60">
                      Imagen local (base64)
                    </div>
                  )}
                </div>
              )}
            </div>

            <Field label="Fecha/hora programada (opcional)">
              <input type="datetime-local" value={form.scheduled_at} onChange={e => field('scheduled_at', e.target.value)} className="input-style" />
            </Field>
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 text-sm">
              {submitting ? 'Publicando...' : 'Publicar noticia'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-base font-bold mb-4">
            Publicadas <span className="text-white/30 font-normal">({news.length})</span>
          </h2>
          {loading
            ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" /></div>
            : news.length === 0
              ? <div className="text-center py-12 text-white/30 text-sm">Sin noticias publicadas</div>
              : <div className="space-y-3">{news.map(n => <AdminNewsCard key={n.id} noticia={n} onDelete={handleDelete} />)}</div>
          }
        </div>
      </div>
    </>
  )
}

function AdminNewsCard({ noticia, onDelete }) {
  const [open, setOpen] = useState(false)
  const date = new Date(noticia.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="min-w-0">
          <div className="text-xs text-white/35 mb-0.5">{date} · {noticia.category}</div>
          <div className="text-sm font-semibold text-white truncate">{noticia.title}</div>
          {noticia.summary && <div className="text-xs text-white/40 mt-0.5 truncate">{noticia.summary}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <ChevronDown size={15} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="border-t border-white/8 p-4">
          {noticia.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden h-32">
              <img src={noticia.image_url} alt={noticia.title} className="w-full h-full object-cover" />
            </div>
          )}
          {noticia.content && (
            <p className="text-xs text-white/40 mb-4 leading-relaxed line-clamp-4">{noticia.content}</p>
          )}
          <button
            onClick={() => onDelete(noticia.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> Eliminar noticia
          </button>
        </div>
      )}
    </div>
  )
}

/* ── LÍNEAS ADMIN ────────────────────────────────────────────── */
const ODDS_URL =
  'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/' +
  '?apiKey=5f4cad443d8840f12b684f72529e46f0' +
  '&regions=eu,uk&markets=h2h&oddsFormat=american&bookmakers=bet365,pinnacle'

function fmtPrice(price) {
  if (price == null) return '—'
  return price > 0 ? `+${price}` : `${price}`
}

function fmtGameTime(iso) {
  const d = new Date(iso)
  const tz = 'America/Mexico_City'
  const day = d.toLocaleDateString('es-MX', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day} · ${time}`
}

function getOutcome(bookmaker, gameName, type, homeTeam, awayTeam) {
  if (!bookmaker) return null
  const market = bookmaker.markets?.find(m => m.key === 'h2h')
  if (!market) return null
  if (type === 'home') return market.outcomes?.find(o => o.name === homeTeam)?.price ?? null
  if (type === 'away') return market.outcomes?.find(o => o.name === awayTeam)?.price ?? null
  if (type === 'draw') return market.outcomes?.find(o => o.name === 'Draw')?.price ?? null
  return null
}

function LineasAdmin() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remaining, setRemaining] = useState(null)

  useEffect(() => { fetchOdds() }, [])

  async function fetchOdds() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(ODDS_URL)
      const rem = res.headers.get('x-requests-remaining')
      if (rem !== null) setRemaining(rem)

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)

      // Show games starting within the next 48 h
      const now = new Date()
      const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      const filtered = Array.isArray(data)
        ? data.filter(g => {
            const t = new Date(g.commence_time)
            return t >= now && t <= cutoff
          })
        : []

      setGames(filtered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Líneas en tiempo real</h2>
          <p className="text-white/40 text-xs mt-0.5">
            Hoy y mañana · Bet365 vs Pinnacle · Mundial 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          {remaining !== null && (
            <span className="text-xs text-white/30 bg-[#111111] border border-white/8 px-3 py-1.5 rounded-lg">
              {remaining} requests restantes
            </span>
          )}
          <button
            onClick={fetchOdds}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#111111] border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar líneas
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-white/30 text-sm gap-2">
          <RefreshCw size={16} className="animate-spin" /> Cargando líneas...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-red-400 text-sm">
          Error al obtener líneas: {error}
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="rounded-xl bg-[#111111] border border-white/8 p-12 text-center text-white/30 text-sm">
          No hay partidos disponibles en este momento
        </div>
      )}

      {/* Games */}
      {!loading && !error && games.length > 0 && (
        <div className="space-y-4">
          {games.map(game => {
            const bet365  = game.bookmakers?.find(b => b.key === 'bet365')
            const pinnacle = game.bookmakers?.find(b => b.key === 'pinnacle')

            const rows = [
              { label: game.home_team,  type: 'home' },
              { label: 'Empate',        type: 'draw' },
              { label: game.away_team,  type: 'away' },
            ]

            return (
              <div key={game.id} className="rounded-xl bg-[#111111] border border-white/8 overflow-hidden">
                {/* Match header */}
                <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-white">
                      {game.home_team} <span className="text-white/30 font-normal">vs</span> {game.away_team}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5">{fmtGameTime(game.commence_time)}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {bet365  && <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/20 font-semibold">Bet365</span>}
                    {pinnacle && <span className="text-[10px] px-2 py-0.5 rounded bg-[#00D964]/12 text-[#00D964] border border-[#00D964]/20 font-semibold">Pinnacle</span>}
                  </div>
                </div>

                {/* Odds table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[340px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-2.5 text-xs text-white/30 font-medium w-1/2">Resultado</th>
                        <th className="text-center px-4 py-2.5 text-xs text-[#FF6B00]/70 font-semibold">Bet365</th>
                        <th className="text-center px-4 py-2.5 text-xs text-[#00D964]/70 font-semibold">Pinnacle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ label, type }, i) => {
                        const b365 = getOutcome(bet365,  null, type, game.home_team, game.away_team)
                        const pin  = getOutcome(pinnacle, null, type, game.home_team, game.away_team)
                        return (
                          <tr key={type} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                            <td className="px-5 py-3 text-sm text-white/70 truncate max-w-[160px]">{label}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-mono font-semibold ${b365 != null ? (b365 > 0 ? 'text-[#00D964]' : 'text-white/80') : 'text-white/20'}`}>
                                {fmtPrice(b365)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-mono font-semibold ${pin != null ? (pin > 0 ? 'text-[#00D964]' : 'text-white/80') : 'text-white/20'}`}>
                                {fmtPrice(pin)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
