import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, CheckCircle, XCircle, Clock, ChevronDown, Newspaper, Trash2, Upload, X, BarChart2, RefreshCw, TrendingUp, Download, Edit, MessageSquare, Users, Settings, Calendar } from 'lucide-react'
import { formatOdds, americanToDecimal } from '../lib/odds'
import { useAppSettings } from '../context/AppSettingsContext'

const EMPTY_COMBINED_BET = { market: '', selection: '', odds: '' }
const EMPTY_PICK = {
  match_name: '', pick_text: '', odds: '', bookmaker: '', stake_percent: 2,
  analysis: '', scheduled_at: '', is_free: false,
  is_parlay: false,
  parlay_legs: [{ match: '', pick: '', odds: '' }, { match: '', pick: '', odds: '' }],
  is_combined: false,
  combined_bets: [{ ...EMPTY_COMBINED_BET }, { ...EMPTY_COMBINED_BET }],
}

const COMBINED_MARKETS = ['Resultado', 'Total goles', 'Primer gol', 'Ambos anotan', 'Hándicap', 'Tarjetas', 'Córners', 'Otro']

function decimalToAmerican(decimal) {
  const d = parseFloat(decimal)
  if (isNaN(d) || d <= 1) return '—'
  if (d >= 2) return `+${Math.round((d - 1) * 100)}`
  return `${Math.round(-100 / (d - 1))}`
}

function calcParlayTotalOdds(legs) {
  const valid = legs.filter(l => l.odds.trim())
  if (valid.length === 0) return 1
  return valid.reduce((acc, leg) => {
    const d = americanToDecimal(leg.odds) ?? parseFloat(leg.odds)
    return acc * (isNaN(d) || !d ? 1 : d)
  }, 1)
}

const EMPTY_NEWS = {
  title: '', summary: '', content: '', image_url: '',
  category: 'General', scheduled_at: '',
}

const NEWS_CATEGORIES = ['General']

export default function Admin() {
  const [tab, setTab] = useState('picks')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.from('mensajes').select('id', { count: 'exact' }).eq('leido', false)
      .then(({ count }) => setUnreadCount(count || 0))
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Panel de Admin</h1>
          <p className="text-white/40 text-sm mt-1">Gestiona picks y noticias</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#111111] border border-white/8 rounded-xl w-fit mb-8">
          <TabBtn active={tab === 'picks'} onClick={() => setTab('picks')} icon={Plus} label="Picks" />
          <TabBtn active={tab === 'noticias'} onClick={() => setTab('noticias')} icon={Newspaper} label="Noticias" />
          <TabBtn active={tab === 'lineas'} onClick={() => setTab('lineas')} icon={BarChart2} label="Líneas" />
          <TabBtn active={tab === 'control'} onClick={() => setTab('control')} icon={TrendingUp} label="Control" />
          <TabBtn
            active={tab === 'mensajes'}
            onClick={() => { setTab('mensajes'); setUnreadCount(0) }}
            icon={MessageSquare}
            label={unreadCount > 0 ? `Mensajes (${unreadCount})` : 'Mensajes'}
            badge={unreadCount}
          />
          <TabBtn active={tab === 'cortesia'} onClick={() => setTab('cortesia')} icon={Users} label="Cortesía" />
          <TabBtn active={tab === 'config'} onClick={() => setTab('config')} icon={Settings} label="Config" />
          <TabBtn active={tab === 'mensual'} onClick={() => setTab('mensual')} icon={Calendar} label="Mensual" />
        </div>

        {tab === 'picks' && <PicksAdmin />}
        {tab === 'noticias' && <NoticiasAdmin />}
        {tab === 'lineas' && <LineasAdmin />}
        {tab === 'control' && <ControlAdmin />}
        {tab === 'mensajes' && <MensajesAdmin />}
        {tab === 'cortesia' && <CourtesyAdmin />}
        {tab === 'config' && <ConfigAdmin />}
        {tab === 'mensual' && <ControlMensualAdmin />}
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

function TabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#00D964] text-black' : 'text-white/40 hover:text-white'
      }`}
    >
      <Icon size={15} />
      {label}
      {badge > 0 && !active && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
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
  const [editingPick, setEditingPick] = useState(null) // null = creating, object = editing
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

  function handleEdit(pick) {
    setEditingPick(pick)
    setForm({
      match_name:    pick.match_name  || '',
      pick_text:     pick.pick_text   || '',
      odds:          pick.odds != null ? String(pick.odds) : '',
      bookmaker:     pick.bookmaker   || '',
      stake_percent: parseFloat(pick.stake_percent) || 2,
      analysis:      pick.analysis    || '',
      is_free:       pick.is_free     || false,
      result:        pick.result      || 'pending',
      scheduled_at:  pick.published_at
        ? (() => {
            // datetime-local needs local time, not UTC — adjust for timezone offset
            const d = new Date(pick.published_at)
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          })()
        : '',
      is_parlay:     pick.is_parlay    || false,
      parlay_legs:   pick.parlay_legs  || [{ match: '', pick: '', odds: '' }, { match: '', pick: '', odds: '' }],
      is_combined:   pick.is_combined  || false,
      combined_bets: pick.combined_bets || [{ ...EMPTY_COMBINED_BET }, { ...EMPTY_COMBINED_BET }],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingPick(null)
    setForm(EMPTY_PICK)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSubmitting(true)

    let finalOdds, finalPickText, finalLegs, finalCombinedBets

    if (form.is_parlay) {
      const validLegs = form.parlay_legs.filter(l => l.match.trim() && l.pick.trim() && l.odds.trim())
      if (validLegs.length < 2) {
        showToast('Un parlay necesita al menos 2 patas completas')
        setSubmitting(false)
        return
      }
      finalOdds = calcParlayTotalOdds(validLegs)
      finalPickText = `Parlay ${validLegs.length} patas`
      finalLegs = validLegs
      finalCombinedBets = null
    } else if (form.is_combined) {
      const validBets = form.combined_bets.filter(b => b.market.trim() && b.selection.trim() && b.odds.trim())
      if (validBets.length < 2) {
        showToast('Una combinada necesita al menos 2 selecciones completas')
        setSubmitting(false)
        return
      }
      finalOdds = calcParlayTotalOdds(validBets.map(b => ({ odds: b.odds })))
      const selectionNames = validBets.map(b => b.selection).join(' + ')
      finalPickText = `Combinada ${validBets.length} sel.: ${selectionNames}`
      finalLegs = null
      finalCombinedBets = validBets
    } else {
      finalOdds = americanToDecimal(form.odds) ?? parseFloat(form.odds)
      finalPickText = form.pick_text
      finalLegs = null
      finalCombinedBets = null
    }

    const payload = {
      match_name:    form.match_name,
      pick_text:     finalPickText,
      odds:          finalOdds,
      bookmaker:     form.bookmaker,
      stake_percent: parseFloat(form.stake_percent) || 2,
      analysis:      form.analysis,
      is_free:       form.is_free,
      is_parlay:     form.is_parlay,
      parlay_legs:   finalLegs,
      is_combined:   form.is_combined,
      combined_bets: finalCombinedBets,
    }

    if (editingPick) {
      const { error } = await supabase.from('picks').update({
        ...payload,
        result:       form.result || 'pending',
        // Convert local datetime string → UTC ISO before saving
        published_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : editingPick.published_at,
      }).eq('id', editingPick.id)
      setSubmitting(false)
      if (error) showToast('Error: ' + error.message)
      else { showToast('Pick actualizado ✓'); cancelEdit(); fetchPicks() }
    } else {
      const { error } = await supabase.from('picks').insert({
        ...payload,
        result:       'pending',
        published_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : new Date().toISOString(),
      })
      setSubmitting(false)
      if (error) showToast('Error: ' + error.message)
      else { showToast('Pick publicado ✓'); setForm(EMPTY_PICK); fetchPicks() }
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pick? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('picks').delete().eq('id', id)
    if (error) showToast('Error: ' + error.message)
    else { showToast('Pick eliminado'); setPicks(ps => ps.filter(p => p.id !== id)) }
  }

  async function setResult(id, result) {
    await supabase.from('picks').update({ result }).eq('id', id)
    setPicks(ps => ps.map(p => p.id === id ? { ...p, result } : p))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const isEditing = !!editingPick

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
            {isEditing
              ? <><Edit size={18} className="text-[#EF9F27]" /> Editando pick</>
              : <><Plus size={18} className="text-[#00D964]" /> Nuevo pick</>
            }
          </h2>
          <form onSubmit={handleSave} className={`space-y-4 bg-[#111111] border rounded-2xl p-5 ${isEditing ? 'border-[#EF9F27]/30' : 'border-white/8'}`}>
            <Field label={form.is_parlay ? 'Título del parlay *' : 'Partido *'}>
              <input value={form.match_name} onChange={e => field('match_name', e.target.value)} required placeholder={form.is_parlay ? 'Parlay Miércoles' : 'Real Madrid vs Barcelona'} className="input-style" />
            </Field>

            {/* Parlay toggle — hidden when combined is active */}
            {!form.is_combined && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => field('is_parlay', !form.is_parlay)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_parlay ? 'bg-orange-500' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_parlay ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-white/70">
                  🔗 Es un parlay <span className="text-white/35">(múltiples partidos)</span>
                </span>
              </label>
            )}

            {/* Combined toggle — hidden when parlay is active */}
            {!form.is_parlay && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => field('is_combined', !form.is_combined)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_combined ? 'bg-blue-500' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_combined ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-white/70">
                  🎯 Apuesta combinada <span className="text-white/35">(múltiples mercados del mismo partido)</span>
                </span>
              </label>
            )}

            {/* Pick / Parlay legs / Combined bets */}
            {form.is_combined ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-white/40">Selecciones de la combinada * (mín. 2, máx. 5)</label>
                  {form.combined_bets.length < 5 && (
                    <button
                      type="button"
                      onClick={() => field('combined_bets', [...form.combined_bets, { ...EMPTY_COMBINED_BET }])}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Agregar selección
                    </button>
                  )}
                </div>

                {/* Header */}
                <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: '120px 1fr 72px 76px 30px' }}>
                  {['Mercado', 'Selección', 'Momio', 'Acum.', ''].map(h => (
                    <span key={h} className="text-[10px] text-white/25 px-1">{h}</span>
                  ))}
                </div>

                <div className="space-y-2">
                  {form.combined_bets.map((bet, i) => {
                    const runningDecimal = form.combined_bets.slice(0, i + 1).reduce((acc, b) => {
                      if (!b.odds.trim()) return acc
                      const d = americanToDecimal(b.odds) ?? parseFloat(b.odds)
                      return acc * (isNaN(d) || !d ? 1 : d)
                    }, 1)
                    const hasOdds = form.combined_bets.slice(0, i + 1).some(b => b.odds.trim())

                    return (
                      <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '120px 1fr 72px 76px 30px' }}>
                        <select
                          value={bet.market}
                          onChange={e => { const bets = [...form.combined_bets]; bets[i] = { ...bets[i], market: e.target.value }; field('combined_bets', bets) }}
                          className="input-style text-xs"
                        >
                          <option value="">Mercado...</option>
                          {COMBINED_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <input
                          value={bet.selection}
                          onChange={e => { const bets = [...form.combined_bets]; bets[i] = { ...bets[i], selection: e.target.value }; field('combined_bets', bets) }}
                          placeholder="España gana"
                          className="input-style text-xs"
                        />
                        <input
                          value={bet.odds}
                          onChange={e => { const bets = [...form.combined_bets]; bets[i] = { ...bets[i], odds: e.target.value }; field('combined_bets', bets) }}
                          placeholder="-162"
                          className="input-style text-xs"
                        />
                        <div className="px-2 py-2 rounded-lg bg-[#0A0A0A] border border-white/8 text-center">
                          {hasOdds && runningDecimal > 1 ? (
                            <div>
                              <div className="text-xs font-bold text-blue-400">{decimalToAmerican(runningDecimal)}</div>
                              <div className="text-[10px] text-white/25">{runningDecimal.toFixed(2)}x</div>
                            </div>
                          ) : <span className="text-white/20 text-xs">—</span>}
                        </div>
                        <button
                          type="button"
                          disabled={form.combined_bets.length <= 2}
                          onClick={() => field('combined_bets', form.combined_bets.filter((_, idx) => idx !== i))}
                          className="flex items-center justify-center text-white/30 hover:text-red-400 transition-colors disabled:opacity-20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Total preview */}
                {(() => {
                  const valid = form.combined_bets.filter(b => b.odds.trim())
                  if (valid.length < 2) return null
                  const total = calcParlayTotalOdds(valid.map(b => ({ odds: b.odds })))
                  return (
                    <div className="mt-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <div className="text-xs text-white/40 mb-1">Momio combinado ({valid.length} sel.) — se guardará en Supabase</div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-blue-400">{decimalToAmerican(total)}</span>
                        <span className="text-sm text-white/40">({total.toFixed(4)} decimal)</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : form.is_parlay ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-white/40">Patas del parlay * (mín. 2)</label>
                  {form.parlay_legs.length < 8 && (
                    <button
                      type="button"
                      onClick={() => field('parlay_legs', [...form.parlay_legs, { match: '', pick: '', odds: '' }])}
                      className="text-xs text-[#00D964] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Agregar pata
                    </button>
                  )}
                </div>

                {/* Header row */}
                <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: '1fr 1fr 72px 76px 30px' }}>
                  {['Partido', 'Pick', 'Momio', 'Momio Final', ''].map(h => (
                    <span key={h} className="text-[10px] text-white/25 px-1">{h}</span>
                  ))}
                </div>

                <div className="space-y-2">
                  {form.parlay_legs.map((leg, i) => {
                    // Running accumulation up to this row
                    const runningDecimal = form.parlay_legs.slice(0, i + 1).reduce((acc, l) => {
                      if (!l.odds.trim()) return acc
                      const d = americanToDecimal(l.odds) ?? parseFloat(l.odds)
                      return acc * (isNaN(d) || !d ? 1 : d)
                    }, 1)
                    const hasOdds = form.parlay_legs.slice(0, i + 1).some(l => l.odds.trim())

                    return (
                      <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 1fr 72px 76px 30px' }}>
                        <input
                          value={leg.match}
                          onChange={e => { const legs = [...form.parlay_legs]; legs[i] = { ...legs[i], match: e.target.value }; field('parlay_legs', legs) }}
                          placeholder={`Partido ${i + 1}`}
                          className="input-style text-xs"
                        />
                        <input
                          value={leg.pick}
                          onChange={e => { const legs = [...form.parlay_legs]; legs[i] = { ...legs[i], pick: e.target.value }; field('parlay_legs', legs) }}
                          placeholder="Pick"
                          className="input-style text-xs"
                        />
                        <input
                          value={leg.odds}
                          onChange={e => { const legs = [...form.parlay_legs]; legs[i] = { ...legs[i], odds: e.target.value }; field('parlay_legs', legs) }}
                          placeholder="+110"
                          className="input-style text-xs"
                        />
                        {/* Running total for this row */}
                        <div className="px-2 py-2 rounded-lg bg-[#0A0A0A] border border-white/8 text-center">
                          {hasOdds && runningDecimal > 1 ? (
                            <div>
                              <div className="text-xs font-bold text-orange-400">{decimalToAmerican(runningDecimal)}</div>
                              <div className="text-[10px] text-white/25">{runningDecimal.toFixed(2)}x</div>
                            </div>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={form.parlay_legs.length <= 2}
                          onClick={() => field('parlay_legs', form.parlay_legs.filter((_, idx) => idx !== i))}
                          className="flex items-center justify-center text-white/30 hover:text-red-400 transition-colors disabled:opacity-20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Total odds preview */}
                {(() => {
                  const validLegs = form.parlay_legs.filter(l => l.odds.trim())
                  if (validLegs.length < 2) return null
                  const total = calcParlayTotalOdds(validLegs)
                  const american = decimalToAmerican(total)
                  return (
                    <div className="mt-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                      <div className="text-xs text-white/40 mb-1">Momio total del parlay ({validLegs.length} patas) — este valor se guardará en Supabase</div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-orange-400">{american}</span>
                        <span className="text-sm text-white/40">({total.toFixed(4)} decimal)</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pick *">
                  <input value={form.pick_text} onChange={e => field('pick_text', e.target.value)} required placeholder="Ambos anotan" className="input-style" />
                </Field>
                <Field label="Cuota * (americano o decimal)">
                  <input type="text" value={form.odds} onChange={e => field('odds', e.target.value)} required placeholder="+110 o 1.91" className="input-style" />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Casa de apuestas">
                <input value={form.bookmaker} onChange={e => field('bookmaker', e.target.value)} placeholder="Bet365" className="input-style" />
              </Field>
              <Field label="Stake % del bank">
                <input type="number" min="0.5" step="0.5" value={form.stake_percent} onChange={e => field('stake_percent', e.target.value)} placeholder="2" className="input-style" />
              </Field>
            </div>
            <Field label="Análisis">
              <textarea value={form.analysis} onChange={e => field('analysis', e.target.value)} rows={4} placeholder="Razonamiento detrás del pick..." className="input-style resize-none" />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => field('is_free', !form.is_free)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_free ? 'bg-[#00D964]' : 'bg-white/15'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_free ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-white/70">
                🎁 Pick gratuito <span className="text-white/35">(visible para todos sin suscripción)</span>
              </span>
            </label>
            {isEditing && (
              <Field label="Resultado">
                <select value={form.result || 'pending'} onChange={e => field('result', e.target.value)} className="input-style">
                  <option value="pending">Pendiente</option>
                  <option value="won">Ganado</option>
                  <option value="lost">Perdido</option>
                  <option value="push">Push ↩️</option>
                </select>
              </Field>
            )}
            <Field label={isEditing ? 'Fecha/hora de publicación' : 'Fecha/hora programada (opcional)'}>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => field('scheduled_at', e.target.value)} className="input-style" />
            </Field>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className={`flex-1 py-3 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm ${
                  isEditing
                    ? 'bg-[#EF9F27] text-black hover:bg-[#D4891A]'
                    : 'bg-[#00D964] text-black hover:bg-[#00B856]'
                }`}>
                {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar pick'}
              </button>
              {isEditing && (
                <button type="button" onClick={cancelEdit}
                  className="px-4 py-3 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors text-sm">
                  Cancelar
                </button>
              )}
            </div>
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
              : <div className="space-y-3">{picks.map(p => (
                  <AdminPickCard key={p.id} pick={p} onResult={setResult} onEdit={handleEdit} onDelete={handleDelete} />
                ))}</div>
          }
        </div>
      </div>
    </>
  )
}

function AdminPickCard({ pick, onResult, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const date = new Date(pick.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const resultStyles = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    won: 'bg-[#00D964]/12 text-[#00D964]',
    lost: 'bg-red-500/15 text-red-400',
    push: 'bg-white/10 text-white/40',
  }
  const resultLabels = { pending: 'Pendiente', won: 'Ganado', lost: 'Perdido', push: 'Push ↩️' }

  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="min-w-0">
          <div className="text-xs text-white/35 mb-0.5">{date}</div>
          <div className="text-sm font-semibold text-white truncate">{pick.match_name}</div>
          <div className="text-xs text-white/50 mt-0.5">{pick.pick_text} · {formatOdds(pick.odds)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${resultStyles[pick.result] || resultStyles.pending}`}>
            {resultLabels[pick.result] || 'Pendiente'}
          </span>
          <ChevronDown size={15} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="border-t border-white/8 p-4 space-y-3">
          {pick.analysis && <p className="text-xs text-white/50 leading-relaxed">{pick.analysis}</p>}
          <div className="grid grid-cols-2 gap-2">
            {[
              { r: 'won',     label: 'Ganado',    Icon: CheckCircle, active: 'bg-[#00D964]/15 text-[#00D964] border-[#00D964]/30',   hover: 'hover:border-[#00D964]/30 hover:text-[#00D964]' },
              { r: 'lost',    label: 'Perdido',   Icon: XCircle,     active: 'bg-red-500/20 text-red-400 border-red-500/30',         hover: 'hover:border-red-500/30 hover:text-red-400' },
              { r: 'push',    label: 'Push ↩️',   Icon: RefreshCw,   active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   hover: 'hover:border-amber-500/30 hover:text-amber-400' },
              { r: 'pending', label: 'Pendiente', Icon: Clock,       active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', hover: 'hover:border-yellow-500/30 hover:text-yellow-400' },
            ].map(({ r, label, Icon, active, hover }) => (
              <button key={r} onClick={() => onResult(pick.id, r)}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                  pick.result === r ? active : `border-white/10 text-white/40 ${hover}`
                }`}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1 border-t border-white/6">
            <button onClick={() => onEdit(pick)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#EF9F27] border border-[#EF9F27]/25 hover:bg-[#EF9F27]/10 transition-colors">
              <Edit size={12} /> Editar
            </button>
            <button onClick={() => onDelete(pick.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors">
              <Trash2 size={12} /> Eliminar
            </button>
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

/* ── CONTROL ADMIN ───────────────────────────────────────────── */
function decimalOdds(pick) {
  return parseFloat(pick.odds) || 1
}

function calcUtility(pick) {
  const stake = parseFloat(pick.stake_percent) || 2
  if (pick.result === 'won') return stake * (decimalOdds(pick) - 1)
  if (pick.result === 'lost') return -stake
  return 0
}

function bestStreak(rows, result) {
  let best = 0, cur = 0
  for (const r of rows) {
    if (r.result === result) { cur++; if (cur > best) best = cur }
    else cur = 0
  }
  return best
}

function exportCSV(rows) {
  const headers = ['#', 'Fecha', 'Partido', 'Pick', 'Momio', '% Bank', 'Resultado', 'Utilidad %', 'Acumulado %']
  const lines = rows.map((r, i) => [
    i + 1,
    new Date(r.published_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    `"${r.match_name}"`,
    `"${r.pick_text}"`,
    r.odds_fmt,
    r.stake_percent,
    r.result,
    r.utility.toFixed(2),
    r.accumulated.toFixed(2),
  ].join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'control-picks.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function ControlAdmin() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('picks')
        .select('id, published_at, match_name, pick_text, odds, stake_percent, result')
        .neq('result', 'pending')
        .order('published_at', { ascending: true })
      if (data) {
        let acc = 0
        const enriched = data.map((p, i) => {
          const utility = calcUtility(p)
          acc += utility
          return {
            ...p,
            num: i + 1,
            utility,
            accumulated: acc,
            odds_fmt: formatOdds(parseFloat(p.odds) || 1),
          }
        })
        setRows(enriched)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const total     = rows.length
  const won       = rows.filter(r => r.result === 'won').length
  const lost      = rows.filter(r => r.result === 'lost').length
  const push      = rows.filter(r => r.result === 'push').length
  const resolved  = won + lost
  const hitRate   = resolved > 0 ? Math.round((won / resolved) * 100) : 0
  const totalUtil = rows.reduce((s, r) => s + r.utility, 0)
  const winStreak = bestStreak(rows, 'won')
  const loseStreak = bestStreak(rows, 'lost')

  const resultBadge = {
    won:  { label: 'Ganada',  cls: 'bg-[#00D964]/15 text-[#00D964] border-[#00D964]/25' },
    lost: { label: 'Perdida', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  }
  function getBadge(result) {
    return resultBadge[result] || { label: 'Push ↩️', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' }
  }

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total picks', value: total },
          { label: 'Ganados', value: won, color: 'text-[#00D964]' },
          { label: 'Perdidos', value: lost, color: 'text-red-400' },
          { label: 'Push ↩️', value: push, color: 'text-amber-400' },
          { label: '% Acierto', value: `${hitRate}%` },
          {
            label: 'Utilidad acumulada',
            value: `${totalUtil >= 0 ? '+' : ''}${totalUtil.toFixed(2)}%`,
            color: totalUtil >= 0 ? 'text-[#00D964]' : 'text-red-400',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111111] border border-white/8 rounded-xl p-4 text-center">
            <div className={`text-2xl font-black mb-1 ${color || 'text-white'}`}>{value}</div>
            <div className="text-xs text-white/40">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-4 text-xs text-white/40">
          <span>Mejor racha: <span className="text-[#00D964] font-bold">{winStreak}W</span></span>
          <span>Peor racha: <span className="text-red-400 font-bold">{loseStreak}L</span></span>
        </div>
        <button
          onClick={() => exportCSV(rows)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#111111] border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm border border-white/8 rounded-xl">
          No hay picks resueltos aún
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-[#111111]">
                {['#', 'Fecha', 'Partido', 'Pick', 'Momio', '% Bank', 'Resultado', 'Utilidad %', 'Acumulado %'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-white/40 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const badge = getBadge(r.result)
                const utilColor = r.result === 'won' ? 'text-[#00D964]' : r.result === 'lost' ? 'text-red-400' : 'text-amber-400'
                const accColor  = r.accumulated >= 0 ? 'text-[#00D964]' : 'text-red-400'
                return (
                  <tr key={r.id} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#111111]'}`}>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">{r.num}</td>
                    <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                      {new Date(r.published_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-white/80 max-w-[180px] truncate">{r.match_name}</td>
                    <td className="px-4 py-3 text-white/70 max-w-[120px] truncate">{r.pick_text}</td>
                    <td className="px-4 py-3 font-mono text-white/70 whitespace-nowrap">{r.odds_fmt}</td>
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">{r.stake_percent}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold ${utilColor}`}>
                      {r.result === 'won' ? '+' : ''}{r.utility.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold ${accColor}`}>
                      {r.accumulated >= 0 ? '+' : ''}{r.accumulated.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="border-t border-white/12 bg-[#161616]">
                <td colSpan={7} className="px-4 py-3 text-xs font-bold text-white/50">TOTAL</td>
                <td className={`px-4 py-3 font-mono font-black ${totalUtil >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                  {totalUtil >= 0 ? '+' : ''}{totalUtil.toFixed(2)}%
                </td>
                <td className={`px-4 py-3 font-mono font-black ${totalUtil >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                  {totalUtil >= 0 ? '+' : ''}{totalUtil.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── MENSAJES ADMIN ────────────────────────────────────────── */
function MensajesAdmin() {
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchMensajes() }, [])

  async function fetchMensajes() {
    setLoading(true)
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .order('created_at', { ascending: false })
    setMensajes(data || [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('mensajes').update({ leido: true }).eq('id', id)
    setMensajes(ms => ms.map(m => m.id === id ? { ...m, leido: true } : m))
  }

  function handleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
    const msg = mensajes.find(m => m.id === id)
    if (msg && !msg.leido) markRead(id)
  }

  const unread = mensajes.filter(m => !m.leido).length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-bold">Mensajes de contacto</h2>
        {unread > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
            {unread} nuevos
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mensajes.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">No hay mensajes aún</div>
      ) : (
        <div className="space-y-2">
          {mensajes.map(m => (
            <div
              key={m.id}
              className={`rounded-xl border transition-colors ${
                !m.leido ? 'border-red-500/20 bg-red-500/5' : 'border-white/8 bg-[#111111]'
              }`}
            >
              <button
                onClick={() => handleExpand(m.id)}
                className="w-full flex items-start justify-between gap-4 p-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!m.leido && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        NUEVO
                      </span>
                    )}
                    <span className="font-semibold text-sm text-white truncate">{m.nombre || 'Sin nombre'}</span>
                    <span className="text-xs text-white/35 truncate">{m.email}</span>
                  </div>
                  <p className="text-xs text-white/50 truncate">{m.mensaje}</p>
                </div>
                <div className="shrink-0 text-xs text-white/30 whitespace-nowrap">
                  {new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>

              {expanded === m.id && (
                <div className="px-4 pb-4 border-t border-white/8 pt-3">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-white/50">
                    <div><span className="text-white/30">Nombre:</span> {m.nombre || '—'}</div>
                    <div><span className="text-white/30">Email:</span> {m.email || '—'}</div>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{m.mensaje}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── CORTESÍA ADMIN ─────────────────────────────────────────── */
function CourtesyAdmin() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchCourtesyUsers() }, [])

  async function fetchCourtesyUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, email, created_at, is_courtesy, updated_at')
      .eq('is_courtesy', true)
      .order('updated_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function grantAccess() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setSaving(true)
    setError('')
    setToast('')

    // ilike = case-insensitive; maybeSingle = null (not error) when not found
    const { data, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', trimmed)
      .maybeSingle()

    if (fetchErr) {
      // Surface the real Supabase error (e.g. column "email" does not exist)
      setError(`Error al buscar: ${fetchErr.message} — ¿tiene la columna email en profiles? Corre: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT; UPDATE public.profiles SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id);`)
      setSaving(false)
      return
    }

    if (!data) {
      setError('Usuario no encontrado — pídele que se registre primero en primepicks.mx')
      setSaving(false)
      return
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ is_courtesy: true })
      .eq('id', data.id)

    setSaving(false)
    if (updateErr) {
      setError(`Error al actualizar: ${updateErr.message}`)
    } else {
      setToast(`✅ Acceso cortesía activado para ${trimmed}`)
      setEmail('')
      fetchCourtesyUsers()
      setTimeout(() => setToast(''), 4000)
    }
  }

  async function revokeAccess(userId, userEmail) {
    await supabase.from('profiles').update({ is_courtesy: false }).eq('id', userId)
    setToast(`❌ Acceso revocado para ${userEmail}`)
    fetchCourtesyUsers()
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="px-4 py-3 rounded-xl bg-[#00D964]/8 border border-[#00D964]/20">
        <p className="text-sm text-[#00D964]">
          Los usuarios de cortesía tienen acceso completo a todos los picks y funciones sin costo.
          Primero deben crear una cuenta en <span className="font-bold">primepicks.mx</span>
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="px-4 py-3 rounded-xl bg-[#111111] border border-white/10 text-sm text-white">
          {toast}
        </div>
      )}

      {/* Add form */}
      <div className="bg-[#111111] border border-white/8 rounded-xl p-5">
        <h3 className="font-bold text-white mb-4">Dar acceso gratuito</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && grantAccess()}
            placeholder="email@usuario.com"
            className="flex-1 px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors"
          />
          <button
            onClick={grantAccess}
            disabled={saving || !email.trim()}
            className="px-5 py-2.5 bg-[#00D964] text-black text-sm font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {saving ? 'Buscando...' : '✅ Dar acceso gratuito'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* List */}
      <div>
        <h3 className="font-bold text-white mb-3">Usuarios con acceso cortesía ({users.length})</h3>
        {loading ? (
          <p className="text-white/40 text-sm">Cargando...</p>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">No hay usuarios de cortesía todavía</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-[#111111] border border-white/8 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.email || u.id}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    Desde {new Date(u.updated_at || u.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => revokeAccess(u.id, u.email)}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  ❌ Revocar acceso
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, on, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-[#0A0A0A] border border-white/8 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {desc && <p className="text-xs text-white/40 mt-0.5">{desc}</p>}
      </div>
      <button type="button" onClick={onToggle}
        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-[#00D964]' : 'bg-white/20'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

const CFG_INP = 'w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00D964]/50 transition-colors'
const CFG_LBL = 'block text-xs text-white/40 mb-1.5'

function SaveRow({ saving, onSave, msg }) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-white/8 mt-2">
      <button onClick={onSave} disabled={saving}
        className="px-4 py-2 bg-[#00D964] text-black font-bold rounded-lg hover:bg-[#00B856] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {saving ? 'Guardando...' : '💾 Guardar'}
      </button>
      {msg && <span className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-400' : 'text-[#00D964]'}`}>{msg}</span>}
    </div>
  )
}

async function upsertSettings(pairs) {
  const rows = Object.entries(pairs).map(([key, value]) => ({ key, value }))
  return supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
}

function HeroSection() {
  const { settings, refreshSettings } = useAppSettings()
  const [form, setForm] = useState({ hero_titulo: 'Apuesta con inteligencia', hero_subtitulo: 'Picks deportivos con análisis real, edge detectado y récord transparente.', hero_cta: 'Ver picks de hoy →' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const keys = ['hero_titulo', 'hero_subtitulo', 'hero_cta']
    const u = {}; keys.forEach(k => { if (settings[k] !== undefined) u[k] = settings[k] })
    if (Object.keys(u).length) setForm(f => ({ ...f, ...u }))
  }, [settings])
  async function save() {
    setSaving(true); setMsg('')
    const { error } = await upsertSettings(form)
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  const s = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-white">🏆 Hero (portada)</h3>
      <div>
        <label className={CFG_LBL}>Título principal</label>
        <input className={CFG_INP} value={form.hero_titulo} onChange={s('hero_titulo')} placeholder="Apuesta con inteligencia" />
        <p className="text-xs text-white/25 mt-1">La última palabra aparece en verde.</p>
      </div>
      <div>
        <label className={CFG_LBL}>Subtítulo</label>
        <textarea className={CFG_INP + ' resize-none'} rows={3} value={form.hero_subtitulo} onChange={s('hero_subtitulo')} />
      </div>
      <div>
        <label className={CFG_LBL}>Texto del botón CTA</label>
        <input className={CFG_INP} value={form.hero_cta} onChange={s('hero_cta')} placeholder="Ver picks de hoy →" />
      </div>
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

function EstadisticasSection() {
  const { settings, refreshSettings } = useAppSettings()
  const [val, setVal] = useState('24 jun 2026')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (settings.stats_fecha_inicio !== undefined) setVal(settings.stats_fecha_inicio) }, [settings])
  async function save() {
    setSaving(true); setMsg('')
    const { error } = await upsertSettings({ stats_fecha_inicio: val })
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-white">📊 Estadísticas</h3>
      <div>
        <label className={CFG_LBL}>Fecha de inicio (aparece bajo el % de acierto)</label>
        <input className={CFG_INP} value={val} onChange={e => setVal(e.target.value)} placeholder="24 jun 2026" />
      </div>
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

function QuienesSomosSection() {
  const { settings, refreshSettings } = useAppSettings()
  const DEFAULT = 'Prime Picks nació con una misión clara: hacer que apostar sea rentable, inteligente y responsable. No somos adivinos ni vendemos sueños — somos analistas que usan estadística, probabilidad y datos reales para encontrar ventaja real contra las casas de apuestas.'
  const [val, setVal] = useState(DEFAULT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (settings.quienes_somos_texto !== undefined) setVal(settings.quienes_somos_texto) }, [settings])
  async function save() {
    setSaving(true); setMsg('')
    const { error } = await upsertSettings({ quienes_somos_texto: val })
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-white">🎯 Quiénes somos</h3>
      <div>
        <label className={CFG_LBL}>Descripción (aparece en la sección ¿Quiénes somos? de la landing)</label>
        <textarea className={CFG_INP + ' resize-none'} rows={6} value={val} onChange={e => setVal(e.target.value)} />
      </div>
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

const SERVICIO_DEFAULTS = [
  { titulo: 'Análisis estadístico', desc: 'Cada pick respaldado por datos reales, estadísticas avanzadas y análisis profundo de cada partido.' },
  { titulo: 'Picks verificados con historial público', desc: 'Todos nuestros resultados son públicos y verificables. Sin trampa, sin mentira — solo transparencia total.' },
  { titulo: 'Control de apuestas', desc: 'Lleva un registro profesional de tus apuestas con stake, utilidad y rendimiento acumulado en % del bank.' },
  { titulo: 'Aprende a apostar mejor', desc: 'La mejor plataforma para aprender sobre apuestas deportivas. Value betting, bankroll management y más.' },
  { titulo: 'Atención al cliente 24/7', desc: 'Nuestro equipo está disponible para resolver tus dudas en cualquier momento. Siempre cerca de ti.' },
  { titulo: 'Juego responsable', desc: 'Apostamos por el juego responsable. Te enseñamos a apostar con disciplina, criterio y sin riesgos innecesarios.' },
]

function ServiciosSection() {
  const { settings, refreshSettings } = useAppSettings()
  const buildDefault = () => Object.fromEntries(
    SERVICIO_DEFAULTS.flatMap((s, i) => [[`servicio_${i+1}_titulo`, s.titulo], [`servicio_${i+1}_desc`, s.desc]])
  )
  const [form, setForm] = useState(buildDefault)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const u = {}; Object.keys(form).forEach(k => { if (settings[k] !== undefined) u[k] = settings[k] })
    if (Object.keys(u).length) setForm(f => ({ ...f, ...u }))
  }, [settings])
  async function save() {
    setSaving(true); setMsg('')
    const { error } = await upsertSettings(form)
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-white">🛠️ Nuestros servicios</h3>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="space-y-2 pb-5 border-b border-white/6 last:border-0 last:pb-0">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Servicio {i}</p>
          <div>
            <label className={CFG_LBL}>Título</label>
            <input className={CFG_INP} value={form[`servicio_${i}_titulo`] || ''} onChange={e => setForm(f => ({ ...f, [`servicio_${i}_titulo`]: e.target.value }))} />
          </div>
          <div>
            <label className={CFG_LBL}>Descripción</label>
            <textarea className={CFG_INP + ' resize-none'} rows={2} value={form[`servicio_${i}_desc`] || ''} onChange={e => setForm(f => ({ ...f, [`servicio_${i}_desc`]: e.target.value }))} />
          </div>
        </div>
      ))}
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

function PlanSection() {
  const { settings, refreshSettings } = useAppSettings()
  const DEFAULT_FEATS = ['Todos los picks con análisis completo', 'Historial completo de resultados', 'Estadísticas en tiempo real', 'Noticias del Mundial', 'Cancela cuando quieras', '']
  const [form, setForm] = useState({ plan_nombre: 'Prime Picks', plan_precio: '899', plan_desc: 'Acceso completo a todos los picks, análisis e historial.', trial_picks: '2' })
  const [features, setFeatures] = useState(DEFAULT_FEATS)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const keys = ['plan_nombre', 'plan_precio', 'plan_desc', 'trial_picks']
    const u = {}; keys.forEach(k => { if (settings[k] !== undefined) u[k] = settings[k] })
    if (Object.keys(u).length) setForm(f => ({ ...f, ...u }))
    if (settings.plan_features) {
      try {
        const arr = JSON.parse(settings.plan_features)
        setFeatures([...arr, '', '', '', '', '', ''].slice(0, 6))
      } catch {}
    }
  }, [settings])
  async function save() {
    setSaving(true); setMsg('')
    const cleanFeats = features.filter(f => f.trim())
    const { error } = await upsertSettings({ ...form, plan_features: JSON.stringify(cleanFeats) })
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-white">💰 Plan y precios</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={CFG_LBL}>Nombre del plan</label>
          <input className={CFG_INP} value={form.plan_nombre} onChange={sf('plan_nombre')} placeholder="Prime Picks" />
        </div>
        <div>
          <label className={CFG_LBL}>Precio mensual (MXN, sin $)</label>
          <input className={CFG_INP} type="number" min="1" value={form.plan_precio} onChange={sf('plan_precio')} placeholder="899" />
        </div>
      </div>
      <div>
        <label className={CFG_LBL}>Descripción del plan</label>
        <input className={CFG_INP} value={form.plan_desc} onChange={sf('plan_desc')} placeholder="Acceso completo a todos los picks..." />
      </div>
      <div>
        <label className={CFG_LBL}>Features del plan (hasta 6, dejar vacío para omitir)</label>
        <div className="space-y-2">
          {[0,1,2,3,4,5].map(i => (
            <input key={i} className={CFG_INP} value={features[i] || ''} onChange={e => setFeatures(prev => { const n = [...prev]; n[i] = e.target.value; return n })} placeholder={`Feature ${i+1}`} />
          ))}
        </div>
      </div>
      <div>
        <label className={CFG_LBL}>Picks gratis por usuario nuevo (trial, 1–5)</label>
        <input className={CFG_INP} type="number" min="1" max="5" value={form.trial_picks} onChange={sf('trial_picks')} placeholder="2" />
      </div>
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

function TogglesSection() {
  const { settings, setNoticiasEnabled, refreshSettings } = useAppSettings()
  const [form, setForm] = useState({ noticias_enabled: 'true', banner_trial: 'true', show_features: 'true', show_quienes_somos: 'true' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const keys = ['noticias_enabled', 'banner_trial', 'show_features', 'show_quienes_somos']
    const u = {}; keys.forEach(k => { if (settings[k] !== undefined) u[k] = settings[k] })
    if (Object.keys(u).length) setForm(f => ({ ...f, ...u }))
  }, [settings])
  function toggle(k) { setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' })) }
  async function save() {
    setSaving(true); setMsg('')
    const { error } = await upsertSettings(form)
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else { setNoticiasEnabled(form.noticias_enabled === 'true'); await refreshSettings(); setMsg('✅ Guardado'); setTimeout(() => setMsg(''), 3000) }
  }
  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 space-y-3">
      <h3 className="font-bold text-white mb-2">🔔 Visibilidad de secciones</h3>
      <ToggleRow label="Sección de Noticias" desc="Muestra el enlace Noticias en el navbar y habilita /noticias" on={form.noticias_enabled === 'true'} onToggle={() => toggle('noticias_enabled')} />
      <ToggleRow label="Banner de prueba gratis" desc="Muestra el banner de picks GRATIS en la landing" on={form.banner_trial === 'true'} onToggle={() => toggle('banner_trial')} />
      <ToggleRow label="Sección ¿Por qué Prime Picks?" desc="Muestra los 3 cards de features en la landing" on={form.show_features === 'true'} onToggle={() => toggle('show_features')} />
      <ToggleRow label="Sección ¿Quiénes somos?" desc="Muestra la sección de descripción del equipo en la landing" on={form.show_quienes_somos === 'true'} onToggle={() => toggle('show_quienes_somos')} />
      <SaveRow saving={saving} onSave={save} msg={msg} />
    </div>
  )
}

function ConfigAdmin() {
  return (
    <div className="space-y-6 max-w-2xl">
      <HeroSection />
      <EstadisticasSection />
      <QuienesSomosSection />
      <ServiciosSection />
      <PlanSection />
      <TogglesSection />
    </div>
  )
}

// ── CONTROL MENSUAL ────────────────────────────────────────────

function computeMonthStats(ps) {
  const won = ps.filter(p => p.result === 'won').length
  const lost = ps.filter(p => p.result === 'lost').length
  const push = ps.filter(p => p.result === 'push').length
  const pending = ps.filter(p => p.result === 'pending').length
  const resolved = ps.filter(p => p.result !== 'pending')
  const hitRate = (won + lost) > 0 ? (won / (won + lost) * 100).toFixed(1) : '—'
  const utility = resolved.reduce((acc, p) => {
    const s = parseFloat(p.stake_percent) || 2
    return acc + (p.result === 'won' ? s * (parseFloat(p.odds) - 1) : p.result === 'lost' ? -s : 0)
  }, 0)
  const validOdds = resolved.map(p => parseFloat(p.odds) || 0).filter(v => v > 0)
  const avgOdds = validOdds.length > 0 ? (validOdds.reduce((a, b) => a + b, 0) / validOdds.length).toFixed(2) : '—'
  let best = null, worst = null
  resolved.forEach(p => {
    const s = parseFloat(p.stake_percent) || 2
    const u = p.result === 'won' ? s * (parseFloat(p.odds) - 1) : p.result === 'lost' ? -s : 0
    if (best === null || u > best.u) best = { ...p, u }
    if (worst === null || u < worst.u) worst = { ...p, u }
  })
  return { won, lost, push, pending, total: ps.length, hitRate, utility, avgOdds, best, worst }
}

function getMonthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key) {
  const [year, month] = key.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function MensualCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#111111] border border-white/8 rounded-xl p-4 text-center">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function ControlMensualAdmin() {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(null)

  useEffect(() => {
    supabase
      .from('picks')
      .select('id, match_name, pick_text, odds, stake_percent, result, published_at, bookmaker, is_parlay')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPicks(data || []); setLoading(false) })
  }, [])

  const months = useMemo(() => {
    const seen = new Set(); const list = []
    picks.forEach(p => {
      const key = getMonthKey(p.published_at)
      if (!seen.has(key)) { seen.add(key); list.push(key) }
    })
    return list
  }, [picks])

  useEffect(() => {
    if (!selectedMonth && months.length > 0) setSelectedMonth(months[0])
  }, [months, selectedMonth])

  const monthPicks = useMemo(() => {
    if (!selectedMonth) return []
    return picks.filter(p => getMonthKey(p.published_at) === selectedMonth)
  }, [picks, selectedMonth])

  const stats = useMemo(() => computeMonthStats(monthPicks), [monthPicks])

  const tableData = useMemo(() => {
    const sorted = [...monthPicks].sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    let acc = 0
    return sorted.map((p, i) => {
      const s = parseFloat(p.stake_percent) || 2
      const u = p.result === 'won' ? s * (parseFloat(p.odds) - 1) : p.result === 'lost' ? -s : p.result === 'push' ? 0 : null
      if (u !== null) acc += u
      return { ...p, util: u, accum: u !== null ? acc : null, rowNum: i + 1 }
    })
  }, [monthPicks])

  const monthlyComparison = useMemo(() => {
    return months.map(key => {
      const ps = picks.filter(p => getMonthKey(p.published_at) === key)
      return { key, label: getMonthLabel(key), ...computeMonthStats(ps) }
    })
  }, [picks, months])

  function exportCSV() {
    const header = ['#', 'Fecha', 'Partido', 'Pick', 'Momio', '% Bank', 'Resultado', 'Util %', 'Acum %']
    const rows = tableData.map(p => [
      p.rowNum,
      new Date(p.published_at).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }),
      p.match_name, p.pick_text, p.odds, p.stake_percent, p.result,
      p.util !== null ? p.util.toFixed(2) : '',
      p.accum !== null ? p.accum.toFixed(2) : '',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `picks-${selectedMonth}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (months.length === 0) return (
    <div className="text-center py-16 text-white/30">
      <Calendar size={40} className="mx-auto mb-3 opacity-30" />
      <p>No hay picks publicados todavía.</p>
    </div>
  )

  const RMAP = { won: 'Ganado', lost: 'Perdido', push: 'Push', pending: 'Pend.' }
  const RCOL = { won: 'text-[#00D964]', lost: 'text-red-400', push: 'text-amber-400', pending: 'text-yellow-400' }

  return (
    <div className="space-y-6">

      {/* Month selector */}
      <div className="bg-[#111111] border border-white/8 rounded-2xl p-4">
        <p className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-wide">Selecciona el mes</p>
        <div className="flex flex-wrap gap-2">
          {months.map(key => (
            <button key={key} onClick={() => setSelectedMonth(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedMonth === key ? 'bg-[#00D964] text-black' : 'bg-white/8 text-white/60 hover:bg-white/12 hover:text-white'}`}
            >
              {getMonthLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {selectedMonth && (
        <>
          {/* Summary grids */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MensualCard label="Total picks" value={stats.total} color="text-white" />
            <MensualCard label="Ganados" value={stats.won} color="text-[#00D964]" />
            <MensualCard label="Perdidos" value={stats.lost} color="text-red-400" />
            <MensualCard label="Push" value={stats.push} color="text-amber-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MensualCard label="% Acierto" value={stats.hitRate !== '—' ? `${stats.hitRate}%` : '—'} color="text-[#00D964]" />
            <MensualCard label="Utilidad mes" value={`${stats.utility >= 0 ? '+' : ''}${stats.utility.toFixed(2)}%`} color={stats.utility >= 0 ? 'text-[#00D964]' : 'text-red-400'} />
            <MensualCard label="Momio prom." value={stats.avgOdds} color="text-white" />
            <MensualCard label="Pendientes" value={stats.pending} color="text-yellow-400" />
          </div>

          {/* Best / Worst */}
          {(stats.best || stats.worst) && (
            <div className="grid md:grid-cols-2 gap-3">
              {stats.best && (
                <div className="bg-[#111111] border border-[#00D964]/25 rounded-xl p-4">
                  <p className="text-xs text-[#00D964] font-bold mb-1">🏆 Mejor pick del mes</p>
                  <p className="text-sm font-semibold text-white truncate">{stats.best.match_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{stats.best.pick_text} · {stats.best.odds} · <span className="text-[#00D964] font-semibold">+{stats.best.u.toFixed(2)}%</span></p>
                </div>
              )}
              {stats.worst && stats.worst.id !== stats.best?.id && (
                <div className="bg-[#111111] border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs text-red-400 font-bold mb-1">📉 Pick más costoso del mes</p>
                  <p className="text-sm font-semibold text-white truncate">{stats.worst.match_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{stats.worst.pick_text} · {stats.worst.odds} · <span className="text-red-400 font-semibold">{stats.worst.u.toFixed(2)}%</span></p>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          <div className="flex justify-end">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/12 text-white/70 hover:text-white hover:bg-white/12 rounded-lg text-sm transition-colors"
            >
              <Download size={14} /> Exportar mes CSV
            </button>
          </div>

          {/* Detail table */}
          <div className="bg-[#111111] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Detalle — {getMonthLabel(selectedMonth)}</h3>
              <span className="text-xs text-white/40">{tableData.length} picks</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-white/2">
                    {['#', 'Fecha', 'Partido', 'Pick', 'Momio', '% Bank', 'Resultado', 'Util %', 'Acum %'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-white/40 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30">Sin picks este mes</td></tr>
                  ) : tableData.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-3 py-3 text-white/30">{p.rowNum}</td>
                      <td className="px-3 py-3 text-white/50 whitespace-nowrap">
                        {new Date(p.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' })}
                      </td>
                      <td className="px-3 py-3 text-white font-medium max-w-[130px]"><span className="truncate block">{p.match_name}</span></td>
                      <td className="px-3 py-3 text-white/70 max-w-[110px]"><span className="truncate block">{p.pick_text}</span></td>
                      <td className="px-3 py-3 text-white/70">{p.odds}</td>
                      <td className="px-3 py-3 text-white/70">{p.stake_percent}%</td>
                      <td className={`px-3 py-3 font-semibold ${RCOL[p.result] || 'text-white/40'}`}>{RMAP[p.result] || p.result}</td>
                      <td className={`px-3 py-3 font-semibold ${p.util === null ? 'text-white/25' : p.util >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                        {p.util !== null ? `${p.util >= 0 ? '+' : ''}${p.util.toFixed(2)}%` : '—'}
                      </td>
                      <td className={`px-3 py-3 font-bold ${p.accum === null ? 'text-white/25' : p.accum >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                        {p.accum !== null ? `${p.accum >= 0 ? '+' : ''}${p.accum.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Monthly comparison */}
      {monthlyComparison.length > 1 && (
        <div className="bg-[#111111] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h3 className="font-bold text-white text-sm">Comparativa de meses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 bg-white/2">
                  {['Mes', 'Picks', 'Gan.', 'Per.', 'Push', '% Acierto', 'Utilidad %'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-white/40 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyComparison.map(m => (
                  <tr key={m.key} onClick={() => setSelectedMonth(m.key)}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${selectedMonth === m.key ? 'bg-[#00D964]/6' : 'hover:bg-white/3'}`}
                  >
                    <td className="px-3 py-3 text-white font-semibold">{m.label}</td>
                    <td className="px-3 py-3 text-white/70">{m.total}</td>
                    <td className="px-3 py-3 text-[#00D964] font-semibold">{m.won}</td>
                    <td className="px-3 py-3 text-red-400 font-semibold">{m.lost}</td>
                    <td className="px-3 py-3 text-amber-400 font-semibold">{m.push}</td>
                    <td className="px-3 py-3 text-white/70">{m.hitRate !== '—' ? `${m.hitRate}%` : '—'}</td>
                    <td className={`px-3 py-3 font-bold ${m.utility >= 0 ? 'text-[#00D964]' : 'text-red-400'}`}>
                      {`${m.utility >= 0 ? '+' : ''}${m.utility.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

