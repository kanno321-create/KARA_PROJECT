import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconButton,
  Text,
  Persona,
  PersonaSize,
  Callout,
  DirectionalHint,
  Link,
  Stack,
  Separator,
  Icon,
} from '@fluentui/react';

interface StableSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

const StableSidebar: React.FC<StableSidebarProps> = ({ onCollapseChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountButtonRef = useRef<HTMLDivElement>(null);

  const recentChats = [
    { id: 1, title: 'AI ERP 견적시스템 설계' },
    { id: 2, title: '지원 항목 안내' },
    { id: 3, title: '최초프로젝트 내용' },
  ];

  const workItems = [
    { name: 'AI 매니저', url: '/ai-manager', icon: 'Robot' },
    { name: '견적서', url: '/estimates', icon: 'DocumentManagement' },
    { name: 'ERP', url: '/erp', icon: 'Database' },
    { name: '이메일', url: '/email', icon: 'Mail' },
    { name: '캘린더', url: '/calendar', icon: 'Calendar' },
    { name: '도면', url: '/drawings', icon: 'FileImage' },
    { name: 'MCP/A2A', url: '/mcp', icon: 'Plug' },
    { name: '감사', url: '/audit', icon: 'Shield' },
  ];

  const projectChats = [
    { id: 1, title: '새 프로젝트', icon: 'FolderOpen' },
    { id: 2, title: '천재적사고', icon: 'Folder' },
    { id: 3, title: '전국분전반자동화', icon: 'Folder' },
  ];

  const handleNavClick = (url: string) => {
    navigate(url);
  };

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <>
      <aside className={`sidebar-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 사이드바 헤더 */}
        <div className="sidebar-header">
          <IconButton
            iconProps={{ iconName: 'GlobalNavButton' }}
            title="메뉴 토글"
            onClick={toggleSidebar}
          />
          {!isCollapsed && (
            <Text variant="xLarge" styles={{ root: { fontWeight: 600, fontSize: '22px' } }}>
              KIS AI
            </Text>
          )}
        </div>

        {/* 스크롤 영역 */}
        <div className="sidebar-scroll">
          {/* 채팅 섹션 */}
          {!isCollapsed && (
            <div className="sidebar-section">
              <div className="sidebar-heading">채팅</div>
              <nav className="nav-list">
                <div className="nav-item" onClick={() => navigate('/chat/new')}>
                  <Icon iconName="Add" />
                  <span>New chat</span>
                </div>
                {recentChats.map((chat) => (
                  <div key={chat.id} className="chat-item">
                    {chat.title}
                  </div>
                ))}
              </nav>
            </div>
          )}

          {/* 업무 섹션 */}
          <div className="sidebar-section">
            {!isCollapsed && <div className="sidebar-heading">업무</div>}
            <nav className="nav-list">
              {workItems.map((item) => {
                const isActive = location.pathname === item.url ||
                               (location.pathname === '/' && item.url === '/ai-manager');
                return (
                  <div
                    key={item.url}
                    className={`nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.url)}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon iconName={item.icon} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* 프로젝트 섹션 */}
          {!isCollapsed && (
            <div className="sidebar-section">
              <div className="sidebar-heading">프로젝트</div>
              <nav className="nav-list">
                {projectChats.map((project) => (
                  <div key={project.id} className="nav-item">
                    <Icon iconName={project.icon} />
                    <span>{project.title}</span>
                  </div>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* 하단 고정 계정 영역 */}
        <div className="account-section">
          <div
            ref={accountButtonRef}
            className="account-button"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          >
            <Persona
              text={isCollapsed ? '' : '이충원'}
              secondaryText={isCollapsed ? '' : 'ceo@kis.com'}
              size={isCollapsed ? PersonaSize.size32 : PersonaSize.size48}
              imageInitials="이충"
              hidePersonaDetails={isCollapsed}
              styles={{
                primaryText: { fontSize: '17px', fontWeight: 600 },
                secondaryText: { fontSize: '14px' }
              }}
            />
            {!isCollapsed && (
              <Icon iconName="ChevronUp" styles={{ root: { marginLeft: 'auto' } }} />
            )}
          </div>
        </div>
      </aside>

      {/* 계정 메뉴 Callout */}
      {isAccountMenuOpen && accountButtonRef.current && (
        <Callout
          target={accountButtonRef.current}
          onDismiss={() => setIsAccountMenuOpen(false)}
          directionalHint={DirectionalHint.topLeftEdge}
          gapSpace={0}
        >
          <Stack styles={{ root: { padding: 16, width: 240 } }} tokens={{ childrenGap: 12 }}>
            <Persona
              text="이충원"
              secondaryText="ceo@kis.com"
              size={PersonaSize.size48}
              imageInitials="이충"
            />
            <Separator />
            <Link onClick={() => navigate('/settings/team')}>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Icon iconName="Group" />
                <Text>팀원 추가</Text>
              </Stack>
            </Link>
            <Link onClick={() => navigate('/settings/workspace')}>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Icon iconName="WorkItem" />
                <Text>워크스페이스 설정</Text>
              </Stack>
            </Link>
            <Link onClick={() => navigate('/settings/billing')}>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Icon iconName="PaymentCard" />
                <Text>개인 맞춤 설정</Text>
              </Stack>
            </Link>
            <Separator />
            <Link onClick={() => navigate('/settings')}>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Icon iconName="Settings" />
                <Text>설정</Text>
              </Stack>
            </Link>
            <Link>
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Icon iconName="SignOut" />
                <Text>로그아웃</Text>
              </Stack>
            </Link>
          </Stack>
        </Callout>
      )}
    </>
  );
};

export default StableSidebar;