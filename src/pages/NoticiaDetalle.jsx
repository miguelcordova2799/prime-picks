import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calendar, Tag, Newspaper } from 'lucide-react'

const CATEGORY_COLORS = {
  México: 'bg-red-500/15 text-red-400',
  Resultados: 'bg-[#00D964]/15 text-[#00D964]',
  Análisis: 'bg-blue-500/15 text-blue-400',
  Selecciones: 'bg-purple-500/15 text-purple-400',
  Fixtures: 'bg-yellow-500/15 text-yellow-400',
  General: 'bg-white/10 text-white/50',
}

export default function NoticiaDetalle() {
  const { id } = useParams()
  const [noticia, setNoticia] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchNoticia()
  }, [id])

  async function fetchNoticia() {
    setLoading(true)
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setNoticia(data)

    const { data: rel } = await supabase
      .from('news')
      .select('id, title, category, published_at, image_url')
      .eq('category', data.category)
      .neq('id', id)
      .order('published_at', { ascending: false })
      .limit(3)
    setRelated(rel || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00D964] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white/40 gap-4">
      <Newspaper size={48} className="opacity-30" />
      <p className="text-lg">Noticia no encontrada</p>
      <Link to="/noticias" className="text-[#00D964] text-sm hover:underline">← Volver a noticias</Link>
    </div>
  )

  const date = new Date(noticia.published_at).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          to="/noticias"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={15} /> Volver a noticias
        </Link>

        {/* Hero image */}
        {noticia.image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-[#111111]">
            <img
              src={noticia.image_url}
              alt={noticia.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[noticia.category] || CATEGORY_COLORS.General}`}>
            {noticia.category}
          </span>
          <span className="text-xs text-white/35 flex items-center gap-1 capitalize">
            <Calendar size={12} /> {date}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black leading-tight mb-5">
          {noticia.title}
        </h1>

        {/* Summary */}
        {noticia.summary && (
          <p className="text-lg text-white/60 leading-relaxed mb-8 border-l-2 border-[#00D964] pl-4">
            {noticia.summary}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-white/8 mb-8" />

        {/* Content */}
        <div className="prose-dark text-white/75 text-base leading-relaxed space-y-4">
          {noticia.content
            ? noticia.content.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))
            : <p className="text-white/30 italic">Sin contenido disponible.</p>
          }
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/8">
            <h2 className="text-lg font-bold mb-5">Más de {noticia.category}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link
                  key={r.id}
                  to={`/noticias/${r.id}`}
                  className="group rounded-xl bg-[#111111] border border-white/8 overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="h-32 bg-[#1C1C1C] overflow-hidden">
                    {r.image_url
                      ? <img src={r.image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Newspaper size={24} className="text-white/10" /></div>
                    }
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-white group-hover:text-[#00D964] transition-colors leading-snug line-clamp-2">
                      {r.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
