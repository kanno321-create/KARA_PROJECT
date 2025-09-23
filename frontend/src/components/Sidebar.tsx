import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stack,
  Text,
  IconButton,
  mergeStyles,
  Persona,
  PersonaSize,
  Callout,
  DirectionalHint,
  Link,
  Separator,
  Icon,
} from '@fluentui/react';

const sidebarStyles = mergeStyles({
  width: 280,
  height: '100vh',
  backgroundColor: '#f9f9f9',
  borderRight: '1px solid #e5e5e5',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.3s ease',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
});

const collapsedSidebarStyles = mergeStyles({
  width: 60,
});

const headerStyles = mergeStyles({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minHeight: '48px',
});

const sectionTitleStyles = mergeStyles({
  padding: '12px 16px 8px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#606060',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const navItemStyles = mergeStyles({
  padding: '8px 16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  textDecoration: 'none',
  color: '#323130',
  transition: 'background-color 0.2s ease',
  ':hover': {
    backgroundColor: '#e1dfdd',
  },
});

const activeNavItemStyles = mergeStyles({
  backgroundColor: '#e1dfdd',
  borderLeft: '3px solid #0078d4',
  paddingLeft: '13px',
});

const chatItemStyles = mergeStyles({
  padding: '6px 16px 6px 32px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#605e5c',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  ':hover': {
    backgroundColor: '#e1dfdd',
    color: '#323130',
  },
});

const contentAreaStyles = mergeStyles({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
});

const accountSectionStyles = mergeStyles({
  marginTop: 'auto',
  borderTop: '1px solid #e5e5e5',
  padding: '12px',
  backgroundColor: '#f9f9f9',
});

const accountButtonStyles = mergeStyles({
  width: '100%',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  borderRadius: '4px',
  ':hover': {
    backgroundColor: '#e1dfdd',
  },
});

const calloutContentStyles = mergeStyles({
  padding: '16px',
  width: '240px',
});

interface SidebarProps {
  children?: React.ReactNode;
  onCollapseChange?: (collapsed: boolean) => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ children, onCollapseChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountButtonRef = useRef<HTMLDivElement>(null);

  const recentChats = [
    { id: 1, title: 'AI ERP 견적시스템 설계' },
    { id: 2, title: '지원 향목 안내' },
    { id: 3, title: '최조프로젝트 내용' },
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

  const renderNavItem = (item: any, isActive: boolean) => {
    if (isCollapsed) {
      return (
        <div
          className={`${navItemStyles} ${isActive ? activeNavItemStyles : ''}`}
          onClick={() => handleNavClick(item.url)}
          title={item.name}
        >
          <Icon iconName={item.icon} />
        </div>
      );
    }

    return (
      <div
        className={`${navItemStyles} ${isActive ? activeNavItemStyles : ''}`}
        onClick={() => handleNavClick(item.url)}
      >
        <Icon iconName={item.icon} />
        <Text>{item.name}</Text>
      </div>
    );
  };

  return (
    <>
      <div className={`${sidebarStyles} ${isCollapsed ? collapsedSidebarStyles : ''}`}>
        <div className={headerStyles}>
          <IconButton
            iconProps={{ iconName: isCollapsed ? 'GlobalNavButton' : 'GlobalNavButton' }}
            title="메뉴 토글"
            onClick={toggleSidebar}
          />
          {!isCollapsed && (
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              KIS AI
            </Text>
          )}
        </div>

        <div className={contentAreaStyles}>
          {/* 채팅 섹션 */}
          {!isCollapsed && (
            <>
              <div className={sectionTitleStyles}>채팅</div>
              <Stack>
                <div className={navItemStyles} onClick={() => navigate('/chat/new')}>
                  <Icon iconName="Add" />
                  <Text>New chat</Text>
                </div>
                {recentChats.map((chat) => (
                  <div key={chat.id} className={chatItemStyles}>
                    {chat.title}
                  </div>
                ))}
              </Stack>
            </>
          )}

          {/* 업무 섹션 */}
          {!isCollapsed && <div className={sectionTitleStyles}>업무</div>}
          <Stack>
            {workItems.map((item) => {
              const isActive = location.pathname === item.url ||
                             (location.pathname === '/' && item.url === '/ai-manager');
              return (
                <div key={item.url}>
                  {renderNavItem(item, isActive)}
                </div>
              );
            })}
          </Stack>

          {/* 프로젝트 섹션 */}
          {!isCollapsed && (
            <>
              <div className={sectionTitleStyles}>프로젝트</div>
              <Stack>
                {projectChats.map((project) => (
                  <div key={project.id} className={navItemStyles}>
                    <Icon iconName={project.icon} />
                    <Text>{project.title}</Text>
                  </div>
                ))}
              </Stack>
            </>
          )}
        </div>

        {/* 계정 섹션 */}
        <div className={accountSectionStyles}>
          <div
            ref={accountButtonRef}
            className={accountButtonStyles}
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          >
            <Persona
              text={isCollapsed ? '' : '이충원'}
              secondaryText={isCollapsed ? '' : 'ceo@kis.com'}
              size={isCollapsed ? PersonaSize.size32 : PersonaSize.size40}
              imageInitials="이충"
              hidePersonaDetails={isCollapsed}
            />
            {!isCollapsed && <Icon iconName="ChevronUp" styles={{ root: { marginLeft: 'auto' } }} />}
          </div>
        </div>

        {isAccountMenuOpen && accountButtonRef.current && (
          <Callout
            target={accountButtonRef.current}
            onDismiss={() => setIsAccountMenuOpen(false)}
            directionalHint={DirectionalHint.topLeftEdge}
            gapSpace={0}
          >
            <div className={calloutContentStyles}>
              <Stack tokens={{ childrenGap: 12 }}>
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
            </div>
          </Callout>
        )}
      </div>

      {/* Main Content */}
      <Stack styles={{ root: { flex: 1, position: 'relative' } }}>
        {children}
      </Stack>
    </>
  );
};

export default Sidebar;