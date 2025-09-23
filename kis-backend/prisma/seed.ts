import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KIS ERP database...');

  // ========================================
  // 기본 설정 생성
  // ========================================

  console.log('📋 Creating default settings...');

  const settings = await prisma.setting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultBrand: 'SANGDO',
      defaultForm: 'ECONOMIC',
      defaultLocation: 'INDOOR',
      defaultMount: 'FLUSH',
      rules: {
        singleBrand: true,
        antiPoleMistake: true,
        allowMixedBrand: false,
        require3Gates: true,
        economicByDefault: true,
      },
      knowledgeVersion: {
        rules: 'v1.0',
        tables: 'v1.0',
        updated: new Date().toISOString(),
      },
    },
  });

  console.log(`✅ Settings created: ${settings.id}`);

  // ========================================
  // 샘플 이메일 그룹 생성
  // ========================================

  console.log('📧 Creating sample email groups...');

  const emailGroups = [
    {
      name: '일반 고객',
      rules: [
        { type: 'domain', value: '@naver.com' },
        { type: 'domain', value: '@gmail.com' },
      ],
    },
    {
      name: '주요 거래처',
      rules: [
        { type: 'domain', value: '@samsung.com' },
        { type: 'domain', value: '@lg.com' },
        { type: 'domain', value: '@hyundai.com' },
      ],
    },
    {
      name: '설계사무소',
      rules: [
        { type: 'email', value: 'architect@' },
        { type: 'email', value: 'design@' },
        { type: 'domain', value: '@architects.com' },
      ],
    },
    {
      name: '시공업체',
      rules: [
        { type: 'email', value: 'construction@' },
        { type: 'email', value: 'contractor@' },
        { type: 'domain', value: '@construct.co.kr' },
      ],
    },
  ];

  for (const group of emailGroups) {
    const created = await prisma.emailGroup.upsert({
      where: { name: group.name },
      update: { rules: group.rules },
      create: {
        name: group.name,
        rules: group.rules,
      },
    });

    console.log(`✅ Email group created: ${created.name}`);
  }

  // ========================================
  // 샘플 캘린더 이벤트 생성
  // ========================================

  console.log('📅 Creating sample calendar events...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const calendarEvents = [
    {
      type: 'estimate',
      title: '신규 배전반 견적 요청 검토',
      start: tomorrow,
      end: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2시간 후
      location: '사무실',
      memo: '삼성전자 화성캠퍼스 배전반 견적 검토 회의',
      owner: 'admin',
      links: {},
    },
    {
      type: 'install',
      title: 'LG디스플레이 배전반 설치',
      start: nextWeek,
      end: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000), // 8시간 후
      location: 'LG디스플레이 파주공장',
      memo: '메인 배전반 및 분기 배전반 설치 작업',
      owner: 'technician',
      links: {},
    },
    {
      type: 'inbound',
      title: '현대자동차 견적 요청 접수',
      start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3일 후
      end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1시간 후
      location: '영업팀',
      memo: '울산공장 전력설비 배전반 견적 요청',
      owner: 'sales',
      links: {},
    },
    {
      type: 'misc',
      title: '월간 안전교육',
      start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5일 후
      end: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3시간 후
      location: '교육장',
      memo: '작업자 대상 안전교육 및 신규 규정 전달',
      owner: 'safety',
      links: {},
    },
  ];

  for (const event of calendarEvents) {
    const created = await prisma.calendarEvent.create({
      data: event,
    });

    console.log(`✅ Calendar event created: ${created.title}`);
  }

  // ========================================
  // 샘플 도면 생성
  // ========================================

  console.log('📐 Creating sample drawings...');

  const drawings = [
    {
      name: 'SAMSUNG_MAIN_PANEL',
      rev: 'Rev-01',
      date: new Date('2024-09-01'),
      author: '김설계',
      tags: ['samsung', 'main', 'electrical'],
      memo: '삼성전자 메인 배전반 도면',
      history: [
        {
          ts: new Date('2024-09-01').toISOString(),
          action: 'CREATE',
          note: '초기 도면 작성',
        },
      ],
      links: {},
    },
    {
      name: 'SAMSUNG_MAIN_PANEL',
      rev: 'Rev-02',
      date: new Date('2024-09-15'),
      author: '김설계',
      tags: ['samsung', 'main', 'electrical', 'updated'],
      memo: '삼성전자 메인 배전반 도면 (수정)',
      history: [
        {
          ts: new Date('2024-09-01').toISOString(),
          action: 'CREATE',
          note: '초기 도면 작성',
        },
        {
          ts: new Date('2024-09-15').toISOString(),
          action: 'UPDATE',
          note: '메인 차단기 용량 변경 (400A -> 630A)',
        },
      ],
      links: {},
    },
    {
      name: 'LG_SUB_PANEL_A',
      rev: 'Rev-01',
      date: new Date('2024-09-10'),
      author: '박전기',
      tags: ['lg', 'sub', 'electrical'],
      memo: 'LG디스플레이 A동 분기 배전반',
      history: [
        {
          ts: new Date('2024-09-10').toISOString(),
          action: 'CREATE',
          note: '분기 배전반 도면 작성',
        },
      ],
      links: {},
    },
    {
      name: 'HYUNDAI_MOTOR_DIST',
      rev: 'Rev-01',
      date: new Date('2024-09-20'),
      author: '이전력',
      tags: ['hyundai', 'distribution', 'automotive'],
      memo: '현대자동차 울산공장 배전 시스템',
      history: [
        {
          ts: new Date('2024-09-20').toISOString(),
          action: 'CREATE',
          note: '배전 시스템 도면 작성',
        },
      ],
      links: {},
    },
  ];

  for (const drawing of drawings) {
    const created = await prisma.drawing.create({
      data: drawing,
    });

    console.log(`✅ Drawing created: ${created.name} ${created.rev}`);
  }

  // ========================================
  // 샘플 이메일 스레드 생성
  // ========================================

  console.log('💬 Creating sample email threads...');

  // 이메일 그룹 조회
  const generalGroup = await prisma.emailGroup.findUnique({
    where: { name: '일반 고객' },
  });

  const majorClientGroup = await prisma.emailGroup.findUnique({
    where: { name: '주요 거래처' },
  });

  const emailThreads = [
    {
      to: 'purchasing@samsung.com',
      subject: '배전반 견적 요청 - 화성캠퍼스',
      body: '안녕하세요. 화성캠퍼스 신축 건물의 배전반 견적을 요청드립니다.',
      status: 'DRAFT',
      groupId: majorClientGroup?.id,
    },
    {
      to: 'facility@lg.com',
      cc: 'project@lg.com',
      subject: 'Re: 파주공장 배전반 설치 일정',
      body: '설치 일정 확정되었습니다. 다음 주 월요일부터 시작 예정입니다.',
      status: 'SENT',
      groupId: majorClientGroup?.id,
    },
    {
      to: 'info@smallcompany.co.kr',
      subject: '소규모 배전반 견적 문의',
      body: '소규모 사무실용 배전반 견적을 요청드립니다.',
      status: 'DRAFT',
      groupId: generalGroup?.id,
    },
  ];

  for (const thread of emailThreads) {
    const created = await prisma.emailThread.create({
      data: thread,
    });

    console.log(`✅ Email thread created: ${created.subject}`);
  }

  // ========================================
  // 지식 테이블 정보 생성 (메타데이터만)
  // ========================================

  console.log('📊 Creating knowledge table metadata...');

  const knowledgeTables = [
    {
      name: 'LS_Metasol_MCCB',
      version: 'v1.0',
      data: [], // 실제 데이터는 CSV에서 로드
      checksum: 'placeholder_checksum_ls',
      active: true,
    },
    {
      name: 'Sangdo_MCCB',
      version: 'v1.0',
      data: [], // 실제 데이터는 CSV에서 로드
      checksum: 'placeholder_checksum_sangdo',
      active: true,
    },
  ];

  for (const table of knowledgeTables) {
    const created = await prisma.knowledgeTable.upsert({
      where: { name: table.name },
      update: { active: table.active },
      create: table,
    });

    console.log(`✅ Knowledge table metadata created: ${created.name}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });