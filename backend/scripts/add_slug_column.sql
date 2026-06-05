-- Migración manual: añadir columna slug a game_rules
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Una sola vez, antes de correr parse_markdown.py por primera vez

ALTER TABLE game_rules
  ADD COLUMN IF NOT EXISTS slug VARCHAR(300);

-- Índice para búsqueda por slug + game_line (clave del upsert)
CREATE UNIQUE INDEX IF NOT EXISTS uq_game_rules_game_line_slug
  ON game_rules(game_line, slug)
  WHERE slug IS NOT NULL;

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_rules'
  AND column_name = 'slug';
