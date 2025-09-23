import React from "react";
import { 
  Plus, 
  MessageSquare, 
  Menu, 
  Folder, 
  User, 
  Settings, 
  Moon, 
  Sun,
  HelpCircle, 
  LogOut,
  MoreHorizontal,
  Briefcase,
  Receipt,
  Grid3X3,
  Calendar,
  Mail,
  Layers,
  FolderPlus
} from "lucide-react";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SidebarContainerProps {
  expanded: boolean;
  children: React.ReactNode;
}

export function SidebarContainer({ expanded, children }: SidebarContainerProps) {
  return (
    <div 
      className={`
        h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] 
        transition-all duration-200 ease-out flex flex-col
        ${expanded ? 'w-[280px]' : 'w-[80px]'}
      `}
    >
      {children}
    </div>
  );
}

interface SidebarHeaderProps {
  expanded: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ expanded, onToggle }: SidebarHeaderProps) {
  return (
    <div className="p-5 flex items-center justify-between">
      {expanded && (
        <h2 className="caption-12 text-[var(--color-text-strong)] font-semibold text-[24px]">
          (주)한국산업
        </h2>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="p-1.5 h-auto"
      >
        <Menu size={20} />
      </Button>
    </div>
  );
}

interface SidebarButtonProps {
  variant: 'primary' | 'secondary';
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onClick?: () => void;
}

export function SidebarButton({ variant, icon, label, expanded, onClick }: SidebarButtonProps) {
  if (variant === 'primary') {
    return (
      <Button
        onClick={onClick}
        className={`h-10 mx-3 mb-4 rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)] flex items-center gap-3 ${!expanded ? 'px-2 justify-center' : 'px-4 justify-start'}`}
      >
        {icon}
        {expanded && <span className="caption-12">{label}</span>}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`
        h-10 mx-3 mb-2 rounded-[var(--radius-md)] 
        bg-[var(--color-surface)] border-[var(--color-border)] 
        hover:bg-[var(--color-surface-2)]
        flex items-center gap-3
        ${!expanded ? 'px-2 justify-center' : 'px-4 justify-start'}
      `}
    >
      {icon}
      {expanded && <span className="caption-12">{label}</span>}
    </Button>
  );
}

interface SidebarSectionTitleProps {
  title: string;
  expanded: boolean;
}

export function SidebarSectionTitle({ title, expanded }: SidebarSectionTitleProps) {
  if (!expanded) return null;
  
  return (
    <div className="px-4 mb-2">
      <span className="text-[15px] leading-3 text-[var(--color-text-subtle)]">
        {title}
      </span>
    </div>
  );
}

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({ icon, label, active, expanded, onClick }: SidebarNavItemProps) {
  return (
    <div className="relative">
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[var(--color-brand)] rounded-r-full" />
      )}
      <button
        onClick={onClick}
        className={`
          w-full h-9 flex items-center gap-3 hover:bg-[var(--color-surface-2)] 
          transition-colors duration-150
          ${!expanded ? 'px-3 justify-center' : 'pl-6 pr-3 justify-start'}
          ${active ? 'bg-[var(--color-surface-2)]' : ''}
        `}
      >
        <div className="w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
        {expanded && (
          <span className="caption-12 text-[var(--color-text)]">
            {label}
          </span>
        )}
      </button>
    </div>
  );
}

interface SidebarChatItemProps {
  title: string;
  time?: string;
  expanded: boolean;
  onClick?: () => void;
}

export function SidebarChatItem({ title, time, expanded, onClick }: SidebarChatItemProps) {
  if (!expanded) return null;
  
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 pl-7 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors duration-150"
    >
      <MessageSquare size={16} />
      <div className="flex-1 text-left">
        <div className="caption-12 text-[var(--color-text)] truncate">
          {title}
        </div>

      </div>
    </button>
  );
}

interface SidebarProjectItemProps {
  name: string;
  expanded: boolean;
  onOpen?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function SidebarProjectItem({ name, expanded, onOpen, onRename, onDelete }: SidebarProjectItemProps) {
  if (!expanded) return null;
  
  return (
    <div className="flex items-center px-4 py-2 hover:bg-[var(--color-surface-2)] transition-colors duration-150">
      <Folder size={16} className="text-[var(--color-text-subtle)] mr-3" />
      <span className="caption-12 text-[var(--color-text)] flex-1 truncate">
        {name}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          side="right"
          sideOffset={4}
          className="min-w-[120px] z-[9999]"
          collisionPadding={8}
        >
          <DropdownMenuItem onClick={onOpen} className="text-[12px]">
            열기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRename} className="text-[12px]">
            이름변경
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-[var(--color-error)] text-[12px]">
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface AccountMenuProps {
  expanded: boolean;
  onWorkspaceSettings: () => void;
  onSettings: () => void;
  onToggleDarkMode: () => void;
  onHelp: () => void;
  onLogout: () => void;
  darkMode: boolean;
}

export function AccountMenu({ 
  expanded, 
  onWorkspaceSettings, 
  onSettings, 
  onToggleDarkMode, 
  onHelp, 
  onLogout,
  darkMode 
}: AccountMenuProps) {
  return (
    <div className="p-3 border-t border-[var(--color-border)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={`
              w-full h-auto p-2 flex items-center gap-3 hover:bg-[var(--color-surface-2)]
              ${!expanded ? 'justify-center' : 'justify-start'}
            `}
          >
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">내</AvatarFallback>
            </Avatar>
            {expanded && (
              <span className="text-[16px] leading-3 text-[var(--color-text)]">
                내 계정
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start"
          alignOffset={-20}
          side="top"
          sideOffset={10}
          className="min-w-[200px] z-[9999]"
        >
          <DropdownMenuItem onClick={onWorkspaceSettings} className="text-[12px]">
            <Settings size={14} className="mr-2" />
            워크스페이스 설정
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSettings} className="text-[12px]">
            <Settings size={14} className="mr-2" />
            설정
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleDarkMode} className="text-[12px]">
            {darkMode ? <Sun size={14} className="mr-2" /> : <Moon size={14} className="mr-2" />}
            {darkMode ? '라이트 모드' : '다크 모드'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onHelp} className="text-[12px]">
            <HelpCircle size={14} className="mr-2" />
            도움말
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout} className="text-[12px]">
            <LogOut size={14} className="mr-2" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Navigation items data
export const navigationItems = [
  { icon: <Briefcase size={20} />, label: "AI매니저", id: "ai-manager" },
  { icon: <Receipt size={20} />, label: "견적", id: "quote" },
  { icon: <Grid3X3 size={20} />, label: "ERP", id: "erp" },
  { icon: <Calendar size={20} />, label: "캘린더", id: "schedule" },
  { icon: <Mail size={20} />, label: "이메일", id: "email" },
  { icon: <Layers size={20} />, label: "도면", id: "blueprint" },
];

// Recent chats data
export const recentChats = [
  { title: "프로젝트 일정 관리", time: "10분 전" },
  { title: "견적서 작성 도움", time: "1시간 전" },
  { title: "ERP 시스템 질문", time: "어제" },
];

// Recent projects data
export const recentProjects = [
  "A사 신규 프로젝트",
  "B사 견적 관리",
  "내부 시스템 개선",
  "분기별 보고서",
  "설비 점검 계획"
];