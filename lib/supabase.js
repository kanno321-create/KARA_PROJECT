import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 URL과 익명 키를 여기에 입력하세요
// Dashboard → Settings → API에서 확인 가능
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mekvemepfbluoatpcmyy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1la3ZlbWVwZmJsdW9hdHBjbXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzc3MTksImV4cCI6MjA3NDIxMzcxOX0.cPBH9ik-pq0CgK9Wug4jI4T6DWJd7lMc1UF9MJ4rkFk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 예시
export const tables = {
  estimates: 'estimates',      // 견적 테이블
  customers: 'customers',      // 고객 정보
  products: 'products',        // 제품 카탈로그
  breakers: 'breakers',        // 차단기 정보
  enclosures: 'enclosures',    // 함체 정보
  users: 'users'               // 사용자 정보
}