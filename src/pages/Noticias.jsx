import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Tag, ArrowRight, Newspaper } from 'lucide-react'

const CATEGORIES = ['Todas', 'General', 'México', 'Resultados', 'Análisis', 'Selecciones', 'Fixtures']

const CATEGORY_COLORS = {
  México: 'bg-red-500/15 text-red-400',
  Resultados: 'bg-[#00D964]/15 text-[#00D964]',
  Análisis: 'bg-blue-500/15 text-blue-400',
  Selecciones: 'bg-purple-500/15 text-purple-400',
  Fixtures: 'bg-yellow-500/15 text-yellow-400',
  General: 'bg-white/10 text-white/50',
}

function CategoryBadge({ cat }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.General}`}>
      {cat}
    </span>
  )
}

export default function Noticias() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todas')

  useEffect(() => { fetchNews() }, [])

  async function fetchNews() {
    const { data } = await supabase
      .from('news')
      .select('id, title, summary, image_url, category, published_at')
      .order('published_at', { ascending: false })
    setNews(data || [])
    setLoading(false)
  }

  const filtered = activeCategory === 'Todas'
    ? news
    : news.filter(n => n.category === activeCategory)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Hero header */}
      <div className="bg-[#111111] border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D964]/30 bg-[#00D964]/10 text-[#00D964] text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D964] animate-pulse" />
            Mundial 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            Noticias del <span className="text-[#00D964]">Mundial</span>
          </h1>
          <p className="text-white/40 text-base max-w-lg">
            Cobertura en tiempo real del Mundial 2026 — análisis, resultados y novedades de las selecciones.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#00D964] text-black'
                  : 'border border-white/15 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">No hay noticias en esta categoría todavía.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((noticia, i) => (
              <NewsCard key={noticia.id} noticia={noticia} featured={i === 0 && activeCategory === 'Todas'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NewsCard({ noticia, featured }) {
  const date = new Date(noticia.published_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  if (featured) {
    return (
      <Link
        to={`/noticias/${noticia.id}`}
        className="md:col-span-2 lg:col-span-3 group rounded-2xl bg-[#111111] border border-white/8 overflow-hidden hover:border-white/20 transition-colors flex flex-col md:flex-row"
      >
        <div className="md:w-2/5 h-52 md:h-auto bg-[#1C1C1C] overflow-hidden shrink-0">
          {noticia.image_url ? (
            <img
              src={noticia.image_url}
              alt={noticia.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Newspaper size={48} className="text-white/10" />
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CategoryBadge cat={noticia.category} />
              <span className="text-xs text-white/30 flex items-center gap-1">
                <Calendar size={11} /> {date}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mb-2 group-hover:text-[#00D964] transition-colors leading-snug">
              {noticia.title}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{noticia.summary}</p>
          </div>
          <div className="flex items-center gap-1 text-[#00D964] text-sm font-semibold mt-4">
            Leer más <ArrowRight size={15} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/noticias/${noticia.id}`}
      className="group rounded-2xl bg-[#111111] border border-white/8 overflow-hidden hover:border-white/20 transition-colors flex flex-col"
    >
      <div className="h-44 bg-[#1C1C1C] overflow-hidden shrink-0">
        {noticia.image_url ? (
          <img
            src={noticia.image_url}
            alt={noticia.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper size={36} className="text-white/10" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge cat={noticia.category} />
          <span className="text-xs text-white/30 flex items-center gap-1">
            <Calendar size={11} /> {date}
          </span>
        </div>
        <h2 className="text-base font-bold text-white mb-2 group-hover:text-[#00D964] transition-colors leading-snug flex-1">
          {noticia.title}
        </h2>
        <p className="text-white/45 text-sm leading-relaxed line-clamp-2 mb-4">{noticia.summary}</p>
        <div className="flex items-center gap-1 text-[#00D964] text-xs font-semibold">
          Leer más <ArrowRight size={13} />
        </div>
      </div>
    </Link>
  )
}
