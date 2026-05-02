import { createClient } from "@supabase/supabase-js";
import type { Database } from "@class/types"; 

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { createClient };
export type { Database };
