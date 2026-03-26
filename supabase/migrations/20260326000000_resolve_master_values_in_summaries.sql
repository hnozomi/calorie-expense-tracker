-- Migration: Resolve master values in summary RPCs
-- When meal_items reference a food_master or recipe, prefer the master's
-- current values over the snapshot stored at registration time.
-- Falls back to the snapshot if the master has been soft-deleted.

-----------------------------------------------------------
-- get_daily_summary: per-meal-type totals for a given date
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION get_daily_summary(
  p_target_date DATE
)
RETURNS TABLE (
  meal_type TEXT,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_fat NUMERIC,
  total_carbs NUMERIC,
  total_cost NUMERIC,
  item_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.meal_type,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.calories
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.calories / GREATEST(r.servings, 1)
        ELSE mi.calories
      END
    ), 0) AS total_calories,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.protein
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.protein / GREATEST(r.servings, 1)
        ELSE mi.protein
      END
    ), 0) AS total_protein,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.fat
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.fat / GREATEST(r.servings, 1)
        ELSE mi.fat
      END
    ), 0) AS total_fat,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.carbs
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.carbs / GREATEST(r.servings, 1)
        ELSE mi.carbs
      END
    ), 0) AS total_carbs,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.default_price
        ELSE mi.cost
      END
    ), 0) AS total_cost,
    COUNT(mi.id) AS item_count
  FROM meals m
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  LEFT JOIN food_masters fm ON fm.id = mi.food_master_id
  LEFT JOIN recipes r ON r.id = mi.recipe_id
  WHERE m.user_id = auth.uid() AND m.date = p_target_date
  GROUP BY m.meal_type;
END;
$$;

-----------------------------------------------------------
-- get_weekly_summary: daily totals for a 7-day week
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION get_weekly_summary(
  p_start_date DATE
)
RETURNS TABLE (
  date DATE,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_fat NUMERIC,
  total_carbs NUMERIC,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.calories
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.calories / GREATEST(r.servings, 1)
        ELSE mi.calories
      END
    ), 0) AS total_calories,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.protein
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.protein / GREATEST(r.servings, 1)
        ELSE mi.protein
      END
    ), 0) AS total_protein,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.fat
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.fat / GREATEST(r.servings, 1)
        ELSE mi.fat
      END
    ), 0) AS total_fat,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.carbs
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.carbs / GREATEST(r.servings, 1)
        ELSE mi.carbs
      END
    ), 0) AS total_carbs,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.default_price
        ELSE mi.cost
      END
    ), 0) AS total_cost
  FROM generate_series(p_start_date, p_start_date + 6, '1 day'::INTERVAL) AS d(date)
  LEFT JOIN meals m ON m.date = d.date AND m.user_id = auth.uid()
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  LEFT JOIN food_masters fm ON fm.id = mi.food_master_id
  LEFT JOIN recipes r ON r.id = mi.recipe_id
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;
