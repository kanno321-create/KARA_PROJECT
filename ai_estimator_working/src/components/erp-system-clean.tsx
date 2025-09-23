import React, { useState, useCallback, useEffect } from "react";
import {
  Users, Package, TrendingUp, TrendingDown, DollarSign, CreditCard,
  Wallet, FileText, MessageCircle, Printer, File, ShoppingCart,
  Home, Edit, BarChart3, Archive, Send, Database, RefreshCw,
  Settings, HelpCircle, Menu, X, ChevronDown, ChevronRight,
  Search, Bell, User, LogOut, Calendar, Mail, Image, Plus
} from "lucide-react";
import { CalendarModule } from "./calendar-module";
import { EmailModule } from "./email-module";
import { DrawingsModule } from "./drawings-module";
import { SettingsModule } from "./settings-module";

// 상단 퀵 액세스 버튼 데이터
const quickAccessButtons = [
  { id: "customer", name: "거래처정보", icon: Users, color: "bg-blue-500" },
  { id: "inventory", name: "실시간재고", icon: Package, color: "bg-green-500" },
  { id: "sales-slip", name: "매출전표", icon: TrendingUp, color: "bg-emerald-500" },
  { id: "purchase-slip", name: "매입전표", icon: TrendingDown, color: "bg-red-500" },
  { id: "payment-slip", name: "지급전표", icon: CreditCard, color: "bg-purple-500" },
  { id: "collection-slip", name: "수금전표", icon: DollarSign, color: "bg-yellow-500" },
  { id: "expense", name: "입출금(경비)", icon: Wallet, color: "bg-indigo-500" },
  { id: "etax", name: "전자세금계산서", icon: FileText, color: "bg-pink-500" },
  { id: "sms", name: "문자발송", icon: MessageCircle, color: "bg-cyan-500" },
  { id: "fax", name: "팩스전송", icon: Printer, color: "bg-orange-500" },
  { id: "quote", name: "견적서", icon: File, color: "bg-teal-500" },
  { id: "purchase-order", name: "발주서발행", icon: ShoppingCart, color: "bg-rose-500" },
];

// 완전한 ERP 시스템 상태 관리
interface ERPState {
  tabs: Array<{
    id: string;
    type: 'calendar' | 'email' | 'drawings' | 'settings' | 'quote';
    title: string;
    data: any;
    lastModified: string;
  }>;
  activeTabId: string | null;
  nextTabId: number;
  settings: {
    defaults: {
      brand: string;
      form: string;
      location: string;
      mount: string;
    };
    rules: {
      singleBrand: boolean;
      antiPoleMistake: boolean;
      antiDeviceConfuse: boolean;
      antiInstallMismatch: boolean;
    };
    knowledgeVersion: {
      rules: string;
      tables: string;
      updated: string;
    };
  };
}

// 사이드바 메뉴 구조
const sidebarMenus = [
  {
    id: "dashboard",
    name: "대시보드",
    icon: Home,
    subItems: []
  },
  {
    id: "calendar",
    name: "일정관리",
    icon: Calendar,
    subItems: [
      { id: "calendar-view", name: "달력보기" },
      { id: "event-manage", name: "일정관리" },
      { id: "meeting-room", name: "회의실예약" },
      { id: "schedule-analysis", name: "일정분석" },
    ]
  },
  {
    id: "email",
    name: "이메일",
    icon: Mail,
    subItems: [
      { id: "email-compose", name: "메일작성" },
      { id: "email-inbox", name: "받은편지함" },
      { id: "email-sent", name: "보낸편지함" },
      { id: "email-groups", name: "그룹관리" },
      { id: "email-templates", name: "템플릿관리" },
    ]
  },
  {
    id: "drawings",
    name: "도면관리",
    icon: Image,
    subItems: [
      { id: "drawing-upload", name: "도면업로드" },
      { id: "drawing-library", name: "도면라이브러리" },
      { id: "drawing-versions", name: "버전관리" },
      { id: "drawing-approval", name: "승인관리" },
    ]
  },
  {
    id: "document",
    name: "전표작성",
    icon: Edit,
    subItems: [
      { id: "sales-doc", name: "매출전표" },
      { id: "purchase-doc", name: "매입전표" },
      { id: "payment-doc", name: "지급전표" },
      { id: "collection-doc", name: "수금전표" },
      { id: "general-doc", name: "일반전표" },
    ]
  },
  {
    id: "report",
    name: "보고서",
    icon: BarChart3,
    subItems: [
      { id: "daily-report", name: "일계표" },
      { id: "monthly-report", name: "월계표" },
      { id: "sales-ledger", name: "매출처원장" },
      { id: "purchase-ledger", name: "매입처원장" },
      { id: "financial-statement", name: "재무제표" },
    ]
  },
  {
    id: "receivables",
    name: "채권채무관리",
    icon: DollarSign,
    subItems: [
      { id: "receivables-manage", name: "미수금관리" },
      { id: "payables-manage", name: "미지급금관리" },
      { id: "receivables-status", name: "미수금현황" },
      { id: "payables-status", name: "미지급금현황" },
      { id: "collection-plan", name: "수금계획" },
      { id: "payment-plan", name: "지급계획" },
    ]
  },
  {
    id: "inventory",
    name: "재고관리",
    icon: Archive,
    subItems: [
      { id: "stock-status", name: "재고현황" },
      { id: "stock-in", name: "입고관리" },
      { id: "stock-out", name: "출고관리" },
      { id: "stock-move", name: "재고이동" },
      { id: "stock-check", name: "재고실사" },
    ]
  },
  {
    id: "etransfer",
    name: "전자전송",
    icon: Send,
    subItems: [
      { id: "etax-manage", name: "전자세금계산서" },
      { id: "email-send", name: "이메일발송" },
      { id: "sms-send", name: "문자발송" },
      { id: "fax-send", name: "팩스전송" },
    ]
  },
  {
    id: "basic",
    name: "기초자료",
    icon: Database,
    subItems: [
      { id: "customer-manage", name: "거래처관리" },
      { id: "product-manage", name: "상품관리" },
      { id: "account-manage", name: "계정과목" },
      { id: "employee-manage", name: "직원관리" },
    ]
  },
  {
    id: "carryover",
    name: "기초이월",
    icon: RefreshCw,
    subItems: [
      { id: "balance-carryover", name: "잔액이월" },
      { id: "document-carryover", name: "전표이월" },
      { id: "year-closing", name: "연도마감" },
    ]
  },
  {
    id: "settings",
    name: "환경설정",
    icon: Settings,
    subItems: [
      { id: "company-info", name: "회사정보" },
      { id: "user-manage", name: "사용자관리" },
      { id: "permission", name: "권한설정" },
      { id: "backup", name: "백업/복원" },
      { id: "system-defaults", name: "시스템기본값" },
      { id: "business-rules", name: "업무규칙" },
      { id: "knowledge-version", name: "지식베이스버전" },
    ]
  },
  {
    id: "guide",
    name: "사용가이드",
    icon: HelpCircle,
    subItems: []
  },
];

export function ERPSystem() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [selectedSubMenu, setSelectedSubMenu] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedQuickButton, setSelectedQuickButton] = useState<string | null>(null);

  // 완전한 ERP 상태 관리
  const [erpState, setErpState] = useState<ERPState>({
    tabs: [],
    activeTabId: null,
    nextTabId: 1,
    settings: {
      defaults: {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        location: 'INDOOR',
        mount: 'FLUSH'
      },
      rules: {
        singleBrand: true,
        antiPoleMistake: true,
        antiDeviceConfuse: true,
        antiInstallMismatch: true
      },
      knowledgeVersion: {
        rules: 'v1.0',
        tables: 'v1.0',
        updated: '2024-09-20'
      }
    }
  });

  // 로컬스토리지에서 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem('kis-erp-state');
    if (saved) {
      try {
        setErpState(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to restore ERP state:', e);
      }
    }
  }, []);

  // 상태 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('kis-erp-state', JSON.stringify(erpState));
  }, [erpState]);

  const expandedSidebarWidth = '14rem';
  const collapsedSidebarWidth = '4rem';
  const sidebarWidth = sidebarOpen ? expandedSidebarWidth : collapsedSidebarWidth;

  // 메뉴 확장/축소 토글
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

  // 새 탭 생성
  const createNewTab = useCallback((type: 'calendar' | 'email' | 'drawings' | 'settings' | 'quote', title: string) => {
    setErpState(prev => {
      const newTab = {
        id: `tab-${prev.nextTabId}`,
        type,
        title,
        data: {},
        lastModified: new Date().toISOString()
      };

      return {
        ...prev,
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
        nextTabId: prev.nextTabId + 1
      };
    });
  }, []);

  // 탭 닫기
  const closeTab = useCallback((tabId: string) => {
    setErpState(prev => {
      const newTabs = prev.tabs.filter(t => t.id !== tabId);
      const newActiveId = prev.activeTabId === tabId
        ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
        : prev.activeTabId;

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveId
      };
    });
  }, []);

  // 탭 활성화
  const activateTab = useCallback((tabId: string) => {
    setErpState(prev => ({
      ...prev,
      activeTabId: tabId
    }));
  }, []);

  // 탭 데이터 업데이트
  const updateTabData = useCallback((tabId: string, data: any) => {
    setErpState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, data, lastModified: new Date().toISOString() }
          : tab
      )
    }));
  }, []);

  // 메뉴 선택
  const handleMenuClick = useCallback((menuId: string, subMenuId?: string) => {
    setSelectedMenu(menuId);
    if (subMenuId) {
      setSelectedSubMenu(subMenuId);
    } else {
      setSelectedSubMenu(null);
    }
    setSelectedQuickButton(null);

    // 특정 메뉴 클릭시 바로 새 탭 생성
    if (!subMenuId) {
      switch (menuId) {
        case 'calendar':
          createNewTab('calendar', '일정관리');
          break;
        case 'email':
          createNewTab('email', '이메일관리');
          break;
        case 'drawings':
          createNewTab('drawings', '도면관리');
          break;
        case 'settings':
          createNewTab('settings', '시스템설정');
          break;
      }
    }
  }, [createNewTab]);

  // 퀵 액세스 버튼 클릭
  const handleQuickButtonClick = useCallback((buttonId: string) => {
    setSelectedQuickButton(buttonId);
    setSelectedMenu("");
    setSelectedSubMenu(null);
  }, []);

  // 콘텐츠 영역 렌더링
  const renderContent = () => {
    if (selectedQuickButton) {
      const button = quickAccessButtons.find(b => b.id === selectedQuickButton);
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{button?.name}</h2>
          <p className="text-lg text-gray-600">{button?.name} 화면입니다.</p>
        </div>
      );
    }

    if (selectedSubMenu) {
      const menu = sidebarMenus.find(m => m.id === selectedMenu);
      const subItem = menu?.subItems.find(s => s.id === selectedSubMenu);
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{subItem?.name}</h2>
          <p className="text-lg text-gray-600">{subItem?.name} 화면입니다.</p>
        </div>
      );
    }

    // 활성 탭이 있으면 탭 컨텐츠 렌더링
    if (erpState.activeTabId) {
      const activeTab = erpState.tabs.find(t => t.id === erpState.activeTabId);
      if (activeTab) {
        switch (activeTab.type) {
          case 'calendar':
            return (
              <CalendarModule
                tabData={activeTab.data}
                updateTabData={updateTabData}
                activeTabId={erpState.activeTabId!}
              />
            );
          case 'email':
            return (
              <EmailModule
                tabData={activeTab.data}
                updateTabData={updateTabData}
                activeTabId={erpState.activeTabId!}
              />
            );
          case 'drawings':
            return (
              <DrawingsModule
                tabData={activeTab.data}
                updateTabData={updateTabData}
                activeTabId={erpState.activeTabId!}
              />
            );
          case 'settings':
            return (
              <SettingsModule
                tabData={activeTab.data}
                updateTabData={updateTabData}
                activeTabId={erpState.activeTabId!}
                erpState={erpState}
                setErpState={setErpState}
              />
            );
          default:
            return renderDefaultContent();
        }
      }
    }

    if (selectedMenu === "calendar") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">일정관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => createNewTab('calendar', '새 캘린더')}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-400"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">새 캘린더 생성</h3>
                <p className="text-sm text-gray-500 mt-1">일정을 관리할 새 캘린더를 만듭니다</p>
              </div>
            </button>
            {erpState.tabs.filter(t => t.type === 'calendar').map(tab => (
              <button
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-gray-500">{new Date(tab.lastModified).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tab.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tab.data.events?.length || 0}개 일정
                </p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMenu === "email") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">이메일 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => createNewTab('email', '새 이메일')}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-green-400"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">새 이메일 작업</h3>
                <p className="text-sm text-gray-500 mt-1">이메일 작성 및 그룹 관리를 시작하세요</p>
              </div>
            </button>
            {erpState.tabs.filter(t => t.type === 'email').map(tab => (
              <button
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <Mail className="w-8 h-8 text-green-600" />
                  <span className="text-xs text-gray-500">{new Date(tab.lastModified).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tab.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tab.data.groups?.length || 0}개 그룹, {tab.data.emails?.length || 0}개 메일
                </p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMenu === "drawings") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">도면 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => createNewTab('drawings', '도면 라이브러리')}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-purple-400"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">새 도면 라이브러리</h3>
                <p className="text-sm text-gray-500 mt-1">도면 파일을 업로드하고 관리하세요</p>
              </div>
            </button>
            {erpState.tabs.filter(t => t.type === 'drawings').map(tab => (
              <button
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <Image className="w-8 h-8 text-purple-600" />
                  <span className="text-xs text-gray-500">{new Date(tab.lastModified).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tab.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tab.data.files?.length || 0}개 도면
                </p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMenu === "settings") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">시스템 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => createNewTab('settings', '시스템 설정')}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-orange-400"
            >
              <div className="text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">설정 관리</h3>
                <p className="text-sm text-gray-500 mt-1">시스템 기본값과 비즈니스 규칙을 설정하세요</p>
              </div>
            </button>
            {erpState.tabs.filter(t => t.type === 'settings').map(tab => (
              <button
                key={tab.id}
                onClick={() => activateTab(tab.id)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <Settings className="w-8 h-8 text-orange-600" />
                  <span className="text-xs text-gray-500">{new Date(tab.lastModified).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{tab.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  시스템 구성 및 규칙 관리
                </p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMenu === "dashboard") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">대시보드</h2>

          {/* 활성 탭 표시 */}
          {erpState.tabs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">활성 작업</h3>
              <div className="flex flex-wrap gap-2">
                {erpState.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => activateTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      tab.id === erpState.activeTabId
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.type === 'calendar' && <Calendar size={16} />}
                    {tab.type === 'email' && <Mail size={16} />}
                    {tab.type === 'drawings' && <Image size={16} />}
                    {tab.type === 'settings' && <Settings size={16} />}
                    <span className="text-sm">{tab.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="ml-1 hover:bg-red-100 rounded p-1"
                    >
                      <X size={12} />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">오늘 매출</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">₩15,234,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">오늘 매입</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">₩8,521,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">미수금</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">₩32,100,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">재고금액</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">₩125,400,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">활성 탭</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{erpState.tabs.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">총 일정</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {erpState.tabs.filter(t => t.type === 'calendar').reduce((acc, tab) => acc + (tab.data.events?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">이메일 그룹</h3>
              <p className="text-3xl font-bold text-cyan-600 mt-2">
                {erpState.tabs.filter(t => t.type === 'email').reduce((acc, tab) => acc + (tab.data.groups?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">도면 파일</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {erpState.tabs.filter(t => t.type === 'drawings').reduce((acc, tab) => acc + (tab.data.files?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedMenu === "guide") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">사용가이드</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">시작하기</h3>
              <p className="text-base text-gray-600">ERP 시스템 사용을 위한 기본 가이드입니다.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">전표 작성 방법</h3>
              <p className="text-base text-gray-600">매출, 매입, 지급, 수금 전표 작성 방법을 설명합니다.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">보고서 활용</h3>
              <p className="text-base text-gray-600">각종 보고서를 효과적으로 활용하는 방법입니다.</p>
            </div>
          </div>
        </div>
      );
    }

    const menu = sidebarMenus.find(m => m.id === selectedMenu);
    return renderDefaultContent();
  };

  const renderDefaultContent = () => {
    const menu = sidebarMenus.find(m => m.id === selectedMenu);
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{menu?.name}</h2>
        <p className="text-lg text-gray-600">{menu?.name} 메뉴를 선택하셨습니다. 하위 메뉴를 선택해주세요.</p>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      {/* 사이드바 */}
      <div
        className="bg-green-50 shadow-lg transition-all duration-300 flex-shrink-0 h-full overflow-hidden"
        style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 bg-green-600 border-b">
          <h1 className={`font-bold text-2xl text-gray-900 ${!sidebarOpen && 'hidden'} whitespace-nowrap`}>
            KIS ERP
          </h1>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen((prev) => !prev);
            }}
            className="p-2 rounded hover:bg-green-700 flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
          </button>
        </div>

        <nav className="p-3 space-y-2 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {sidebarMenus.map((menu) => (
            <div key={menu.id}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // When sidebar is collapsed, clicking should only select the menu, not expand submenus
                  if (!sidebarOpen) {
                    handleMenuClick(menu.id);
                  } else {
                    if (menu.subItems.length > 0) {
                      toggleMenuExpansion(menu.id);
                    } else {
                      handleMenuClick(menu.id);
                    }
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                  ${selectedMenu === menu.id ? 'bg-green-200 text-green-900' : 'hover:bg-green-100 text-gray-700'}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <menu.icon className="w-6 h-6 flex-shrink-0" />
                  {sidebarOpen && <span className="text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis">{menu.name}</span>}
                </div>
                {sidebarOpen && menu.subItems.length > 0 && (
                  expandedMenus.has(menu.id) ?
                    <ChevronDown className="w-6 h-6" /> :
                    <ChevronRight className="w-6 h-6" />
                )}
              </button>

              {/* 서브메뉴 */}
              {sidebarOpen && menu.subItems.length > 0 && expandedMenus.has(menu.id) && (
                <div className="ml-8 mt-1 space-y-1">
                  {menu.subItems.map((subItem) => (
                    <button
                      type="button"
                      key={subItem.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(menu.id, subItem.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-base transition-colors whitespace-nowrap overflow-hidden text-ellipsis
                        ${selectedSubMenu === subItem.id ? 'bg-green-200 text-green-900' : 'hover:bg-green-100 text-gray-700'}
                      `}
                    >
                      {subItem.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 헤더 */}
        <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg border-b">
          <div className="px-6 py-4">
            {/* 상단 퀵 액세스 버튼들 */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {quickAccessButtons.map((button) => {
                const Icon = button.icon;
                return (
                  <button
                    key={button.id}
                    onClick={() => handleQuickButtonClick(button.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium border border-gray-300
                      transition-all hover:shadow-lg hover:scale-105
                      ${selectedQuickButton === button.id
                        ? 'bg-white text-green-700 border-green-400'
                        : 'bg-white/90 text-gray-700 hover:bg-white'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="whitespace-nowrap">{button.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 사용자 정보 바 */}
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-base text-gray-700 font-medium">2025년 09월 24일</span>
              <span className="text-base text-gray-400">|</span>
              <span className="text-base font-semibold text-gray-800">한국산업(주)</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-200 rounded">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-medium text-gray-700">관리자</span>
              </div>
              <button className="p-2 hover:bg-gray-200 rounded">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}