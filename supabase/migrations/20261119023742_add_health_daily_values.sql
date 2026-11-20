-- Daily health values (weight, body fat, steps, active energy), one row per date x metric x source.
-- A missing row means the value was not measured. Automatic sources (withings, apple_health) are written
-- only by the import function added later; from the app, a user can write only manual rows, so a source
-- cannot be faked. Which source to show when several exist is decided in the app, not stored here.
CREATE TABLE IF NOT EXISTS "public"."health_daily_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "date" "date" NOT NULL,
    "metric" "text" NOT NULL,
    "source" "text" NOT NULL,
    "value" numeric NOT NULL,
    "measured_at" timestamp with time zone,
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "health_daily_values_metric_check" CHECK (("metric" = ANY (ARRAY['weight_kg'::"text", 'body_fat_pct'::"text", 'steps'::"text", 'active_energy_kcal'::"text"]))),
    CONSTRAINT "health_daily_values_source_check" CHECK (("source" = ANY (ARRAY['withings'::"text", 'apple_health'::"text", 'manual'::"text"]))),
    CONSTRAINT "health_daily_values_value_range_check" CHECK (
        (("metric" = 'weight_kg'::"text") AND ("value" >= 20) AND ("value" <= 300))
        OR (("metric" = 'body_fat_pct'::"text") AND ("value" >= 1) AND ("value" <= 75))
        OR (("metric" = 'steps'::"text") AND ("value" >= 0) AND ("value" <= 200000))
        OR (("metric" = 'active_energy_kcal'::"text") AND ("value" >= 0) AND ("value" <= 10000))
    ),
    -- The key the import upserts on, so sending the same day again leaves one row
    CONSTRAINT "health_daily_values_user_id_date_metric_source_key" UNIQUE ("user_id", "date", "metric", "source")
);

ALTER TABLE "public"."health_daily_values" OWNER TO "postgres";

CREATE INDEX "health_daily_values_user_id_date_idx" ON "public"."health_daily_values" USING "btree" ("user_id", "date");

CREATE OR REPLACE TRIGGER "set_health_daily_values_updated_at" BEFORE UPDATE ON "public"."health_daily_values" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

ALTER TABLE "public"."health_daily_values" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health daily values" ON "public"."health_daily_values" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "Users can insert own manual health daily values" ON "public"."health_daily_values" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("source" = 'manual'::"text")));
CREATE POLICY "Users can update own manual health daily values" ON "public"."health_daily_values" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("source" = 'manual'::"text"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("source" = 'manual'::"text")));
CREATE POLICY "Users can delete own health daily values" ON "public"."health_daily_values" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- The schema's default privileges grant ALL to anon and authenticated, so revoke first and grant only what is used
REVOKE ALL ON TABLE "public"."health_daily_values" FROM "anon";
REVOKE ALL ON TABLE "public"."health_daily_values" FROM "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."health_daily_values" TO "authenticated";
GRANT ALL ON TABLE "public"."health_daily_values" TO "service_role";
