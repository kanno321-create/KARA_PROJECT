// Supabase 테이블 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTables() {
  console.log('🔍 Supabase 테이블 확인 중...\n');

  try {
    // 1. 고객 추가 테스트
    console.log('1️⃣ 고객 데이터 추가 테스트...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: '홍길동',
        company_name: '삼성전자',
        email: 'hong@samsung.com',
        phone: '010-1234-5678',
        address: '서울시 강남구'
      })
      .select()
      .single();

    if (customerError) {
      console.log('❌ 고객 추가 실패:', customerError.message);
    } else {
      console.log('✅ 고객 추가 성공:', customer);
    }

    // 2. 제품 추가 테스트
    console.log('\n2️⃣ 제품 데이터 추가 테스트...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        sku: 'BRK-001',
        name: 'MCCB 100A',
        category: 'BREAKER',
        manufacturer: 'LS전선',
        unit_price: 150000
      })
      .select()
      .single();

    if (productError) {
      console.log('❌ 제품 추가 실패:', productError.message);
    } else {
      console.log('✅ 제품 추가 성공:', product);
    }

    // 3. 테이블 목록 확인
    console.log('\n3️⃣ 모든 테이블 확인...');
    const tables = ['customers', 'products', 'breakers', 'enclosures', 'estimates', 'estimate_items'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: 테이블 없음`);
      } else {
        console.log(`✅ ${table}: 테이블 존재 (${count || 0}개 레코드)`);
      }
    }

    console.log('\n🎉 Supabase 연결 및 테이블 설정 완료!');

  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

testTables();