import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Stars from '../components/Stars'
import { Plus, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'

const EMPTY_FORM = {
  match_name: '', pick_text: '', odds: '', bookmaker: '', edge: '',
  stars: 3, analysis: '', scheduled_at: '',
}

export default function Admin() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { fetchPicks() }, [])

  async function fetchPicks() {
    setLoading(true)
    const { data } = await supabase
      .from('picks')
      .select('*')
      .order('published_at', { ascending: false })
    setPicks(data || [])
    setLoading(false)
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handlePublish(e) {
    e.preventDefault()
    if (!form.match_name || !form.pick_text || !form.odds) return
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
    if (error) {
      showToast('Error: ' + error.message)
    } else {
      showToast('Pick publicado ✓')
      setForm(EMPTY_FORM)
      fetchPicks()
    }
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
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-[#EF9F27] text-black text-sm font-semibold rounded-lg shadow-xl">
            {toast}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-black">Panel de Admin</h1>
          <p className="text-white/40 text-sm mt-1">Publica y gestiona picks deportivos</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-[#EF9F27]" />
              Nuevo pick
            </h2>
            <form onSubmit={handlePublish} className="space-y-4 bg-[#111111] border border-white/8 rounded-2xl p-5">
              <Field label="Partido *" placeholder="Real Madrid vs Barcelona">
                <input
                  value={form.match_name}
                  onChange={e => field('match_name', e.target.value)}
                  required placeholder="Real Madrid vs Barcelona"
                  className="input-style"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pick *">
                  <input
                    value={form.pick_text}
                    onChange={e => field('pick_text', e.target.value)}
                    required placeholder="Ambos anotan"
                    className="input-style"
                  />
                </Field>
                <Field label="Cuota *">
                  <input
                    type="number" step="0.01" min="1"
                    value={form.odds}
                    onChange={e => field('odds', e.target.value)}
                    required placeholder="1.85"
                    className="input-style"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Casa de apuestas">
                  <input
                    value={form.bookmaker}
                    onChange={e => field('bookmaker', e.target.value)}
                    placeholder="Bet365"
                    className="input-style"
                  />
                </Field>
                <Field label="Edge detectado (%)">
                  <input
                    type="number" step="0.1"
                    value={form.edge}
                    onChange={e => field('edge', e.target.value)}
                    placeholder="12.4"
                    className="input-style"
                  />
                </Field>
              </div>

              <Field label="Confianza (estrellas)">
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => field('stars', n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.stars === n
                          ? 'bg-[#EF9F27]/20 border-[#EF9F27]/60 text-[#EF9F27]'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {'★'.repeat(n)}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Análisis">
                <textarea
                  value={form.analysis}
                  onChange={e => field('analysis', e.target.value)}
                  rows={4}
                  placeholder="Describe el razonamiento detrás del pick..."
                  className="input-style resize-none"
                />
              </Field>

              <Field label="Fecha/hora programada (opcional)">
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => field('scheduled_at', e.target.value)}
                  className="input-style"
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#EF9F27] text-black font-bold rounded-lg hover:bg-[#D4891A] transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'Publicando...' : 'Publicar pick'}
              </button>
            </form>
          </div>

          {/* Picks list */}
          <div>
            <h2 className="text-base font-bold mb-4">
              Picks publicados <span className="text-white/30 font-normal">({picks.length})</span>
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : picks.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">
                Aún no hay picks publicados
              </div>
            ) : (
              <div className="space-y-3">
                {picks.map(pick => (
                  <AdminPickCard key={pick.id} pick={pick} onResult={setResult} />
                ))}
              </div>
            )}
          </div>
        </div>
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
        .input-style:focus { border-color: rgba(239,159,39,0.5); }
      `}</style>
    </div>
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

function AdminPickCard({ pick, onResult }) {
  const [open, setOpen] = useState(false)
  const date = new Date(pick.published_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="min-w-0">
          <div className="text-xs text-white/35 mb-0.5">{date}</div>
          <div className="text-sm font-semibold text-white truncate">{pick.match_name}</div>
          <div className="text-xs text-white/50 mt-0.5">{pick.pick_text} · @{pick.odds}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars count={pick.stars} />
          <ResultBadge result={pick.result} />
          <ChevronDown size={15} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="border-t border-white/8 p-4">
          {pick.analysis && (
            <p className="text-xs text-white/50 mb-4 leading-relaxed">{pick.analysis}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onResult(pick.id, 'won')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                pick.result === 'won'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'border border-white/10 text-white/40 hover:border-emerald-500/30 hover:text-emerald-400'
              }`}
            >
              <CheckCircle size={13} /> Ganado
            </button>
            <button
              onClick={() => onResult(pick.id, 'pending')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                pick.result === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'border border-white/10 text-white/40 hover:border-yellow-500/30 hover:text-yellow-400'
              }`}
            >
              <Clock size={13} /> Pendiente
            </button>
            <button
              onClick={() => onResult(pick.id, 'lost')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                pick.result === 'lost'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'border border-white/10 text-white/40 hover:border-red-500/30 hover:text-red-400'
              }`}
            >
              <XCircle size={13} /> Perdido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultBadge({ result }) {
  const styles = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    won: 'bg-emerald-500/15 text-emerald-400',
    lost: 'bg-red-500/15 text-red-400',
  }
  const labels = { pending: 'Pendiente', won: 'Ganado', lost: 'Perdido' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[result] || styles.pending}`}>
      {labels[result] || 'Pendiente'}
    </span>
  )
}
