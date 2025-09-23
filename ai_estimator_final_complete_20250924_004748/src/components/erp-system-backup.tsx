import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FileText,
  Package,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  BookOpen,
  Zap,
  Star,
  Clock,
  Home,
  Database,
  ArrowLeftRight,
  Printer,
  FolderOpen,
  HelpCircle,
  Filter,
  Grid3X3,
  List,
  X,
  Menu,
  Receipt,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  UserPlus,
  ShoppingBag,
  Briefcase,
  Moon,
  Sun,
  AlertTriangle,
  Shield,
  FileBarChart,
  Calculator,
  Banknote,
  ClipboardList,
  Mail,
  Archive,
  FileCheck,
  MessageCircle,
  Send,
  PieChart,
  LineChart
} from "lucide-react";
import { motion } from "motion/react";

// ERP 데이터 타입 정의
interface ERPFunction {
  id: string;
  name: string;
  category: string;
  icon?: React.ReactNode;
  description?: string;
  isGuide?: boolean;
  shortcut?: string;
}

// 사이드바 네비게이션 아이템
const sidebarItems = [
  {
    id: "dashboard",
    name: "대시보드",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "document",
    name: "전표작성",
    icon: <FileText className="w-5 h-5" />,
    subItems: [
      { id: "purchase", name: "매입전표", icon: <TrendingDown className="w-4 h-4" /> },
      { id: "sales", name: "매출전표", icon: <TrendingUp className="w-4 h-4" /> },
      { id: "collection", name: "수금전표", icon: <DollarSign className="w-4 h-4" /> },
      { id: "payment", name: "지급전표", icon: <CreditCard className="w-4 h-4" /> },
      { id: "inout", name: "입출금전표", icon: <Wallet className="w-4 h-4" /> },
      { id: "initial", name: "초립전표", icon: <FileText className="w-4 h-4" /> },
      { id: "expense", name: "경비등록", icon: <Receipt className="w-4 h-4" /> },
      { id: "price-customer", name: "거래처별 단가", icon: <Users className="w-4 h-4" /> },
      { id: "price-manage", name: "단가관리", icon: <DollarSign className="w-4 h-4" /> },
    ]
  },
  {
    id: "report",
    name: "보고서",
    icon: <BarChart3 className="w-5 h-5" />,
    subItems: [
      { id: "sales-statement", name: "매출명세서" },
      { id: "sales-by-customer", name: "거래처별 매출현황" },
      { id: "sales-ledger", name: "매출처원장" },
      { id: "purchase-ledger", name: "매입처원장" },
      { id: "daily-monthly", name: "일/월/일계표" },
      { id: "period-analysis", name: "기간별 통계분석" },
      { id: "profit-loss", name: "종합손익현황" },
      { id: "monthly-chart", name: "월별현황차트" },
      { id: "margin-customer", name: "거래처별마진표" },
      { id: "price-table", name: "단가표" },
    ]
  },
  {
    id: "inventory",
    name: "재고관리",
    icon: <Package className="w-5 h-5" />,
    subItems: [
      { id: "inventory-status", name: "재고현황" },
      { id: "inventory-adjust", name: "재고조정" },
      { id: "cost-recalc", name: "원가재계산" },
      { id: "inventory-move", name: "재고이동" },
    ]
  },
  {
    id: "electronic",
    name: "전자전송",
    icon: <Send className="w-5 h-5" />,
    subItems: [
      { id: "email-send", name: "이메일전송" },
      { id: "e-tax", name: "전자세금계산서" },
      { id: "sms-send", name: "문자발송" },
      { id: "fax-send", name: "팩스전송" },
    ]
  },
  {
    id: "cashflow",
    name: "자금순환",
    icon: <DollarSign className="w-5 h-5" />,
    subItems: [
      { id: "receivable-status", name: "미수금현황", icon: <TrendingUp className="w-4 h-4" /> },
      { id: "payable-status", name: "미지급금현황", icon: <TrendingDown className="w-4 h-4" /> },
      { id: "period-receivable", name: "기간별 미수금", icon: <BarChart3 className="w-4 h-4" /> },
      { id: "risk-companies", name: "위험업체리스트", icon: <AlertTriangle className="w-4 h-4" /> },
      { id: "receivable-payable-summary", name: "미수미지급집계표", icon: <FileText className="w-4 h-4" /> },
      { id: "credit-inquiry", name: "신용정보사 의뢰", icon: <Shield className="w-4 h-4" /> },
    ]
  },
  {
    id: "basic-data",
    name: "기초자료",
    icon: <Database className="w-5 h-5" />,
    subItems: [
      { id: "company-info", name: "자사정보등록", icon: <Building2 className="w-4 h-4" /> },
      { id: "department-staff", name: "부서별사원등록", icon: <UserPlus className="w-4 h-4" /> },
      { id: "product-register", name: "상품등록", icon: <Package className="w-4 h-4" /> },
      { id: "customer-register", name: "거래처등록", icon: <Users className="w-4 h-4" /> },
      { id: "credit-card", name: "신용카드등록", icon: <CreditCard className="w-4 h-4" /> },
      { id: "payment-items", name: "입출금항목등록", icon: <Wallet className="w-4 h-4" /> },
      { id: "bank-account", name: "자사은행계좌등록", icon: <Briefcase className="w-4 h-4" /> },
    ]
  },
  {
    id: "carryover",
    name: "기초이월",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    subItems: [
      { id: "inventory-carryover", name: "상품재고이월" },
      { id: "receivable-payable", name: "미수미지급금이월" },
      { id: "bank-balance", name: "은행잔고이월" },
      { id: "note-carryover", name: "어음이월" },
      { id: "bond-debt", name: "채권채무이월" },
      { id: "cash-balance", name: "현금잔고이월" },
    ]
  },
  {
    id: "settings",
    name: "환경설정",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "guide",
    name: "사용가이드",
    icon: <BookOpen className="w-5 h-5" />,
  },
];

// 상단 빠른 접근 탭들 (자주 사용하는 기능)
const quickAccessTabs = [
  // 거래처정보, 실시간재고
  { id: "customer-info", name: "거래처정보", icon: <Users className="w-4 h-4" />, menuId: "basic-data", subMenuId: "customer-register" },
  { id: "realtime-inventory", name: "실시간재고", icon: <Package className="w-4 h-4" />, menuId: "inventory", subMenuId: "inventory-status" },

  // 매출전표, 매입전표, 지급전표, 수금전표, 입출금(경비)
  { id: "sales-doc", name: "매출전표", icon: <TrendingUp className="w-4 h-4" />, menuId: "document", subMenuId: "sales" },
  { id: "purchase-doc", name: "매입전표", icon: <TrendingDown className="w-4 h-4" />, menuId: "document", subMenuId: "purchase" },
  { id: "payment-doc", name: "지급전표", icon: <CreditCard className="w-4 h-4" />, menuId: "document", subMenuId: "payment" },
  { id: "collection-doc", name: "수금전표", icon: <DollarSign className="w-4 h-4" />, menuId: "document", subMenuId: "collection" },
  { id: "expense-doc", name: "입출금(경비)", icon: <Wallet className="w-4 h-4" />, menuId: "document", subMenuId: "expense" },

  // 전자세금계산서, 문자발송, 팩스전송
  { id: "e-tax-invoice", name: "전자세금계산서", icon: <FileCheck className="w-4 h-4" />, menuId: "electronic", subMenuId: "e-tax" },
  { id: "sms-send", name: "문자발송", icon: <Mail className="w-4 h-4" />, menuId: "electronic", subMenuId: "sms" },
  { id: "fax-send", name: "팩스전송", icon: <Printer className="w-4 h-4" />, menuId: "electronic", subMenuId: "fax" },

  // 견적서
  { id: "quotation", name: "견적서", icon: <FileText className="w-4 h-4" />, menuId: "document", subMenuId: "quotation" },

  // 발주서발행
  { id: "purchase-order", name: "발주서발행", icon: <ClipboardList className="w-4 h-4" />, menuId: "document", subMenuId: "purchase-order" },
];

// 가이드 항목들
const guideItems = [
  { id: "guide-1", name: "전표를 수정/삭제하는 방법", description: "작성된 전표를 수정하거나 삭제하는 방법을 안내합니다." },
  { id: "guide-2", name: "반품 처리하는 방법", description: "판매한 상품의 반품 처리 절차를 설명합니다." },
  { id: "guide-3", name: "전표 항목 초기화 방법", description: "전표 작성 화면의 입력 항목을 초기 상태로 되돌리는 방법입니다." },
  { id: "guide-4", name: "미수금 및 미지급금 조회 방법", description: "거래처별 미수금과 미지급금 현황을 조회하는 방법을 안내합니다." },
  { id: "guide-5", name: "명세서 위치 초기화 방법", description: "명세서 출력 시 인쇄 위치가 틀어진 경우 초기화하는 방법입니다." },
  { id: "guide-6", name: "세사업장 구성(초기)방법", description: "여러 사업장을 운영하는 경우 초기 설정 방법을 안내합니다." },
  { id: "guide-7", name: "자료의 백업과 복원방법", description: "중요한 데이터를 안전하게 백업하고 복원하는 방법을 설명합니다." },
  { id: "guide-8", name: "피시 변경(데이터 이전) 방법", description: "컴퓨터를 교체할 때 데이터를 안전하게 이전하는 방법입니다." },
];

// ERP System Component
export function ERPSystem() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [selectedSubMenu, setSelectedSubMenu] = useState<string | null>(null);
  const [selectedQuickTab, setSelectedQuickTab] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["document"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toggle sidebar menu expansion
  const toggleMenuExpansion = useCallback((menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  }, []);

  // Handle menu selection
  const handleMenuClick = useCallback((menuId: string, subItemId?: string) => {
    console.log('Menu clicked:', menuId, subItemId); // 디버깅용
    setSelectedMenu(menuId);
    if (subItemId) {
      setSelectedSubMenu(subItemId);
    } else {
      setSelectedSubMenu(null);
    }
    setSelectedQuickTab(null); // Clear quick tab selection
  }, []);

  // Handle quick tab click
  const handleQuickTabClick = useCallback((tab: typeof quickAccessTabs[0]) => {
    console.log('Quick tab clicked:', tab.id); // 디버깅용
    setSelectedQuickTab(tab.id);
    setSelectedMenu(tab.menuId);
    setSelectedSubMenu(tab.subMenuId);
  }, []);

  // AI 도우미 기능 제거됨

  // Render main content based on selection
  const renderMainContent = () => {
    if (selectedMenu === "dashboard") {
      return <DashboardContent />;
    } else if (selectedMenu === "guide") {
      return <GuideContent items={guideItems} />;
    } else if (selectedSubMenu) {
      return <ContentView menuId={selectedMenu} subMenuId={selectedSubMenu} />;
    } else {
      return <CategoryOverview categoryId={selectedMenu} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 테스트 버튼 */}
      <button
        onClick={() => alert('클릭됨!')}
        style={{position: 'fixed', top: '10px', right: '10px', zIndex: 9999, backgroundColor: 'red', color: 'white', padding: '10px'}}
      >
        테스트 클릭
      </button>
      {/* 상단 헤더 영역 */}
      <div className="bg-white border-b border-gray-200">
        {/* 로고 및 검색 영역 */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">KIS ERP 시스템</h1>
            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">v2.0</span>
          </div>

          {/* 검색창 */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="검색... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-gray-50 text-gray-700 rounded-md
                       border border-gray-300 focus:outline-none focus:border-blue-500
                       placeholder:text-gray-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              K
            </div>
          </div>
        </div>

        {/* 상단 빠른 접근 탭 */}
        <div className="px-4 py-2 bg-white">
          <div className="flex gap-1">
            {quickAccessTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleQuickTabClick(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-2
                  ${selectedQuickTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 */}
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? 60 : 240 }}
          className="bg-white border-r border-gray-200 flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
            {!sidebarCollapsed && (
              <span className="font-semibold text-gray-700 text-sm">메뉴</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {sidebarItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      handleMenuClick(item.id);
                      if (item.subItems) {
                        toggleMenuExpansion(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                      ${selectedMenu === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                        {item.subItems && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedMenus.has(item.id) ? '' : '-rotate-90'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Sub Items */}
                  {!sidebarCollapsed && item.subItems && expandedMenus.has(item.id) && (
                    <div
                      className="ml-4 mt-1 space-y-0.5"
                    >
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(item.id, subItem.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                            ${selectedSubMenu === subItem.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          {subItem.icon || <ChevronRight className="w-3 h-3" />}
                          <span>{subItem.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4">
            {!sidebarCollapsed && (
              <div className="text-xs text-gray-500">
                <div>Version 2.0.0</div>
                <div>© 2024 KIS</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 메인 콘텐츠 영역 - 연회색 배경 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}

// Dashboard Component - Simplified version
function DashboardContent() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">대시보드</h2>
      <p>테스트 중입니다.</p>
    </div>
  );
}

                strokeLinecap="round"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#EF4444"
                strokeWidth="20"
                strokeDasharray="188.5 314.16"
                strokeDashoffset="-188.5"
                transform="rotate(-90 100 100)"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold text-gray-800">60:40</div>
                <div className="text-xs text-gray-500">매출:매입</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">매출 245.3M</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">매입 180.2M</span>
            </div>
          </div>
        </div>

        {/* 미수금 확인 선형그래프 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">미수금 추이</h3>
          <div className="flex justify-center">
            <svg viewBox="0 0 360 180" className="w-48 h-24">
              {/* 그리드 라인 */}
              <line x1="30" y1="20" x2="30" y2="160" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="30" y1="160" x2="340" y2="160" stroke="#E5E7EB" strokeWidth="1" />
              {[0, 45, 90, 135].map((y, i) => (
                <line key={i} x1="25" y1={160 - y} x2="340" y2={160 - y} stroke="#F3F4F6" strokeWidth="1" />
              ))}

              {/* 데이터 라인 */}
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={receivableData.map((d, i) =>
                  `${30 + (i * 35)},${160 - (d.amount / 60) * 140}`
                ).join(' ')}
              />

              {/* 데이터 포인트 */}
              {receivableData.map((d, i) => (
                <circle
                  key={i}
                  cx={30 + (i * 35)}
                  cy={160 - (d.amount / 60) * 140}
                  r="3"
                  fill="#F59E0B"
                />
              ))}

              {/* X축 레이블 */}
              {receivableData.map((d, i) => (
                <text
                  key={i}
                  x={30 + (i * 35)}
                  y="175"
                  textAnchor="middle"
                  className="fill-gray-500 text-xs"
                >
                  {d.month}
                </text>
              ))}
            </svg>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-600">현재: ₩32.1M</span>
            <span className="text-xs text-orange-600 font-medium">-2.1%</span>
          </div>
        </div>

        {/* 월별 매입매출 그래프 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">월별 매입매출</h3>
          <div className="flex justify-center">
            <svg viewBox="0 0 360 180" className="w-48 h-24">
              {/* 그리드 라인 */}
              <line x1="30" y1="20" x2="30" y2="160" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="30" y1="160" x2="340" y2="160" stroke="#E5E7EB" strokeWidth="1" />

              {/* 바 그래프 */}
              {monthlyData.slice(-7).map((d, i) => (
                <g key={i}>
                  {/* 매출 바 */}
                  <rect
                    x={40 + (i * 45)}
                    y={160 - (d.sales / 350) * 140}
                    width="15"
                    height={(d.sales / 350) * 140}
                    fill="#10B981"
                    rx="2"
                  />
                  {/* 매입 바 */}
                  <rect
                    x={55 + (i * 45)}
                    y={160 - (d.purchase / 350) * 140}
                    width="15"
                    height={(d.purchase / 350) * 140}
                    fill="#EF4444"
                    rx="2"
                  />
                  {/* 월 레이블 */}
                  <text
                    x={55 + (i * 45)}
                    y="175"
                    textAnchor="middle"
                    className="fill-gray-500 text-xs"
                  >
                    {d.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">매출</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">매입</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-green-600">+12.5%</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">₩245,300,000</div>
          <div className="text-sm text-gray-500 mt-1">이번 달 매출</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600">+8.3%</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">1,234</div>
          <div className="text-sm text-gray-500 mt-1">재고 항목</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-green-600">+5</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">342</div>
          <div className="text-sm text-gray-500 mt-1">거래처</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs text-red-600">-2.1%</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">₩32,100,000</div>
          <div className="text-sm text-gray-500 mt-1">미수금</div>
        </div>
      </div>

      {/* 중요 정보 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 미수금 현황 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">미수금 현황 TOP 10</h3>
            <span className="text-sm text-orange-600 font-medium">총 ₩32,100,000</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-medium text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">업체명</th>
                  <th className="px-4 py-2 text-left">연락처</th>
                  <th className="px-4 py-2 text-right">미수금액</th>
                  <th className="px-4 py-2 text-center">출고일</th>
                  <th className="px-4 py-2 text-center">경과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { company: '삼성전자', phone: '02-1234-5678', amount: 5200000, date: '2024-08-15', days: 35 },
                  { company: '현대건설', phone: '031-9876-5432', amount: 4800000, date: '2024-08-20', days: 30 },
                  { company: 'LG화학', phone: '02-3456-7890', amount: 3500000, date: '2024-08-25', days: 25 },
                  { company: 'SK네트웍스', phone: '02-6789-0123', amount: 3200000, date: '2024-08-28', days: 22 },
                  { company: '한화시스템', phone: '031-2345-6789', amount: 2800000, date: '2024-09-02', days: 18 },
                  { company: '롯데케미칼', phone: '02-8901-2345', amount: 2600000, date: '2024-09-05', days: 15 },
                  { company: '포스코건설', phone: '054-290-1234', amount: 2400000, date: '2024-09-08', days: 12 },
                  { company: 'GS건설', phone: '02-3456-1234', amount: 2200000, date: '2024-09-10', days: 10 },
                  { company: '대림산업', phone: '02-5678-9012', amount: 1800000, date: '2024-09-12', days: 8 },
                  { company: '두산중공업', phone: '055-280-1234', amount: 1600000, date: '2024-09-15', days: 5 },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-2 font-medium text-gray-800">{item.company}</td>
                    <td className="px-4 py-2 text-gray-600">{item.phone}</td>
                    <td className="px-4 py-2 text-right font-medium">₩{item.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{item.date}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.days > 30 ? 'bg-red-100 text-red-600' :
                        item.days > 15 ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {item.days}일
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오늘의 할 일 & 알림 */}
        <div className="space-y-6">
          {/* 오늘의 할 일 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">오늘의 할 일</h3>
            <div className="space-y-2">
              {[
                { task: '세금계산서 발행 마감', time: '17:00', urgent: true },
                { task: '월말 재고 실사', time: '14:00', urgent: false },
                { task: '거래처 대금 지급 (5건)', time: '16:00', urgent: true },
                { task: '분기 세금 신고 준비', time: '오전', urgent: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.urgent ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm text-gray-700">{item.task}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 빠른 실행 - 크기 축소 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">빠른 실행</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "매출전표", icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600" },
                { name: "매입전표", icon: <TrendingDown className="w-4 h-4" />, color: "text-red-600" },
                { name: "재고조회", icon: <Package className="w-4 h-4" />, color: "text-blue-600" },
                { name: "거래처", icon: <Users className="w-4 h-4" />, color: "text-purple-600" },
                { name: "일계표", icon: <BarChart3 className="w-4 h-4" />, color: "text-orange-600" },
                { name: "미수금", icon: <DollarSign className="w-4 h-4" />, color: "text-pink-600" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200
                           hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 재고 부족 알림 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">재고 부족 알림</h3>
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">5건</span>
          </div>
          <div className="space-y-2">
            {[
              { product: 'A4 용지', current: 2, min: 10, unit: '박스' },
              { product: '토너 카트리지', current: 1, min: 5, unit: '개' },
              { product: '사무용 볼펜', current: 12, min: 50, unit: '개' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{item.product}</span>
                <span className="text-red-600 font-medium">
                  {item.current}/{item.min} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 매출/매입 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">오늘의 실적</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">매출</span>
              <span className="text-lg font-bold text-green-600">₩15,230,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">매입</span>
              <span className="text-lg font-bold text-red-600">₩8,540,000</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">순이익</span>
                <span className="text-lg font-bold text-blue-600">₩6,690,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">최근 활동</h3>
          <div className="space-y-2">
            {[
              { action: '매출전표 #1005', time: '2분 전', amount: '₩1,250,000' },
              { action: '거래처 등록', time: '15분 전', amount: '삼성전기' },
              { action: '재고 입고', time: '1시간 전', amount: '100개' },
              { action: '세금계산서', time: '2시간 전', amount: '₩3,450,000' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">{item.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{item.time}</span>
                  <span className="text-gray-800 font-medium text-xs">{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Guide Content Component
function GuideContent({ items }: { items: typeof guideItems }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">사용 가이드</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 4 }}
              className="p-4 rounded-lg bg-gray-50 border border-gray-200
                       hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400
                                       opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Category Overview Component
function CategoryOverview({ categoryId }: { categoryId: string }) {
  const category = sidebarItems.find(item => item.id === categoryId);

  if (!category || !category.subItems) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {category?.name}
          </h3>
          <p className="text-gray-600">
            이 섹션의 기능을 준비 중입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{category.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.subItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-lg p-6 border border-gray-200
                     hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              {item.icon || <FileText className="w-5 h-5 text-gray-600" />}
              <h3 className="font-medium text-gray-800">{item.name}</h3>
            </div>
            <p className="text-sm text-gray-600">
              클릭하여 {item.name} 화면으로 이동
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Content View Component (for individual functions)
function ContentView({ menuId, subMenuId }: { menuId: string; subMenuId: string }) {
  const menu = sidebarItems.find(item => item.id === menuId);
  const subMenu = menu?.subItems?.find(item => item.id === subMenuId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex items-center gap-4 mb-6">
        {subMenu?.icon || <FileText className="w-6 h-6 text-gray-600" />}
        <h2 className="text-xl font-semibold text-gray-800">
          {subMenu?.name || "콘텐츠"}
        </h2>
      </div>

      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {subMenu?.icon || <FileText className="w-12 h-12 text-gray-400" />}
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {subMenu?.name} 화면
        </h3>
        <p className="text-gray-600 mb-6">
          이곳에 {subMenu?.name} 관련 기능이 표시됩니다
        </p>
        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          시작하기
        </button>
      </div>
    </div>
  );
}

// Bell icon component
function Bell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}