import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Stars from '../components/Stars'
import { Plus, CheckCircle, XCircle, Clock, ChevronDown, Newspaper, Trash2 } from 'lucide-react'

const EMPTY_PICK = {
  match_name: '', pick_text: '', odds: '', bookmaker: '', edge: '',
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
        </div>

        {tab === 'picks' ? <PicksAdmin /> : <NoticiasAdmin />}
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
    const { error } = await supabase.from('picks').insert({
      match_name: form.match_name,
      pick_text: form.pick_text,
      odds: parseFloat(form.odds),
      bookmaker: form.bookmaker,
      edge: parseFloat(form.edge) || 0,
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
              <Field label="Cuota *">
                <input type="number" step="0.01" min="1" value={form.odds} onChange={e => field('odds', e.target.value)} required placeholder="1.85" className="input-style" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Casa de apuestas">
                <input value={form.bookmaker} onChange={e => field('bookmaker', e.target.value)} placeholder="Bet365" className="input-style" />
              </Field>
              <Field label="Edge (%)">
                <input type="number" step="0.1" value={form.edge} onChange={e => field('edge', e.target.value)} placeholder="12.4" className="input-style" />
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
          <div className="text-xs text-white/50 mt-0.5">{pick.pick_text} · @{pick.odds}</div>
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

  useEffect(() => { fetchNews() }, [])

  async function fetchNews() {
    setLoading(true)
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    setNews(data || [])
    setLoading(false)
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

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
    else { showToast('Noticia publicada ✓'); setForm(EMPTY_NEWS); fetchNews() }
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoría">
                <select value={form.category} onChange={e => field('category', e.target.value)} className="input-style">
                  {NEWS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="URL imagen (opcional)">
                <input value={form.image_url} onChange={e => field('image_url', e.target.value)} placeholder="https://..." className="input-style" />
              </Field>
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
