import React, { useState, useEffect, useRef } from "react";
import { Plus, FolderPlus, Maximize2, Minimize2, FileText, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SidebarContainer, 
  SidebarHeader, 
  SidebarButton, 
  SidebarSectionTitle, 
  SidebarNavItem, 
  SidebarChatItem, 
  SidebarProjectItem, 
  AccountMenu,
  navigationItems,
  recentChats,
  recentProjects 
} from "./components/sidebar-components";
import { 
  ChatInput, 
  UserMessage, 
  AIMessage, 
  DateDivider, 
  TypingIndicator, 
  ScrollToTopButton 
} from "./components/chat-components";
import { HeroSection } from "./components/hero-section";
import { ProjectsView } from "./components/projects-view";
import { WorkspaceSettings } from "./components/workspace-settings";
import { WorkPanel, WorkContent, WorkNotification } from "./components/work-panel";
import { QuoteSystem } from "./components/quote-system";
import { ERPSystem } from "./components/erp-system";
import { Button } from "./components/ui/button";

type ViewState = 'hero' | 'chat' | 'projects' | 'quote' | 'erp';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export default function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('hero');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string>('ai-manager');
  const [darkMode, setDarkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 견적 시스템 상태 저장
  const [quoteData, setQuoteData] = useState<any>(null);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  
  // Work panel states
  const [workPanelOpen, setWorkPanelOpen] = useState(false);
  const [workContent, setWorkContent] = useState<WorkContent[]>([]);
  const [currentWork, setCurrentWork] = useState<WorkContent | null>(null);
  const [workNotification, setWorkNotification] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && currentView === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentView]);

  // Handle scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollTop(scrollTop < scrollHeight - clientHeight - 100);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentView]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Switch to chat view if currently on hero
    if (currentView === 'hero') {
      setCurrentView('chat');
    }

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  // Check if input triggers work panel
  const triggersWorkPanel = (input: string): { shouldOpen: boolean; workType?: WorkContent['type']; title?: string } => {
    const triggers = [
      { keywords: ['견적', '견적서', '견적 요청'], type: 'quote' as const, title: '견적서 작성' },
      { keywords: ['도면', '설계도', '도면 분석'], type: 'image' as const, title: '도면 분석' },
      { keywords: ['분석', '데이터 분석', '보고서'], type: 'analysis' as const, title: '데이터 분석' },
      { keywords: ['문서', '계약서', '서류'], type: 'document' as const, title: '문서 작성' },
      { keywords: ['엑셀', '스프레드시트', '표'], type: 'spreadsheet' as const, title: '스프레드시트 생성' }
    ];

    for (const trigger of triggers) {
      if (trigger.keywords.some(keyword => input.includes(keyword))) {
        return { shouldOpen: true, workType: trigger.type, title: trigger.title };
      }
    }

    return { shouldOpen: false };
  };

  const startWork = (workType: WorkContent['type'], title: string) => {
    const newWork: WorkContent = {
      id: Date.now().toString(),
      type: workType,
      title,
      status: 'processing',
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      progress: 0
    };

    setCurrentWork(newWork);
    setWorkContent(prev => [...prev, newWork]);
    setWorkPanelOpen(true);

    // Simulate work progress
    simulateWorkProgress(newWork.id);
  };

  const simulateWorkProgress = (workId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20%
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Complete the work
        setWorkContent(prev => prev.map(item => 
          item.id === workId 
            ? { 
                ...item, 
                status: 'completed', 
                progress: 100,
                content: `${item.title}이(가) 성공적으로 완료되었습니다.`,
                downloadUrl: `#download-${workId}` 
              }
            : item
        ));
        
        setCurrentWork(null);
        
        // Show notification
        setWorkNotification({
          visible: true,
          message: `${workContent.find(w => w.id === workId)?.title || '작업'}이 완료되었습니다.`
        });
      } else {
        // Update progress
        setWorkContent(prev => prev.map(item => 
          item.id === workId ? { ...item, progress } : item
        ));
        setCurrentWork(prev => prev ? { ...prev, progress } : null);
      }
    }, 800);
  };

  const generateAIResponse = (userInput: string): string => {
    const workTrigger = triggersWorkPanel(userInput);
    
    if (workTrigger.shouldOpen && workTrigger.workType && workTrigger.title) {
      // Start work in background
      setTimeout(() => {
        startWork(workTrigger.workType!, workTrigger.title!);
      }, 1000);
    }

    // Simple response generation based on keywords
    const responses = {
      프로젝트: "프로젝트 관리에 대해 도움을 드리겠습니다. 효율적인 프로젝트 관리를 위해서는 명확한 목표 설정, 단계별 계획 수립, 그리고 정기적인 진행 상황 점검이 중요합니다.\n\n주요 프로젝트 관리 단계:\n1. 프로젝트 범위 정의\n2. 일정 및 예산 계획\n3. 팀 구성 및 역할 배정\n4. 위험 요소 식별 및 대응 방안\n5. 정기적인 모니터링 및 보고",
      견적: "견적서 작성을 시작하겠습니다. 작업 패널에서 진행 상황을 확인할 수 있습니다.\n\n견적서 작성 시 고려사항:\n• 정확한 원가 계산\n• 적정 이익률 반영\n• 경쟁사 가격 분석\n• 고객 예산 고려\n• 부가세 및 기타 비용 포함\n\n완료되면 다운로드 가능한 견적서가 제공됩니다.",
      도면: "도면 분석을 시작하겠습니다. 작업 패널에서 분석 결과를 확인할 수 있습니다.\n\n도면 분석 항목:\n• 구조적 안전성 검토\n• 치수 정확성 확인\n• 재료 사양 검토\n• 시공 가능성 평가\n\n분석이 완료되면 상세한 보고서를 제공해드립니다.",
      ERP: "ERP 시스템 사용법에 대해 안내드리겠습니다.\n\nERP 시스템의 주요 모듈:\n• 회계/재무 관리\n• 인사/급여 관리\n• 영업/고객 관리\n• 구매/재고 관리\n• 생산 관리\n\n각 모듈은 통합적으로 연동되어 실시간 데이터 공유가 가능합니다. 추가로 어떤 모듈에 대해 자세히 알고 싶으신가요?",
      업무: "효율적인 업무 관리를 위한 몇 가지 방법을 제안드립니다:\n\n1. 우선순위 매트릭스 활용\n2. 시간 블록킹 기법 적용\n3. 정기적인 업무 리뷰\n4. 적절한 도구 활용 (캘린더, 태스크 관리 앱 등)\n5. 팀 커뮤니케이션 강화\n\n어떤 부분에 대해 더 자세히 알고 싶으신가요?"
    };

    for (const [keyword, response] of Object.entries(responses)) {
      if (userInput.includes(keyword)) {
        return response;
      }
    }

    return `"${userInput}"에 대해 문의해 주셨군요. (주)한국산업의 AI 어시스턴트로서 업무 관련 질문에 최선을 다해 답변드리겠습니다. 

구체적으로 어떤 도움이 필요하신지 알려주시면 더 정확한 정보를 제공할 수 있습니다.`;
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentView('hero');
    setInputValue('');
    setActiveNavItem('ai-manager');
    setWorkPanelOpen(false);
    setWorkContent([]);
    setCurrentWork(null);
  };

  const handleNavItemClick = (itemId: string) => {
    setActiveNavItem(itemId);
    
    // AI매니저를 클릭하면 초기화면으로 이동
    if (itemId === 'ai-manager') {
      setCurrentView('hero');
      setMessages([]);
      setInputValue('');
    }
    
    // 견적을 클릭하면 견적 시스템으로 이동
    if (itemId === 'quote') {
      setCurrentView('quote');
    }
    
    // ERP를 클릭하면 ERP 시스템으로 이동
    if (itemId === 'erp') {
      setCurrentView('erp');
    }
  };

  const handleScrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Work panel handlers
  const handleWorkPanelClose = () => {
    setWorkPanelOpen(false);
  };

  const handleWorkPanelToggle = () => {
    setWorkPanelOpen(!workPanelOpen);
  };

  const handleDownload = (contentId: string) => {
    const content = workContent.find(item => item.id === contentId);
    if (content && content.downloadUrl) {
      // Simulate download
      console.log(`Downloading: ${content.title}`);
      // In real implementation, trigger actual download
      const element = document.createElement('a');
      element.href = content.downloadUrl;
      element.download = `${content.title}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleDownloadAll = () => {
    const completedContent = workContent.filter(item => item.status === 'completed');
    console.log(`Downloading ${completedContent.length} files`);
    // In real implementation, create zip and download
    completedContent.forEach(content => {
      setTimeout(() => handleDownload(content.id), 100);
    });
  };

  const handleShare = () => {
    // Create shareable link or export conversation
    const conversationData = {
      messages: messages,
      workContent: workContent.filter(item => item.status === 'completed'),
      timestamp: new Date().toISOString()
    };
    
    // In real implementation, create shareable link
    navigator.clipboard.writeText(`채팅 내용이 클립보드에 복사되었습니다.\n\n메시지 수: ${messages.length}개\n작업 결과물: ${workContent.filter(item => item.status === 'completed').length}개`);
    console.log('Conversation shared:', conversationData);
  };

  const handleContentView = () => {
    // Open content view or force open work panel with content focus
    if (!workPanelOpen) {
      setWorkPanelOpen(true);
    }
    // Could also scroll to content section or highlight completed items
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'hero':
        return (
          <HeroSection
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
          />
        );
      
      case 'chat':
        return (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="h2-20 text-[var(--color-text-strong)]">AI 매니저</h1>
                  {currentWork && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-surface-2)] rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="caption-12 text-[var(--color-text-subtle)]">작업 진행 중</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2 body-14"
                    disabled={messages.length === 0}
                  >
                    <Share2 size={16} />
                    <span>공유</span>
                  </Button>
                  
                  {/* Content Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleContentView}
                    className="flex items-center gap-2 body-14"
                    disabled={workContent.filter(item => item.status === 'completed').length === 0}
                  >
                    <FileText size={16} />
                    <span>컨텐츠</span>
                    {workContent.filter(item => item.status === 'completed').length > 0 && (
                      <div className="w-5 h-5 bg-[var(--color-brand)] text-white rounded-full flex items-center justify-center caption-12">
                        {workContent.filter(item => item.status === 'completed').length}
                      </div>
                    )}
                  </Button>
                  
                  {/* Work Panel Toggle Button - Always show when in chat view */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWorkPanelToggle}
                    className="flex items-center gap-2 body-14"
                    disabled={workContent.length === 0 && !currentWork}
                  >
                    {workPanelOpen ? (
                      <>
                        <Minimize2 size={16} />
                        <span>병합</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={16} />
                        <span>분할</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex">
              {/* Chat Area */}
              <motion.div 
                className="flex flex-col"
                initial={false}
                animate={{ 
                  width: workPanelOpen ? '40%' : '100%'
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-auto p-6 space-y-0"
                >
                  <div className="max-w-4xl mx-auto">
                    {messages.length > 0 && (
                      <DateDivider label="오늘" />
                    )}
                    
                    {messages.map((message) => (
                      message.type === 'user' ? (
                        <UserMessage
                          key={message.id}
                          text={message.content}
                          time={message.timestamp}
                        />
                      ) : (
                        <AIMessage
                          key={message.id}
                          text={message.content}
                          hasCodeBlock={message.content.includes('```')}
                        />
                      )
                    ))}
                    
                    {isTyping && <TypingIndicator />}
                  </div>
                </div>
                
                {/* Chat Input */}
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  disabled={isTyping}
                  multiline={true}
                />
                
                <ScrollToTopButton
                  onClick={handleScrollToTop}
                  visible={showScrollTop}
                />
              </motion.div>

              {/* Work Panel */}
              <AnimatePresence>
                {workPanelOpen && (
                  <motion.div
                    className="w-[60%] h-full"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '60%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  >
                    <WorkPanel
                      isOpen={true}
                      onClose={handleWorkPanelClose}
                      workContent={workContent}
                      onDownload={handleDownload}
                      onDownloadAll={handleDownloadAll}
                      currentWork={currentWork || undefined}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      
      case 'projects':
        return (
          <ProjectsView
            onNewProject={() => console.log('New project')}
            onProjectOpen={(id) => console.log('Open project', id)}
          />
        );
      
      case 'quote':
        return <QuoteSystem
          initialData={quoteData}
          onDataChange={setQuoteData}
        />;
      
      case 'erp':
        return <ERPSystem />;
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-[var(--color-bg)]">
      {/* Sidebar */}
      <SidebarContainer expanded={sidebarExpanded}>
        {/* Header */}
        <SidebarHeader 
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-[5px] py-[0px] mx-[1px] my-[0px]">
          {/* New Chat Button */}
          <SidebarButton
            variant="primary"
            icon={<Plus size={20} />}
            label="새 채팅"
            expanded={sidebarExpanded}
            onClick={handleNewChat}
          />

          {/* Recent Chats */}
          <div className="mb-6">
            <SidebarSectionTitle title="최근 대화" expanded={sidebarExpanded} />
            {recentChats.map((chat, index) => (
              <SidebarChatItem
                key={index}
                title={chat.title}
                time={chat.time}
                expanded={sidebarExpanded}
                onClick={() => {/* Handle chat click */}}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="mb-6">
            <SidebarSectionTitle title="업무" expanded={sidebarExpanded} />
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeNavItem === item.id}
                expanded={sidebarExpanded}
                onClick={() => handleNavItemClick(item.id)}
              />
            ))}
          </div>

          {/* New Project Section */}
          <div className="mb-6">
            <SidebarSectionTitle title="새 프로젝트" expanded={sidebarExpanded} />
            <SidebarButton
              variant="secondary"
              icon={<FolderPlus size={20} />}
              label="새 프로젝트"
              expanded={sidebarExpanded}
              onClick={() => setCurrentView('projects')}
            />
            
            {recentProjects.slice(0, 5).map((project, index) => (
              <SidebarProjectItem
                key={index}
                name={project}
                expanded={sidebarExpanded}
                onOpen={() => console.log('Open project', project)}
                onRename={() => console.log('Rename project', project)}
                onDelete={() => console.log('Delete project', project)}
              />
            ))}
          </div>
        </div>

        {/* Account Menu - Fixed at bottom */}
        <div className="mt-auto">
          <AccountMenu
            expanded={sidebarExpanded}
            onWorkspaceSettings={() => setWorkspaceSettingsOpen(true)}
            onSettings={() => console.log('Settings')}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onHelp={() => console.log('Help')}
            onLogout={() => console.log('Logout')}
            darkMode={darkMode}
          />
        </div>
      </SidebarContainer>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {renderMainContent()}
      </div>

      {/* Workspace Settings Drawer */}
      <WorkspaceSettings
        isOpen={workspaceSettingsOpen}
        onClose={() => setWorkspaceSettingsOpen(false)}
      />

      {/* Work Completion Notification */}
      <WorkNotification
        isVisible={workNotification.visible}
        message={workNotification.message}
        onClose={() => setWorkNotification({ visible: false, message: '' })}
      />
    </div>
  );
}