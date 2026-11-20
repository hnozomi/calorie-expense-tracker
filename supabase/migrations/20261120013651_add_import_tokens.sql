-- Tokens that let an outside sender (the health import) write as a user without a Supabase session.
-- Only the SHA-256 of a token is kept; the plain token is shown to the user once and never stored.
-- A token is revoked by setting revoked_at (rows are not deleted, so the history stays). The import
-- function added later looks a token up by its hash and updates last_used_at.
CREATE TABLE IF NOT EXISTS "public"."import_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "label" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_prefix" "text" NOT NULL,
    "scopes" "text"[] DEFAULT '{health:write}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "import_tokens_label_check" CHECK ((("char_length"("label") >= 1) AND ("char_length"("label") <= 40))),
    -- A SHA-256 in hex, so a plain token (mlg_...) can never be saved here by mistake
    CONSTRAINT "import_tokens_token_hash_check" CHECK (("token_hash" ~ '^[0-9a-f]{64}$'::"text")),
    -- Only the first 8 characters (mlg_ and 4 more), so the whole plain token cannot be saved here either
    CONSTRAINT "import_tokens_token_prefix_check" CHECK (("token_prefix" ~ '^mlg_[A-Za-z0-9_-]{4}$'::"text")),
    CONSTRAINT "import_tokens_token_hash_key" UNIQUE ("token_hash")
);

ALTER TABLE "public"."import_tokens" OWNER TO "postgres";

-- A user may hold at most 5 tokens that are not revoked. Checked in the database, not only in the Server
-- Action, because a signed-in user can also insert through the API directly. The lock keeps two inserts sent
-- at once from both passing.
CREATE OR REPLACE FUNCTION "public"."check_import_token_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  v_active INTEGER;
BEGIN
  IF NEW.revoked_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('import_tokens:' || NEW.user_id::TEXT));

  SELECT count(*) INTO v_active
  FROM public.import_tokens
  WHERE user_id = NEW.user_id
    AND revoked_at IS NULL;

  IF v_active >= 5 THEN
    RAISE EXCEPTION 'import token limit reached' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."check_import_token_limit"() OWNER TO "postgres";

-- Only called by the trigger
REVOKE ALL ON FUNCTION "public"."check_import_token_limit"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."check_import_token_limit"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."check_import_token_limit"() FROM "authenticated";
GRANT ALL ON FUNCTION "public"."check_import_token_limit"() TO "service_role";

CREATE OR REPLACE TRIGGER "check_import_token_limit" BEFORE INSERT ON "public"."import_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."check_import_token_limit"();

ALTER TABLE "public"."import_tokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import tokens" ON "public"."import_tokens" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can insert own import tokens" ON "public"."import_tokens" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
-- Update is only for revoking: a token that is not revoked yet can be revoked, and a revoked one cannot be
-- turned back on (that would also get around the limit of 5)
CREATE POLICY "Users can revoke own import tokens" ON "public"."import_tokens" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("revoked_at" IS NULL))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("revoked_at" IS NOT NULL)));
-- No delete policy: a token is revoked, not deleted

-- The schema's default privileges grant ALL to anon and authenticated, so revoke first and grant only what is used.
-- authenticated can read every column but token_hash, and can update only revoked_at.
REVOKE ALL ON TABLE "public"."import_tokens" FROM "anon";
REVOKE ALL ON TABLE "public"."import_tokens" FROM "authenticated";
GRANT SELECT ("id", "user_id", "label", "token_prefix", "scopes", "created_at", "last_used_at", "revoked_at") ON TABLE "public"."import_tokens" TO "authenticated";
GRANT INSERT ON TABLE "public"."import_tokens" TO "authenticated";
GRANT UPDATE ("revoked_at") ON TABLE "public"."import_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."import_tokens" TO "service_role";
