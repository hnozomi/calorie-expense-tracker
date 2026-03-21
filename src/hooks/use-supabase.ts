import { useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/** Stable browser-side Supabase client hook (created once per component lifecycle) */
export const useSupabase = () => {
  const clientRef = useRef(createClient());
  return clientRef.current;
};
