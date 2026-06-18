-- ============================================================
-- PRIME PICKS — SQL Setup para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. TABLA: profiles
-- Se crea automáticamente al registrar un usuario vía trigger
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'free',          -- 'free' | 'admin'
  subscription_status TEXT NOT NULL DEFAULT 'inactive',      -- 'active' | 'inactive'
  subscription_end    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: picks
CREATE TABLE IF NOT EXISTS public.picks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_name   TEXT NOT NULL,
  pick_text    TEXT NOT NULL,
  odds         NUMERIC(5,2) NOT NULL,
  bookmaker    TEXT,
  edge         NUMERIC(5,2) DEFAULT 0,
  stars        SMALLINT DEFAULT 2 CHECK (stars BETWEEN 1 AND 3),
  analysis     TEXT,
  result       TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','won','lost')),
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. VISTA: stats (calcula wins, losses y ROI automáticamente)
CREATE OR REPLACE VIEW public.stats AS
SELECT
  COUNT(*) FILTER (WHERE result = 'won')  AS wins,
  COUNT(*) FILTER (WHERE result = 'lost') AS losses,
  COUNT(*)                                AS total,
  ROUND(
    CASE
      WHEN COUNT(*) FILTER (WHERE result IN ('won','lost')) = 0 THEN 0
      ELSE (
        (
          SUM(CASE WHEN result = 'won' THEN odds - 1 ELSE -1 END)
          FILTER (WHERE result IN ('won','lost'))
        ) / COUNT(*) FILTER (WHERE result IN ('won','lost'))
      ) * 100
    END,
    2
  ) AS roi
FROM public.picks;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks    ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario solo ve/edita su propio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- picks: todos los usuarios autenticados pueden VER los picks
-- (el frontend aplica el bloqueo visual según subscription_status)
CREATE POLICY "picks_select_authenticated" ON public.picks
  FOR SELECT USING (auth.role() = 'authenticated');

-- picks: solo admins pueden insertar / actualizar / borrar
CREATE POLICY "picks_insert_admin" ON public.picks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "picks_update_admin" ON public.picks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "picks_delete_admin" ON public.picks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- stats: visible para todos (es una vista de agregados)
GRANT SELECT ON public.stats TO anon, authenticated;

-- ============================================================
-- TRIGGER: crea perfil automáticamente al registrar usuario
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DATOS DE PRUEBA (opcional — borrar en producción)
-- ============================================================

INSERT INTO public.picks (match_name, pick_text, odds, bookmaker, edge, stars, analysis, result, published_at)
VALUES
  ('Real Madrid vs Barcelona',   'Ambos anotan',    1.85, 'Bet365',  12.4, 3, 'El Clásico en fase de Champions presenta dinámica ofensiva especial. Ambos necesitan la victoria. Historial de los últimos 8 enfrentamientos: 7 con goles de ambos equipos. Edge calculado con modelo Poisson ajustado.', 'won',    now() - interval '3 days'),
  ('PSG vs Bayern Munich',       'Más de 2.5 goles', 1.72, 'Betway',   9.8, 2, 'PSG en casa con Mbappé en plenitud física. Bayern presiona alto y concede espacios. Los últimos 5 partidos de PSG como local: 4 con más de 2 goles. Probabilidad implícita de la cuota: 58% vs modelo: 67%.', 'won',    now() - interval '2 days'),
  ('Manchester City vs Arsenal', 'Victoria City -1', 2.10, 'Codere',  14.2, 3, 'City con ventaja táctica clara en el mediocampo. Arsenal fuera de casa ha ganado solo 2 de sus últimos 8. Modelo ajustado por lesiones clave en defensa del Arsenal.', 'lost',   now() - interval '1 day'),
  ('Atlético Madrid vs Sevilla', 'Atlético gana',   1.60, 'Bet365',   7.3, 1, 'Atlético con récord impecable como local esta temporada (8V 1E 0D). Sevilla en racha negativa de 4 derrotas. Edge moderado, apuesta conservadora.', 'pending', now());

-- ============================================================
-- PARA HACER UN USUARIO ADMIN:
-- Reemplaza el UUID con el del usuario en auth.users
-- ============================================================
-- UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'tu-email@ejemplo.com';

-- PARA ACTIVAR SUSCRIPCIÓN MANUALMENTE:
-- UPDATE public.profiles
--   SET subscription_status = 'active',
--       subscription_end = now() + interval '1 month'
--   WHERE email = 'usuario@ejemplo.com';
