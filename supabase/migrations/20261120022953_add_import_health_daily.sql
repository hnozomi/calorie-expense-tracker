-- The health import: an outside sender (with no Supabase session) writes daily health values with an import
-- token. The import route calls this with the publishable key (as anon), so this is the one function that is
-- SECURITY DEFINER: it bypasses RLS, but only to write the token owner's health_daily_values rows from the
-- automatic sources (withings, apple_health). It touches no other table except last_used_at on the token, no
-- other user's rows and no manual rows, and the caller cannot pass a user_id.
--
-- 1. Look the token up by its SHA-256. If it is unknown, revoked, or lacks the health:write scope, write nothing
--    and return { ok: false, error: 'unauthorized' } (the reason is not told apart)
-- 2. Set last_used_at on the token
-- 3. Check every record again, as the route does (anyone can call this directly through the API). If any record
--    is wrong, write nothing and return { ok: false, error: 'invalid_records' }
-- 4. Upsert every value as the token owner's row, in this one transaction
-- 5. Return { ok: true, received, changed }: received is the number of values sent, changed the number that were
--    new or differed from the saved row (so sending the same values again gives changed = 0)
--
-- p_records is an array of 1 to 100 records:
--   { "date": "YYYY-MM-DD" (the date in Japan, not after today there),
--     "source": "withings" | "apple_health",
--     "metrics": { "weight_kg"?: number, "body_fat_pct"?: number, "steps"?: number, "active_energy_kcal"?: number }
--                (at least one; no other keys),
--     "measured_at"?: ISO 8601 with Z or an offset (or null) }
-- No other keys are allowed in a record, and the same date, source and metric may not appear twice.
-- Values must be in the range of health_daily_values_value_range_check, weight_kg has at most 2 decimals,
-- body_fat_pct at most 1, steps is a whole number, and active_energy_kcal is rounded to a whole number.
CREATE OR REPLACE FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_user_id UUID;
  v_today DATE := (now() AT TIME ZONE 'Asia/Tokyo')::DATE;
  v_invalid CONSTANT JSONB := jsonb_build_object('ok', false, 'error', 'invalid_records');
  v_record JSONB;
  v_date DATE;
  v_source TEXT;
  v_measured_at TIMESTAMPTZ;
  v_metric TEXT;
  v_raw JSONB;
  v_value NUMERIC;
  v_dates DATE[] := '{}';
  v_sources TEXT[] := '{}';
  v_metrics TEXT[] := '{}';
  v_values NUMERIC[] := '{}';
  v_measured TIMESTAMPTZ[] := '{}';
  v_received INTEGER;
  v_changed INTEGER;
BEGIN
  -- 1, 2. The token decides whose rows are written
  UPDATE public.import_tokens
  SET last_used_at = now()
  WHERE token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
    AND revoked_at IS NULL
    AND 'health:write' = ANY (scopes)
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- 3. Check everything before writing anything
  IF jsonb_typeof(p_records) IS DISTINCT FROM 'array' THEN
    RETURN v_invalid;
  END IF;
  IF jsonb_array_length(p_records) NOT BETWEEN 1 AND 100 THEN
    RETURN v_invalid;
  END IF;

  FOR v_record IN SELECT value FROM jsonb_array_elements(p_records) LOOP
    IF jsonb_typeof(v_record) <> 'object' THEN
      RETURN v_invalid;
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_object_keys(v_record) AS k(key)
      WHERE k.key NOT IN ('date', 'source', 'metrics', 'measured_at')
    ) THEN
      RETURN v_invalid;
    END IF;

    -- date: YYYY-MM-DD, a real date, not after today in Japan
    IF jsonb_typeof(v_record -> 'date') IS DISTINCT FROM 'string'
       OR (v_record ->> 'date') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RETURN v_invalid;
    END IF;
    BEGIN
      v_date := (v_record ->> 'date')::DATE;
    EXCEPTION WHEN OTHERS THEN
      RETURN v_invalid;
    END;
    IF v_date > v_today THEN
      RETURN v_invalid;
    END IF;

    -- source: only the automatic ones (manual rows are written from the app)
    v_source := v_record ->> 'source';
    IF jsonb_typeof(v_record -> 'source') IS DISTINCT FROM 'string'
       OR v_source NOT IN ('withings', 'apple_health') THEN
      RETURN v_invalid;
    END IF;

    -- measured_at: optional, ISO 8601 with a zone. A plain cast would also take words such as 'now' or 'infinity'
    v_measured_at := NULL;
    IF jsonb_typeof(v_record -> 'measured_at') IS NOT NULL
       AND jsonb_typeof(v_record -> 'measured_at') <> 'null' THEN
      IF jsonb_typeof(v_record -> 'measured_at') <> 'string'
         OR (v_record ->> 'measured_at') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$' THEN
        RETURN v_invalid;
      END IF;
      BEGIN
        v_measured_at := (v_record ->> 'measured_at')::TIMESTAMPTZ;
      EXCEPTION WHEN OTHERS THEN
        RETURN v_invalid;
      END;
    END IF;

    -- metrics: at least one, only the four known ones, numbers in range
    IF jsonb_typeof(v_record -> 'metrics') IS DISTINCT FROM 'object' THEN
      RETURN v_invalid;
    END IF;
    IF (v_record -> 'metrics') = '{}'::JSONB THEN
      RETURN v_invalid;
    END IF;

    FOR v_metric, v_raw IN SELECT key, value FROM jsonb_each(v_record -> 'metrics') LOOP
      IF jsonb_typeof(v_raw) <> 'number' THEN
        RETURN v_invalid;
      END IF;
      v_value := v_raw::NUMERIC;

      CASE v_metric
        WHEN 'weight_kg' THEN
          IF v_value NOT BETWEEN 20 AND 300 OR v_value <> round(v_value, 2) THEN
            RETURN v_invalid;
          END IF;
        WHEN 'body_fat_pct' THEN
          IF v_value NOT BETWEEN 1 AND 75 OR v_value <> round(v_value, 1) THEN
            RETURN v_invalid;
          END IF;
        WHEN 'steps' THEN
          IF v_value NOT BETWEEN 0 AND 200000 OR v_value <> trunc(v_value) THEN
            RETURN v_invalid;
          END IF;
        WHEN 'active_energy_kcal' THEN
          IF v_value NOT BETWEEN 0 AND 10000 THEN
            RETURN v_invalid;
          END IF;
          v_value := round(v_value);
        ELSE
          RETURN v_invalid;
      END CASE;

      v_dates := array_append(v_dates, v_date);
      v_sources := array_append(v_sources, v_source);
      v_metrics := array_append(v_metrics, v_metric);
      v_values := array_append(v_values, v_value);
      v_measured := array_append(v_measured, v_measured_at);
    END LOOP;
  END LOOP;

  v_received := cardinality(v_dates);

  -- The same date, source and metric twice: which one to keep is unclear
  IF (
    SELECT count(*) FROM (
      SELECT DISTINCT i.date, i.source, i.metric
      FROM unnest(v_dates, v_sources, v_metrics) AS i(date, source, metric)
    ) AS keys
  ) <> v_received THEN
    RETURN v_invalid;
  END IF;

  -- 4, 5. One import per user at a time, so the count of changed values matches what this call wrote
  PERFORM pg_advisory_xact_lock(hashtext('import_health_daily:' || v_user_id::TEXT));

  SELECT count(*) INTO v_changed
  FROM unnest(v_dates, v_sources, v_metrics, v_values, v_measured) AS i(date, source, metric, value, measured_at)
  LEFT JOIN public.health_daily_values AS h
    ON h.user_id = v_user_id
   AND h.date = i.date
   AND h.source = i.source
   AND h.metric = i.metric
  WHERE h.id IS NULL
     OR h.value IS DISTINCT FROM i.value
     OR h.measured_at IS DISTINCT FROM i.measured_at;

  INSERT INTO public.health_daily_values (user_id, date, metric, source, value, measured_at, imported_at)
  SELECT v_user_id, i.date, i.metric, i.source, i.value, i.measured_at, now()
  FROM unnest(v_dates, v_sources, v_metrics, v_values, v_measured) AS i(date, source, metric, value, measured_at)
  ON CONFLICT (user_id, date, metric, source) DO UPDATE
  SET value = EXCLUDED.value,
      measured_at = EXCLUDED.measured_at,
      imported_at = EXCLUDED.imported_at;

  RETURN jsonb_build_object('ok', true, 'received', v_received, 'changed', v_changed);
END;
$$;

ALTER FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") OWNER TO "postgres";

-- The import route calls this without a session (anon). A signed-in caller is not more trusted: the token alone
-- decides whose rows are written. Default privileges also grant EXECUTE, so revoke first.
REVOKE ALL ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") FROM "anon";
REVOKE ALL ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") FROM "authenticated";
GRANT EXECUTE ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_health_daily"("p_token" "text", "p_records" "jsonb") TO "service_role";
