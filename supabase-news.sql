-- ============================================================
-- PRIME PICKS — Tabla de Noticias (ejecutar en SQL Editor)
-- Corre DESPUÉS de supabase-setup.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.news (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  summary      TEXT,
  content      TEXT,
  image_url    TEXT,
  category     TEXT NOT NULL DEFAULT 'General',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Lectura pública (sin auth requerido)
CREATE POLICY "news_select_public" ON public.news
  FOR SELECT USING (true);

-- Solo admins pueden crear noticias
CREATE POLICY "news_insert_admin" ON public.news
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden editar
CREATE POLICY "news_update_admin" ON public.news
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden eliminar
CREATE POLICY "news_delete_admin" ON public.news
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Acceso anónimo para leer (noticias son públicas)
GRANT SELECT ON public.news TO anon, authenticated;

-- ============================================================
-- DATOS DE PRUEBA DEL MUNDIAL 2026 (opcional)
-- ============================================================

INSERT INTO public.news (title, summary, content, category, published_at) VALUES
(
  'México clasifica a octavos con gol agónico de Lozano',
  'El Tri remontó un 0-1 en el último minuto para avanzar como segundo del Grupo C.',
  'Ciudad de México — En un partido que tuvo de todo, la Selección Mexicana consiguió el boleto a los octavos de final del Mundial 2026 gracias a un gol de Hirving Lozano en el minuto 93.

El partido comenzó con la selección rival anotando al 23'' tras un error defensivo de Edson Álvarez. México empujó durante todo el segundo tiempo sin encontrar el camino al gol hasta la jugada final.

La reacción del estadio y de millones de aficionados en todo el país fue monumental. El Tri avanza a la siguiente fase donde se medirá al segundo del Grupo D.',
  'México',
  now() - interval '1 day'
),
(
  'Argentina llega como favorita al Mundial 2026: análisis completo',
  'Scaloni tiene a la actual campeona del mundo en plena forma. Repasamos sus fortalezas y posibles debilidades.',
  'Buenos Aires — La selección argentina llega al Mundial 2026 como bicampeona del mundo y máxima favorita según las casas de apuestas. El modelo táctico de Scaloni ha evolucionado para ser aún más sólido.

Con Messi en su último mundial y Álvarez como referente del ataque, la Albiceleste muestra una jerarquía clara. En la defensa, la dupla Romero-Lisandro Martínez es de las más compactas del torneo.

Posibles vulnerabilidades: la velocidad en las transiciones y equipos que presionen alto desde el inicio.',
  'Análisis',
  now() - interval '2 days'
),
(
  'Fixtures y horarios: Fase de Grupos — Semana 2',
  'Todos los partidos de la segunda semana del Mundial 2026 con horarios en tiempo de México (CDT).',
  'A continuación los partidos más relevantes de la segunda jornada de la fase de grupos, con horarios en tiempo del Centro de México.

Martes 24 junio:
• Brasil vs España — 17:00 hrs
• Francia vs Alemania — 20:00 hrs

Miércoles 25 junio:
• México vs Ecuador — 19:00 hrs
• Portugal vs Marruecos — 22:00 hrs

Jueves 26 junio:
• Argentina vs Croacia — 18:00 hrs
• Uruguay vs Países Bajos — 21:00 hrs',
  'Fixtures',
  now() - interval '3 days'
);
