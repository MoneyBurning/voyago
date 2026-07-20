import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다."
  );
}

if (!supabaseUrl.startsWith("http")) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL 값이 URL 형식이 아닙니다. .env.local 값을 확인해주세요 (예: https://xxxx.supabase.co)."
  );
}

/** Supabase 클라이언트 (브라우저/서버 공용, anon 키 사용) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
