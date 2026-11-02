export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72; // bcrypt limit
export const SCORE_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
export type Score = 0 | 1 | 2 | 3 | 4;

const COMMON = new Set([
  "password", "passw0rd", "123456", "1234567", "12345678", "123456789", "1234567890", "111111", "000000",
  "qwerty", "qwertyuiop", "asdfghjkl", "zxcvbnm", "abc123", "letmein", "welcome", "admin", "administrator",
  "iloveyou", "monkey", "dragon", "football", "baseball", "login", "master", "sunshine", "princess",
  "trustno1", "changeme", "secret", "hhes", "hheskenya", "kenya", "nairobi", "jesus", "godisgood",
  "blessed", "church", "university", "school", "student", "teacher", "pastor", "adventist", "sabbath",
]);

// "P@ssw0rd1!" -> "password"
function normalise(pw: string) {
  return pw.toLowerCase().replace(/[\d\W_]+$/, "")
    .replace(/[@4]/g, "a").replace(/0/g, "o").replace(/[1!|]/g, "i").replace(/3/g, "e")
    .replace(/[$5]/g, "s").replace(/7/g, "t").replace(/[^a-z]/g, "");
}
const isCommon = (pw: string) => COMMON.has(pw.toLowerCase()) || (normalise(pw).length >= 4 && COMMON.has(normalise(pw)));

const tokens = (context: string[]) =>
  context.flatMap((c) => c.toLowerCase().split(/[^a-z0-9]+/)).filter((t) => t.length >= 4);

export const containsPersonalInfo = (pw: string, context: string[] = []) =>
  tokens(context).some((t) => pw.toLowerCase().includes(t));

function sequences(pw: string) { // runs of 4+ ascending/descending characters: abcd, 4321
  let n = 0, run = 1, dir = 0;
  for (let i = 1; i < pw.length; i++) {
    const d = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    if ((d === 1 || d === -1) && (dir === 0 || d === dir)) { run++; dir = d; }
    else { if (run >= 4) n++; run = 1; dir = 0; }
  }
  return run >= 4 ? n + 1 : n;
}

// A heuristic, not a dictionary attack simulation
function estimateBits(pw: string) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const per = Math.log2(Math.max(pool, 2));
  let bits = pw.length * per;
  bits -= (pw.match(/(.)\1{2,}/g) ?? []).reduce((s, m) => s + m.length - 1, 0) * per; // aaa, 111
  bits -= sequences(pw) * 10;
  if (new Set(pw).size < pw.length / 2) bits -= 10;
  return Math.max(bits, 0);
}

export function evaluatePassword(pw: string, context: string[] = []) {
  const checks = {
    length: pw.length >= PASSWORD_MIN,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const issues: string[] = [];
  if (!checks.length) issues.push(`Use at least ${PASSWORD_MIN} characters`);
  if (pw.length > PASSWORD_MAX) issues.push(`Use ${PASSWORD_MAX} characters or fewer`);
  if (!checks.lower || !checks.upper) issues.push("Mix upper and lower case letters");
  if (!checks.number) issues.push("Add a number");
  const common = pw.length > 0 && isCommon(pw);
  const personal = containsPersonalInfo(pw, context);
  if (common) issues.push("That password is too common");
  if (personal) issues.push("Don't include your name, email or organisation");

  const bits = estimateBits(pw);
  let score: Score = bits < 28 ? 0 : bits < 45 ? 1 : bits < 60 ? 2 : bits < 75 ? 3 : 4;
  if (!pw || common || personal) score = 0;
  else if (!(checks.length && checks.lower && checks.upper && checks.number)) score = Math.min(score, 1) as Score;

  const ok = issues.length === 0 && score >= 3;
  if (!ok && issues.length === 0) issues.push("Make it longer or add a symbol");
  return { ok, score, checks, issues, bits };
}