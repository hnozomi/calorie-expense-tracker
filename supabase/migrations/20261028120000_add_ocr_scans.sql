-- OCR now sends the photo to the Claude API, which is billed per call. Each scan is recorded here so the
-- Server Action can stop a user at a daily limit before calling the API.
CREATE TABLE IF NOT EXISTS "public"."ocr_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."ocr_scans" OWNER TO "postgres";

CREATE INDEX "ocr_scans_user_id_created_at_idx" ON "public"."ocr_scans" USING "btree" ("user_id", "created_at");

ALTER TABLE "public"."ocr_scans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ocr scans" ON "public"."ocr_scans" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can insert own ocr scans" ON "public"."ocr_scans" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

REVOKE ALL ON TABLE "public"."ocr_scans" FROM "anon";
GRANT SELECT, INSERT ON TABLE "public"."ocr_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."ocr_scans" TO "service_role";

-- Records one scan for the signed-in user and returns true, or returns false without recording when the user
-- already has p_daily_limit scans today (Japan time). The lock keeps two scans sent at once from both passing.
CREATE OR REPLACE FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_used INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('ocr_scans:' || v_user_id::TEXT));

  SELECT count(*) INTO v_used
  FROM ocr_scans
  WHERE user_id = v_user_id
    AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo');

  IF v_used >= p_daily_limit THEN
    RETURN false;
  END IF;

  INSERT INTO ocr_scans (user_id) VALUES (v_user_id);
  RETURN true;
END;
$$;

ALTER FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) FROM "anon";
GRANT ALL ON FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_ocr_scan"("p_daily_limit" integer) TO "service_role";
