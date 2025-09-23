import React, { useState, useCallback } from "react";
import {
  Users, Package, TrendingUp, TrendingDown, DollarSign, CreditCard,
  Wallet, FileText, MessageCircle, Printer, File, ShoppingCart,
  Home, Edit, BarChart3, Archive, Send, Database, RefreshCw,
  Settings, HelpCircle, Menu, X, ChevronDown, ChevronRight,
  Search, Bell, User, LogOut, Calendar, Mail, Image
} from "lucide-react";

import { CalendarModule } from "./calendar-module";
import { EmailModule } from "./email-module";
import { DrawingsModule } from "./drawings-module";
import { SettingsModule } from "./settings-module";

const quickAccessButtons = [
  { id: "customer", name: "Customer Info", icon: Users, color: "bg-blue-500" },
  { id: "inventory", name: "Real-time Inventory", icon: Package, color: "bg-green-500" },
  { id: "sales-slip", name: "Sales Slip", icon: TrendingUp, color: "bg-emerald-500" },
  { id: "purchase-slip", name: "Purchase Slip", icon: TrendingDown, color: "bg-red-500" },
  { id: "payment-slip", name: "Payment Slip", icon: CreditCard, color: "bg-purple-500" },
  { id: "collection-slip", name: "Collection Slip", icon: DollarSign, color: "bg-yellow-500" },
  { id: "expense", name: "Expense Management", icon: Wallet, color: "bg-indigo-500" },
  { id: "etax", name: "E-Tax Invoice", icon: FileText, color: "bg-pink-500" },
  { id: "sms", name: "SMS Sending", icon: MessageCircle, color: "bg-cyan-500" },
  { id: "fax", name: "Fax Transmission", icon: Printer, color: "bg-orange-500" },
  { id: "quote", name: "Quotation", icon: File, color: "bg-teal-500" },
  { id: "purchase-order", name: "Purchase Order", icon: ShoppingCart, color: "bg-rose-500" },
];

const sidebarMenus = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: Home,
    subItems: []
  },
  {
    id: "calendar",
    name: "Schedule Management",
    icon: Calendar,
    subItems: [
      { id: "calendar-view", name: "Calendar View" },
      { id: "event-manage", name: "Event Management" },
      { id: "meeting-room", name: "Meeting Room Booking" },
      { id: "schedule-analysis", name: "Schedule Analysis" },
    ]
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    subItems: [
      { id: "email-compose", name: "Compose Email" },
      { id: "email-inbox", name: "Inbox" },
      { id: "email-sent", name: "Sent Items" },
      { id: "email-groups", name: "Group Management" },
      { id: "email-templates", name: "Template Management" },
    ]
  },
  {
    id: "drawings",
    name: "Drawing Management",
    icon: Image,
    subItems: [
      { id: "drawing-upload", name: "Drawing Upload" },
      { id: "drawing-library", name: "Drawing Library" },
      { id: "drawing-versions", name: "Version Control" },
      { id: "drawing-approval", name: "Approval Management" },
    ]
  },
  {
    id: "document",
    name: "Document Creation",
    icon: Edit,
    subItems: [
      { id: "sales-doc", name: "Sales Document" },
      { id: "purchase-doc", name: "Purchase Document" },
      { id: "payment-doc", name: "Payment Document" },
      { id: "collection-doc", name: "Collection Document" },
      { id: "general-doc", name: "General Document" },
    ]
  },
  {
    id: "report",
    name: "Reports",
    icon: BarChart3,
    subItems: [
      { id: "daily-report", name: "Daily Report" },
      { id: "monthly-report", name: "Monthly Report" },
      { id: "sales-ledger", name: "Sales Ledger" },
      { id: "purchase-ledger", name: "Purchase Ledger" },
      { id: "financial-statement", name: "Financial Statement" },
    ]
  },
  {
    id: "receivables",
    name: "Receivables Management",
    icon: DollarSign,
    subItems: [
      { id: "receivables-manage", name: "Receivables Management" },
      { id: "payables-manage", name: "Payables Management" },
      { id: "receivables-status", name: "Receivables Status" },
      { id: "payables-status", name: "Payables Status" },
      { id: "collection-plan", name: "Collection Plan" },
      { id: "payment-plan", name: "Payment Plan" },
    ]
  },
  {
    id: "inventory",
    name: "Inventory Management",
    icon: Archive,
    subItems: [
      { id: "stock-status", name: "Stock Status" },
      { id: "stock-in", name: "Stock In" },
      { id: "stock-out", name: "Stock Out" },
      { id: "stock-move", name: "Stock Movement" },
      { id: "stock-check", name: "Stock Check" },
    ]
  },
  {
    id: "etransfer",
    name: "Electronic Transfer",
    icon: Send,
    subItems: [
      { id: "etax-manage", name: "E-Tax Invoice" },
      { id: "email-send", name: "Email Sending" },
      { id: "sms-send", name: "SMS Sending" },
      { id: "fax-send", name: "Fax Transmission" },
    ]
  },
  {
    id: "basic",
    name: "Basic Data",
    icon: Database,
    subItems: [
      { id: "customer-manage", name: "Customer Management" },
      { id: "product-manage", name: "Product Management" },
      { id: "account-manage", name: "Account Management" },
      { id: "employee-manage", name: "Employee Management" },
    ]
  },
  {
    id: "carryover",
    name: "Carryover",
    icon: RefreshCw,
    subItems: [
      { id: "balance-carryover", name: "Balance Carryover" },
      { id: "document-carryover", name: "Document Carryover" },
      { id: "year-closing", name: "Year Closing" },
    ]
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    subItems: [
      { id: "company-info", name: "Company Info" },
      { id: "user-manage", name: "User Management" },
      { id: "permission", name: "Permission Settings" },
      { id: "backup", name: "Backup/Restore" },
      { id: "system-defaults", name: "System Defaults" },
      { id: "business-rules", name: "Business Rules" },
      { id: "knowledge-version", name: "Knowledge Base Version" },
    ]
  },
  {
    id: "guide",
    name: "User Guide",
    icon: HelpCircle,
    subItems: []
  },
];

export function ERPSystemSimple() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [selectedSubMenu, setSelectedSubMenu] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedQuickButton, setSelectedQuickButton] = useState<string | null>(null);

  const moduleKeys = ["calendar", "email", "drawings", "settings"] as const;
  type ModuleKey = typeof moduleKeys[number];

  const [moduleData, setModuleData] = useState<Record<ModuleKey, any>>({
    calendar: {},
    email: {},
    drawings: {},
    settings: {}
  });

  const updateModuleData = useCallback((moduleType: ModuleKey, data: any) => {
    setModuleData(prev => ({
      ...prev,
      [moduleType]: {
        ...(prev[moduleType] ?? {}),
        ...data
      }
    }));
  }, []);

  const renderModule = (module: ModuleKey) => {
    switch (module) {
      case "calendar":
        return (
          <CalendarModule
            tabData={moduleData.calendar}
            updateTabData={updateModuleData}
            activeTabId="calendar"
          />
        );
      case "email":
        return (
          <EmailModule
            tabData={moduleData.email}
            updateTabData={updateModuleData}
            activeTabId="email"
          />
        );
      case "drawings":
        return (
          <DrawingsModule
            tabData={moduleData.drawings}
            updateTabData={updateModuleData}
            activeTabId="drawings"
          />
        );
      case "settings":
        return (
          <SettingsModule
            tabData={moduleData.settings}
            updateTabData={updateModuleData}
            activeTabId="settings"
            erpState={{
              tabs: [],
              activeTabId: null,
              nextTabId: 1,
              settings: {
                defaults: { brand: 'SANGDO', form: 'ECONOMIC', location: 'INDOOR', mount: 'FLUSH' },
                rules: { singleBrand: true, antiPoleMistake: true, antiDeviceConfuse: true, antiInstallMismatch: true },
                knowledgeVersion: { rules: 'v1.0', tables: 'v1.0', updated: '2024-09-20' }
              }
            }}
            setErpState={() => {}}
          />
        );
      default:
        return null;
    }
  };

  const expandedSidebarWidth = '14rem';
  const collapsedSidebarWidth = '4rem';
  const sidebarWidth = sidebarOpen ? expandedSidebarWidth : collapsedSidebarWidth;

  // Toggle menu expansion/collapse
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

  // Menu selection
  const handleMenuClick = useCallback((menuId: string, subMenuId?: string) => {
    setSelectedMenu(menuId);
    if (subMenuId) {
      setSelectedSubMenu(subMenuId);
    } else {
      setSelectedSubMenu(null);
    }
    setSelectedQuickButton(null);
  }, []);

  // Quick access button click
  const handleQuickButtonClick = useCallback((buttonId: string) => {
    setSelectedQuickButton(buttonId);
    setSelectedMenu("");
    setSelectedSubMenu(null);
  }, []);

  // Content area rendering
  const renderContent = () => {
    if (selectedQuickButton) {
      const button = quickAccessButtons.find(b => b.id === selectedQuickButton);
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{button?.name}</h2>
          <p className="text-lg text-gray-600">{button?.name} module is displayed.</p>
        </div>
      );
    }

    const moduleKey = moduleKeys.find(module => module === selectedMenu);

    if (moduleKey) {
      return renderModule(moduleKey);
    }

    if (selectedSubMenu) {
      const menu = sidebarMenus.find(m => m.id === selectedMenu);
      const subItem = menu?.subItems.find(s => s.id === selectedSubMenu);
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{subItem?.name}</h2>
          <p className="text-lg text-gray-600">{subItem?.name} module is displayed.</p>
        </div>
      );
    }

    if (selectedMenu === "dashboard") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">Today Sales</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">$15,234,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">Today Purchases</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">$8,521,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">Receivables</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">$32,100,000</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-600">Inventory Value</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">$125,400,000</p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedMenu === "guide") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">User Guide</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Getting Started</h3>
              <p className="text-base text-gray-600">Basic guide for using the ERP system.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Document Creation</h3>
              <p className="text-base text-gray-600">How to create sales, purchase, payment, and collection documents.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Report Utilization</h3>
              <p className="text-base text-gray-600">How to effectively utilize various reports.</p>
            </div>
          </div>
        </div>
      );
    }

    const menu = sidebarMenus.find(m => m.id === selectedMenu);
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{menu?.name}</h2>
        <p className="text-lg text-gray-600">You have selected the {menu?.name} menu. Please select a submenu.</p>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      {/* Sidebar */}
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

              {/* Submenu */}
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg border-b">
          <div className="px-6 py-4">
            {/* Top quick access buttons */}
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

          {/* User info bar */}
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-base text-gray-700 font-medium">September 24, 2025</span>
              <span className="text-base text-gray-400">|</span>
              <span className="text-base font-semibold text-gray-800">Korean Industrial Co.</span>
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
                <span className="text-base font-medium text-gray-700">Administrator</span>
              </div>
              <button className="p-2 hover:bg-gray-200 rounded">
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}