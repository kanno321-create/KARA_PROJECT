// Supabase 연결 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 연결 테스트
async function testConnection() {
  console.log('🔄 Supabase 연결 테스트 중...');

  try {
    // 테이블 생성 (테스트용)
    const { data, error } = await supabase
      .from('test_connection')
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('✅ Supabase 연결 성공! (테이블이 없지만 연결은 됨)');
    } else if (data) {
      console.log('✅ Supabase 연결 성공!');
    } else if (error) {
      console.error('❌ 오류:', error.message);
    }

    // 프로젝트 정보 출력
    console.log('\n📊 프로젝트 정보:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

  } catch (err) {
    console.error('❌ 연결 실패:', err);
  }
}

testConnection();