// Supabase API를 통해 직접 테이블 생성
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Service Role Key 사용 (테이블 생성 권한)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🚀 KARA_PROJECT 데이터베이스 테이블 생성 시작...\n');

  const sql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 1. CUSTOMERS (고객 정보)
    CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        address TEXT,
        business_number VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. PRODUCTS (제품 카탈로그)
    CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sku VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        manufacturer VARCHAR(255),
        model VARCHAR(255),
        unit_price DECIMAL(15, 2),
        currency VARCHAR(3) DEFAULT 'KRW',
        stock_quantity INTEGER DEFAULT 0,
        specifications JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. BREAKERS (차단기 정보)
    CREATE TABLE IF NOT EXISTS breakers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50),
        voltage INTEGER,
        current_rating INTEGER,
        breaking_capacity INTEGER,
        poles INTEGER,
        mounting_type VARCHAR(50),
        specifications JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. ENCLOSURES (함체 정보)
    CREATE TABLE IF NOT EXISTS enclosures (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50),
        width DECIMAL(10, 2),
        height DECIMAL(10, 2),
        depth DECIMAL(10, 2),
        material VARCHAR(50),
        ip_rating VARCHAR(10),
        color VARCHAR(50),
        specifications JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. ESTIMATES (견적서)
    CREATE TABLE IF NOT EXISTS estimates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        estimate_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        project_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        valid_until DATE,
        subtotal DECIMAL(15, 2),
        tax_amount DECIMAL(15, 2),
        total_amount DECIMAL(15, 2),
        currency VARCHAR(3) DEFAULT 'KRW',
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. ESTIMATE_ITEMS (견적 항목)
    CREATE TABLE IF NOT EXISTS estimate_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15, 2),
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        tax_percent DECIMAL(5, 2) DEFAULT 10,
        line_total DECIMAL(15, 2),
        specifications JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // RPC가 없으면 직접 fetch 사용
      console.log('⏳ RPC 함수가 없어서 직접 REST API 사용...');

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        // 대체 방법: 각 테이블 개별 확인
        console.log('📋 테이블 개별 생성/확인 중...');

        const tables = ['customers', 'products', 'breakers', 'enclosures', 'estimates', 'estimate_items'];

        for (const table of tables) {
          const { data, error } = await supabase.from(table).select('*').limit(1);

          if (error && error.code === '42P01') {
            console.log(`❌ ${table} 테이블이 없습니다. SQL Editor에서 생성 필요`);
          } else {
            console.log(`✅ ${table} 테이블 확인됨`);
          }
        }
      }
    } else {
      console.log('✅ 모든 테이블 생성 완료!');
    }

    // 테이블 확인
    console.log('\n📊 생성된 테이블 확인...');

    const tables = ['customers', 'products', 'breakers', 'enclosures', 'estimates', 'estimate_items'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`✅ ${table}: 생성 완료 (${count || 0}개 레코드)`);
      } else {
        console.log(`⚠️ ${table}: ${error.message}`);
      }
    }

    // 샘플 데이터 추가
    console.log('\n📝 샘플 데이터 추가 중...');

    // 고객 추가
    const { data: customer } = await supabase
      .from('customers')
      .insert({
        name: '테스트 고객',
        company_name: 'KARA 테스트',
        email: 'test@kara.com',
        phone: '010-0000-0000'
      })
      .select()
      .single();

    if (customer) {
      console.log('✅ 샘플 고객 추가 완료');
    }

    // 제품 추가
    const { data: product } = await supabase
      .from('products')
      .insert({
        sku: 'TEST-001',
        name: '테스트 차단기',
        category: 'BREAKER',
        unit_price: 100000
      })
      .select()
      .single();

    if (product) {
      console.log('✅ 샘플 제품 추가 완료');
    }

    console.log('\n🎉 KARA_PROJECT 데이터베이스 설정 완료!');
    console.log('📌 Supabase Dashboard에서 Table Editor로 확인 가능합니다.');

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    console.log('\n💡 해결 방법:');
    console.log('1. Supabase Dashboard → SQL Editor');
    console.log('2. create_tables.sql 파일 내용 복사/붙여넣기');
    console.log('3. Run 버튼 클릭');
  }
}

createTables();