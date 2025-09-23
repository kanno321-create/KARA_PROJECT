import React, { useState, useCallback, useEffect } from "react";
import {
  Users, Package, TrendingUp, TrendingDown, DollarSign, CreditCard,
  Wallet, FileText, MessageCircle, Printer, File, ShoppingCart,
  Home, Edit, BarChart3, Archive, Send, Database, RefreshCw,
  Settings, HelpCircle, Menu, X, ChevronDown, ChevronRight,
  Search, Bell, User, LogOut, Calendar, Mail, Image, Sliders,
  Plus, Filter, Download, Upload, Eye, CheckCircle, AlertCircle,
  Clock, Users2, Building2, MapPin, Phone, Tag, Star, Trash2,
  Copy, Share, ExternalLink, Calendar as CalendarIcon, ChevronLeft,
  Save, RotateCcw, PlusCircle, MinusCircle, Grid, List, SortAsc, SortDesc
} from "lucide-react";

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

  // 메뉴 선택
  const handleMenuClick = useCallback((menuId: string, subMenuId?: string) => {
    setSelectedMenu(menuId);
    if (subMenuId) {
      setSelectedSubMenu(subMenuId);
    } else {
      setSelectedSubMenu(null);
    }
    setSelectedQuickButton(null);
  }, []);

  // 퀵 액세스 버튼 클릭
  const handleQuickButtonClick = useCallback((buttonId: string) => {
    setSelectedQuickButton(buttonId);
    setSelectedMenu("");
    setSelectedSubMenu(null);
  }, []);

  // 새 탭 생성
  const createNewTab = useCallback((type: 'calendar' | 'email' | 'drawings' | 'settings' | 'quote', title: string) => {
    const newTab = {
      id: `tab-${erpState.nextTabId}`,
      type,
      title,
      data: {},
      lastModified: new Date().toISOString()
    };

    setErpState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
      nextTabId: prev.nextTabId + 1
    }));
  }, [erpState.nextTabId]);

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

  // Calendar 모듈 렌더링
  const renderCalendarModule = (tabData: any) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [events, setEvents] = useState(tabData.events || []);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [eventFilter, setEventFilter] = useState('');

    const addEvent = (event: any) => {
      const newEvent = {
        ...event,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      const newEvents = [...events, newEvent];
      setEvents(newEvents);
      updateTabData(erpState.activeTabId!, { events: newEvents });
    };

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Calendar Header */}
        <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">일정 관리</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  월간보기
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  주간보기
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="일정 검색..."
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                새 일정
              </button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-xl font-semibold text-gray-800">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">총 {events.length}개 일정</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">활성</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-1 h-full">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                <div key={day} className={`p-3 text-center font-semibold ${
                  idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {day}
                </div>
              ))}

              {/* 날짜 셀들 */}
              {Array.from({ length: 42 }, (_, i) => {
                const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6);
                const dayEvents = events.filter((event: any) => {
                  const eventDate = new Date(event.date);
                  return eventDate.toDateString() === cellDate.toDateString();
                });

                return (
                  <div key={i} className={`border border-gray-200 p-2 min-h-[80px] ${
                    cellDate.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  }`}>
                    <div className="font-medium text-sm mb-1">{cellDate.getDate()}</div>
                    {dayEvents.slice(0, 2).map((event: any) => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="text-xs p-1 mb-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 truncate"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2}개 더</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {/* 주간 보기 */}
              <div className="grid grid-cols-8 gap-2">
                <div className="font-semibold text-gray-700">시간</div>
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="font-semibold text-center text-gray-700">{day}</div>
                ))}
              </div>

              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="grid grid-cols-8 gap-2 border-t border-gray-100">
                  <div className="text-sm text-gray-500 p-2">{hour}:00</div>
                  {Array.from({ length: 7 }, (_, day) => (
                    <div key={day} className="min-h-[40px] border border-gray-100 p-1 bg-white">
                      {/* 해당 시간대 이벤트 표시 */}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h3 className="text-lg font-semibold mb-4">새 일정 추가</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                addEvent({
                  title: formData.get('title'),
                  date: formData.get('date'),
                  time: formData.get('time'),
                  description: formData.get('description'),
                  priority: formData.get('priority')
                });
                setShowEventForm(false);
              }}>
                <div className="space-y-4">
                  <input
                    name="title"
                    type="text"
                    placeholder="일정 제목"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    name="date"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    name="time"
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">일반</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                  <textarea
                    name="description"
                    placeholder="일정 설명"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{selectedEvent.date}</span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} />
                    <span>{selectedEvent.time}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="text-gray-700">
                    <p className="font-medium mb-1">설명:</p>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEvent.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedEvent.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedEvent.priority === 'urgent' ? '긴급' :
                     selectedEvent.priority === 'high' ? '높음' : '일반'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            return renderCalendarModule(activeTab.data);
          case 'email':
            return renderEmailModule(activeTab.data);
          case 'drawings':
            return renderDrawingsModule(activeTab.data);
          case 'settings':
            return renderSettingsModule(activeTab.data);
          default:
            return renderDefaultContent();
        }
      }
    }

    if (selectedMenu === "calendar") {
      if (selectedSubMenu === "calendar-view") {
        createNewTab('calendar', '캘린더');
        return null;
      }
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

  // Email 모듈 렌더링
  const renderEmailModule = (tabData: any) => {
    const [groups, setGroups] = useState(tabData.groups || []);
    const [emails, setEmails] = useState(tabData.emails || []);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [currentView, setCurrentView] = useState<'inbox' | 'sent' | 'compose' | 'groups'>('groups');
    const [emailFilter, setEmailFilter] = useState('');

    const addGroup = (group: any) => {
      const newGroup = {
        ...group,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        memberCount: group.members?.length || 0
      };
      const newGroups = [...groups, newGroup];
      setGroups(newGroups);
      updateTabData(erpState.activeTabId!, { groups: newGroups, emails });
    };

    const addEmail = (email: any) => {
      const newEmail = {
        ...email,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      const newEmails = [...emails, newEmail];
      setEmails(newEmails);
      updateTabData(erpState.activeTabId!, { groups, emails: newEmails });
    };

    const getGroupByDomain = (email: string) => {
      const domain = email.split('@')[1];
      return groups.find(g => g.domain === domain);
    };

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Email Header */}
        <div className="border-b p-4 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">이메일 관리</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('groups')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'groups' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  그룹관리
                </button>
                <button
                  onClick={() => setCurrentView('compose')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'compose' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  메일작성
                </button>
                <button
                  onClick={() => setCurrentView('sent')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'sent' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  보낸편지함
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="이메일 검색..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {currentView === 'groups' && (
                <button
                  onClick={() => setShowGroupForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={16} />
                  새 그룹
                </button>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users2 size={16} />
              <span>총 {groups.length}개 그룹</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <span>총 {emails.length}개 메일</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>활성 상태</span>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 p-4 overflow-auto">
          {currentView === 'groups' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group: any) => (
                  <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        {group.memberCount}명
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{group.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{group.description || '설명 없음'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>마지막 사용: {new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setSelectedGroup(group.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        멤버 보기
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        편집
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Group Card */}
                <button
                  onClick={() => setShowGroupForm(true)}
                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 hover:bg-green-50 transition-colors text-center"
                >
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">새 그룹 추가</h3>
                  <p className="text-sm text-gray-500 mt-1">도메인별로 이메일 그룹을 관리하세요</p>
                </button>
              </div>
            </div>
          )}

          {currentView === 'compose' && (
            <div className="max-w-4xl mx-auto">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                addEmail({
                  to: formData.get('to'),
                  subject: formData.get('subject'),
                  content: formData.get('content'),
                  group: getGroupByDomain(formData.get('to') as string)?.name || '미분류'
                });
                (e.target as HTMLFormElement).reset();
              }}>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">받는 사람</label>
                    <input
                      name="to"
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <input
                      name="subject"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="메일 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                    <textarea
                      name="content"
                      required
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="메일 내용을 입력하세요"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Upload size={16} />
                        첨부파일
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Save size={16} />
                        임시저장
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send size={16} />
                      보내기
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {currentView === 'sent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">보낸 메일 ({emails.length}개)</h3>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <Filter size={16} />
                    필터
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <Download size={16} />
                    내보내기
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg divide-y">
                {emails.map((email: any) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-800">{email.to}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {email.group}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(email.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">{email.subject}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{email.content}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                        <Eye size={14} />
                        보기
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                        <Copy size={14} />
                        복사
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                        <Share size={14} />
                        공유
                      </button>
                    </div>
                  </div>
                ))}
                {emails.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>보낸 메일이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Group Form Modal */}
        {showGroupForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h3 className="text-lg font-semibold mb-4">새 그룹 추가</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                addGroup({
                  name: formData.get('name'),
                  domain: formData.get('domain'),
                  description: formData.get('description'),
                  members: []
                });
                setShowGroupForm(false);
              }}>
                <div className="space-y-4">
                  <input
                    name="name"
                    type="text"
                    placeholder="그룹 이름"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    name="domain"
                    type="text"
                    placeholder="도메인 (예: company.com)"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <textarea
                    name="description"
                    placeholder="그룹 설명"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowGroupForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Group Members Modal */}
        {selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">그룹 멤버</h3>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {/* 그룹 멤버 목록 */}
                <div className="text-center text-gray-500 py-8">
                  <Users2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 멤버가 없습니다.</p>
                  <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    멤버 추가
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Drawings 모듈 렌더링
  const renderDrawingsModule = (tabData: any) => {
    const [files, setFiles] = useState(tabData.files || []);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'version'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showUpload, setShowUpload] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);

    const addFile = (file: any) => {
      const newFile = {
        ...file,
        id: Date.now().toString(),
        uploadedAt: new Date().toISOString(),
        version: '1.0',
        status: 'active',
        downloadCount: 0,
        lastViewed: null
      };
      const newFiles = [...files, newFile];
      setFiles(newFiles);
      updateTabData(erpState.activeTabId!, { files: newFiles });
    };

    const updateFileStatus = (fileId: string, status: 'active' | 'archived' | 'approved' | 'rejected') => {
      const newFiles = files.map((f: any) =>
        f.id === fileId
          ? { ...f, status, lastModified: new Date().toISOString() }
          : f
      );
      setFiles(newFiles);
      updateTabData(erpState.activeTabId!, { files: newFiles });
    };

    const filteredFiles = files.filter((file: any) =>
      file.name.toLowerCase().includes(filter.toLowerCase()) ||
      file.category?.toLowerCase().includes(filter.toLowerCase()) ||
      file.tags?.some((tag: string) => tag.toLowerCase().includes(filter.toLowerCase()))
    );

    const sortedFiles = [...filteredFiles].sort((a: any, b: any) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.uploadedAt).getTime();
          bVal = new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case 'version':
          aVal = parseFloat(a.version || '1.0');
          bVal = parseFloat(b.version || '1.0');
          break;
        default:
          aVal = a.uploadedAt;
          bVal = b.uploadedAt;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    const getFileIcon = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf':
          return <FileText className="w-8 h-8 text-red-600" />;
        case 'dwg':
        case 'dxf':
        case 'autocad':
          return <Image className="w-8 h-8 text-blue-600" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return <Image className="w-8 h-8 text-green-600" />;
        default:
          return <File className="w-8 h-8 text-gray-600" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        case 'archived':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-blue-100 text-blue-800';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'approved':
          return '승인됨';
        case 'rejected':
          return '반려됨';
        case 'archived':
          return '보관중';
        default:
          return '활성';
      }
    };

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Drawings Header */}
        <div className="border-b p-4 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">도면 관리</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="도면 검색..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="date-desc">최신순</option>
                <option value="date-asc">오래된순</option>
                <option value="name-asc">이름순</option>
                <option value="name-desc">이름 역순</option>
                <option value="size-desc">크기 큰순</option>
                <option value="size-asc">크기 작은순</option>
                <option value="version-desc">버전 높은순</option>
              </select>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload size={16} />
                도면 업로드
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Image size={16} />
              <span>총 {files.length}개 파일</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{files.filter((f: any) => f.status === 'approved').length}개 승인</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{files.filter((f: any) => f.status === 'active').length}개 대기</span>
            </div>
            <div className="flex items-center gap-2">
              <Archive size={16} />
              <span>{files.filter((f: any) => f.status === 'archived').length}개 보관</span>
            </div>
          </div>
        </div>

        {/* Drawings Content */}
        <div className="flex-1 p-4 overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedFiles.map((file: any) => (
                <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name)}
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(file.status)}`}>
                        {getStatusText(file.status)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Eye size={14} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Download size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2" title={file.name}>
                    {file.name}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>버전:</span>
                      <span className="font-medium">{file.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>크기:</span>
                      <span>{file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>업로드:</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {file.tags && file.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {file.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {file.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{file.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {file.status === 'active' && (
                      <>
                        <button
                          onClick={() => updateFileStatus(file.id, 'approved')}
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => updateFileStatus(file.id, 'rejected')}
                          className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          반려
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => updateFileStatus(file.id, 'archived')}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors"
                    >
                      보관
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload Card */}
              <button
                onClick={() => setShowUpload(true)}
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-colors text-center min-h-[200px] flex flex-col items-center justify-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">도면 업로드</h3>
                <p className="text-sm text-gray-500 mt-1">새 도면 파일을 추가하세요</p>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">파일명</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">버전</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">크기</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">업로드일</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedFiles.map((file: any) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.name)}
                          <div>
                            <div className="font-medium text-gray-900">{file.name}</div>
                            {file.description && (
                              <div className="text-sm text-gray-500">{file.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(file.status)}`}>
                          {getStatusText(file.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{file.version}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedFile(file)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            <Download size={16} />
                          </button>
                          {file.status === 'active' && (
                            <>
                              <button
                                onClick={() => updateFileStatus(file.id, 'approved')}
                                className="p-1 hover:bg-green-100 text-green-600 rounded transition-colors"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => updateFileStatus(file.id, 'rejected')}
                                className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => updateFileStatus(file.id, 'archived')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedFiles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>도면 파일이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px] max-w-full">
              <h3 className="text-lg font-semibold mb-4">도면 업로드</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                addFile({
                  name: formData.get('name'),
                  category: formData.get('category'),
                  description: formData.get('description'),
                  tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
                  size: Math.floor(Math.random() * 10000000) + 1000000 // 시뮬레이션
                });
                setShowUpload(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">파일명</label>
                    <input
                      name="name"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="도면 파일명.dwg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                    <select
                      name="category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">카테고리 선택</option>
                      <option value="floor-plan">평면도</option>
                      <option value="elevation">입면도</option>
                      <option value="section">단면도</option>
                      <option value="detail">상세도</option>
                      <option value="electrical">전기도면</option>
                      <option value="mechanical">기계도면</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="도면에 대한 설명을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">태그 (쉼표로 구분)</label>
                    <input
                      name="tags"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="건축, 전기, 기계, 내부도면"
                    />
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">파일을 드래그하거나 클릭하여 업로드하세요</p>
                    <p className="text-xs text-gray-500 mt-1">지원 형식: DWG, DXF, PDF, JPG, PNG (10MB 이하)</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    업로드
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* File Detail Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[700px] max-w-full max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">도면 상세 정보</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{selectedFile.name}</h4>
                    <p className="text-gray-600">{selectedFile.description || '설명 없음'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFile.status)}`}>
                    {getStatusText(selectedFile.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">버전:</span>
                    <span className="ml-2">{selectedFile.version}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">크기:</span>
                    <span className="ml-2">{selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">업로드 일시:</span>
                    <span className="ml-2">{new Date(selectedFile.uploadedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">다운로드 횟수:</span>
                    <span className="ml-2">{selectedFile.downloadCount}회</span>
                  </div>
                </div>

                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">태그:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedFile.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 미리보기 영역 */}
                <div className="border-2 border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">도면 미리보기</p>
                  <p className="text-sm text-gray-500 mt-1">실제 구현에서는 도면 이미지가 여기에 표시됩니다</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download size={16} />
                    다운로드
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Copy size={16} />
                    복사
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share size={16} />
                    공유
                  </button>
                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Clock size={16} />
                    버전 내역
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Settings 모듈 렌더링
  const renderSettingsModule = (tabData: any) => {
    const [currentSection, setCurrentSection] = useState<'defaults' | 'rules' | 'knowledge'>('defaults');
    const [settings, setSettings] = useState(erpState.settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const updateDefaults = (key: string, value: string) => {
      setSettings(prev => ({
        ...prev,
        defaults: {
          ...prev.defaults,
          [key]: value
        }
      }));
      setHasChanges(true);
    };

    const updateRules = (key: string, value: boolean) => {
      setSettings(prev => ({
        ...prev,
        rules: {
          ...prev.rules,
          [key]: value
        }
      }));
      setHasChanges(true);
    };

    const validateSettings = () => {
      const errors: Record<string, string> = {};

      if (!settings.defaults.brand) {
        errors.brand = '브랜드는 필수 선택 항목입니다.';
      }

      if (!settings.defaults.form) {
        errors.form = '형식은 필수 선택 항목입니다.';
      }

      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const saveSettings = () => {
      if (!validateSettings()) {
        return;
      }

      setErpState(prev => ({
        ...prev,
        settings: {
          ...settings,
          knowledgeVersion: {
            ...settings.knowledgeVersion,
            updated: new Date().toISOString().split('T')[0]
          }
        }
      }));
      setHasChanges(false);
      setShowSaveConfirm(false);
    };

    const resetToDefaults = () => {
      setSettings({
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
          updated: new Date().toISOString().split('T')[0]
        }
      });
      setHasChanges(true);
      setValidationErrors({});
    };

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Settings Header */}
        <div className="border-b p-4 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">시스템 설정</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentSection('defaults')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSection === 'defaults' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  기본값 설정
                </button>
                <button
                  onClick={() => setCurrentSection('rules')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSection === 'rules' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  비즈니스 규칙
                </button>
                <button
                  onClick={() => setCurrentSection('knowledge')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentSection === 'knowledge' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  지식베이스
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm">저장되지 않은 변경사항이 있습니다</span>
                </div>
              )}
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} />
                초기화
              </button>
              <button
                onClick={() => setShowSaveConfirm(true)}
                disabled={!hasChanges}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                설정 저장
              </button>
            </div>
          </div>

          {/* Status Info */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>마지막 업데이트: {settings.knowledgeVersion.updated}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>규칙 버전: {settings.knowledgeVersion.rules}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>테이블 버전: {settings.knowledgeVersion.tables}</span>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 overflow-auto">
          {currentSection === 'defaults' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">기본값 설정</h3>
                <p className="text-gray-600 mb-6">새로운 견적서 작성시 기본으로 적용될 값들을 설정합니다.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기본 브랜드
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={settings.defaults.brand}
                      onChange={(e) => updateDefaults('brand', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        validationErrors.brand ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">브랜드 선택</option>
                      <option value="SANGDO">상도전기</option>
                      <option value="LS">엘에스산전</option>
                      <option value="EATON">이톤</option>
                      <option value="SIEMENS">지멘스</option>
                      <option value="SCHNEIDER">슈나이더</option>
                    </select>
                    {validationErrors.brand && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.brand}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      기본 형식
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={settings.defaults.form}
                      onChange={(e) => updateDefaults('form', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        validationErrors.form ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">형식 선택</option>
                      <option value="ECONOMIC">에코노믹</option>
                      <option value="STANDARD">스탠다드</option>
                      <option value="PREMIUM">프리미엄</option>
                      <option value="WATERPROOF">방수형</option>
                      <option value="EXPLOSION_PROOF">방폭형</option>
                    </select>
                    {validationErrors.form && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.form}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기본 설치위치</label>
                    <select
                      value={settings.defaults.location}
                      onChange={(e) => updateDefaults('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="INDOOR">실내</option>
                      <option value="OUTDOOR">실외</option>
                      <option value="SEMI_OUTDOOR">반외부</option>
                      <option value="UNDERGROUND">지하</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기본 설치방식</label>
                    <select
                      value={settings.defaults.mount}
                      onChange={(e) => updateDefaults('mount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="FLUSH">매입형</option>
                      <option value="SURFACE">노출형</option>
                      <option value="WALL">벽부형</option>
                      <option value="POLE">폴대형</option>
                      <option value="CABINET">캐비넷형</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">기본값 설정 안내</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        이 설정들은 새로운 견적서 작성시 자동으로 적용되며,
                        사용자가 개별적으로 변경할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'rules' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">비즈니스 규칙 설정</h3>
                <p className="text-gray-600 mb-6">견적서 작성 및 검증 과정에서 적용될 비즈니스 규칙들을 설정합니다.</p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        id="singleBrand"
                        checked={settings.rules.singleBrand}
                        onChange={(e) => updateRules('singleBrand', e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <label htmlFor="singleBrand" className="font-medium text-gray-800">
                          단일 브랜드 제한
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          하나의 견적서에서는 하나의 브랜드만 사용하도록 제한
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      settings.rules.singleBrand ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {settings.rules.singleBrand ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        id="antiPoleMistake"
                        checked={settings.rules.antiPoleMistake}
                        onChange={(e) => updateRules('antiPoleMistake', e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <label htmlFor="antiPoleMistake" className="font-medium text-gray-800">
                          극 오생장 방지
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          전기 극성 오생장을 방지하기 위한 자동 검증 기능
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      settings.rules.antiPoleMistake ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {settings.rules.antiPoleMistake ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        id="antiDeviceConfuse"
                        checked={settings.rules.antiDeviceConfuse}
                        onChange={(e) => updateRules('antiDeviceConfuse', e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <label htmlFor="antiDeviceConfuse" className="font-medium text-gray-800">
                          장비 혼동 방지
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          비슷한 장비 간의 혼동을 방지하기 위한 경고 시스템
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      settings.rules.antiDeviceConfuse ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {settings.rules.antiDeviceConfuse ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        id="antiInstallMismatch"
                        checked={settings.rules.antiInstallMismatch}
                        onChange={(e) => updateRules('antiInstallMismatch', e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div>
                        <label htmlFor="antiInstallMismatch" className="font-medium text-gray-800">
                          설치 불일치 방지
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          선택된 제품과 설치 방식 간의 불일치를 자동 검증
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      settings.rules.antiInstallMismatch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {settings.rules.antiInstallMismatch ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">비즈니스 규칙 안내</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        이 규칙들은 견적서 작성 및 검증 과정에서 자동으로 적용되어
                        오류를 방지하고 품질을 향상시킵니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'knowledge' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">지식베이스 버전 관리</h3>
                <p className="text-gray-600 mb-6">시스템에서 사용하는 지식베이스와 업무 규칙의 버전 정보를 관리합니다.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="w-8 h-8 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-800">규칙 엔진</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">현재 버전:</span>
                        <span className="font-medium">{settings.knowledgeVersion.rules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">마지막 업데이트:</span>
                        <span className="font-medium">{settings.knowledgeVersion.updated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">상태:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          정상
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      규칙 업데이트 확인
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Archive className="w-8 h-8 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-800">데이터 테이블</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">현재 버전:</span>
                        <span className="font-medium">{settings.knowledgeVersion.tables}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">마지막 업데이트:</span>
                        <span className="font-medium">{settings.knowledgeVersion.updated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">상태:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          정상
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      데이터 업데이트 확인
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">업데이트 내역</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded border">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">v1.0 - 초기 버전</div>
                          <div className="text-sm text-gray-600">2024-09-20 - 기본 비즈니스 규칙 및 데이터 테이블 초기 설정</div>
                        </div>
                        <span className="text-xs text-gray-500">Current</span>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-blue-800">v1.1 - 예정</div>
                          <div className="text-sm text-blue-600">2024-10-15 - 향상된 오류 검증 로직 및 새로운 제품 데이터 추가</div>
                        </div>
                        <span className="text-xs text-blue-600">Planned</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">지식베이스 가이드</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        시스템의 지식베이스는 지속적으로 업데이트되며,
                        새로운 업무 규칙과 제품 데이터가 추가되어 정확성을 향상시킵니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Confirmation Modal */}
        {showSaveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold">설정 저장 확인</h3>
              </div>
              <p className="text-gray-600 mb-6">
                변경된 설정을 저장하시겠습니까? 이 설정은 시스템 전체에 영향을 미칩니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
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
              <span className="text-base text-gray-700 font-medium">2025년 09월 23일</span>
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