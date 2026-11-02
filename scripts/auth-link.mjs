// usage: node --env-file=.env.local scripts/auth-link.mjs <invite|recovery> <email>
import { createClient } from "@supabase/supabase-js";

const [type, email] = process.argv.slice(2);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({ type, email });
if (error) { console.error(error.message); process.exit(1); }

if (type === "invite") { // mirror what /api/admin/invite does
  await admin.from("profiles").upsert({ id: data.user.id, role: "admin", full_name: "Test Admin" });
  await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role: "admin" } });
}
const next = type === "invite" ? "/set-password" : "/reset-password";
console.log(`${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=${type}&next=${next}`);