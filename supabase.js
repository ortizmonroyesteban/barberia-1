import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mzstdotnprtdhpxnvzbq.supabase.co";
const supabaseKey = "sb_publishable_Py5fh-861jSvYqRNz6cnpQ_c7JwjBe7";

export const supabase = createClient(supabaseUrl, supabaseKey);