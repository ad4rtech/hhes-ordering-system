import { createClient } from "@supabase/supabase-js";
const [email, password] = process.argv.slice(2);
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await sb.auth.signInWithPassword({ email, password });
if (error) { console.error(error.message); process.exit(1); }
console.log(data.session.access_token);