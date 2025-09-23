import React, { useState, useRef, useEffect } from 'react';
import {
  Stack,
  TextField,
  IconButton,
  Text,
} from '@fluentui/react';
import StableSidebar from '../components/StableSidebar';
import '../styles/chatgpt-layout.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const StableChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [resultHistory, setResultHistory] = useState<any[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsLoading(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: `"${inputValue}"에 대한 응답을 처리했습니다.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);

      // 작업 결과가 있을 때 결과 패널 표시
      if (inputValue.includes('견적') || inputValue.includes('분석')) {
        setShowResultPanel(true);
        setResultHistory(prev => [...prev, {
          id: Date.now(),
          title: inputValue.substring(0, 30),
          timestamp: new Date(),
          content: '처리 결과...'
        }]);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('Files dropped:', files);
    }
  };

  const toggleResultPanel = () => {
    setShowResultPanel(!showResultPanel);
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 사이드바 */}
      <StableSidebar onCollapseChange={setIsSidebarCollapsed} />

      {/* 메인 영역 */}
      <main className="main-container" onDragOver={handleDragOver} onDrop={handleDrop}>
        {/* 버전 정보 헤더 */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #edebe9',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Text styles={{ root: { fontSize: '14px', color: '#605e5c' } }}>
            KIS CORE v2.0.0
          </Text>
          <Text styles={{ root: { fontSize: '14px', color: '#605e5c' } }}>
            •
          </Text>
          <Text styles={{ root: { fontSize: '14px', color: '#0078d4', fontWeight: 500 } }}>
            ChatGPT-5 Thinking
          </Text>
        </div>
        <div className="main-content">
          {messages.length === 0 ? (
            /* 웰컴 화면 */
            <div className="welcome-screen">
              <div className="company-logo">㈜한국산업</div>
              <div className="welcome-text">무엇을 도와드릴까요?</div>

              <div className="input-container">
                <div className="input-wrapper">
                  <div className="input-box">
                    <IconButton
                      iconProps={{ iconName: 'Add' }}
                      title="파일 첨부"
                      onClick={handleFileUpload}
                      styles={{
                        root: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          ':hover': {
                            backgroundColor: '#f3f2f1',
                          },
                        },
                      }}
                    />
                    <TextField
                      placeholder="무엇이든 물어보세요"
                      value={inputValue}
                      onChange={(e, newValue) => setInputValue(newValue || '')}
                      onKeyPress={handleKeyPress}
                      multiline
                      autoAdjustHeight
                      disabled={isLoading}
                      styles={{
                        root: {
                          flex: 1,
                          width: '100%',
                        },
                        fieldGroup: {
                          border: 'none',
                          backgroundColor: 'transparent',
                          minHeight: '48px',
                        },
                        field: {
                          backgroundColor: 'transparent',
                          fontSize: '17px',
                          lineHeight: '26px',
                          minHeight: '52px',
                          padding: '14px 0',
                        },
                      }}
                    />
                    <IconButton
                      iconProps={{ iconName: 'Send' }}
                      title="전송"
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      styles={{
                        root: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: inputValue.trim() ? '#0078d4' : 'transparent',
                          color: inputValue.trim() ? '#ffffff' : '#605e5c',
                          ':hover': {
                            backgroundColor: inputValue.trim() ? '#106ebe' : '#f3f2f1',
                          },
                          ':disabled': {
                            backgroundColor: 'transparent',
                            color: '#c8c6c4',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 메시지 영역 */}
              <div className="messages-container">
                <div className="messages-inner">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${
                        message.sender === 'user' ? 'message-user' : 'message-ai'
                      }`}
                    >
                      <Text
                        styles={{
                          root: {
                            fontSize: '19px',
                            lineHeight: '1.7',
                            color: '#323130',
                          },
                        }}
                      >
                        {message.text}
                      </Text>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 입력 영역 */}
              <div className="input-container">
                <div className="input-wrapper">
                  <div className="input-box">
                    <IconButton
                      iconProps={{ iconName: 'Add' }}
                      title="파일 첨부"
                      onClick={handleFileUpload}
                      styles={{
                        root: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          ':hover': {
                            backgroundColor: '#f3f2f1',
                          },
                        },
                      }}
                    />
                    <TextField
                      placeholder="메시지를 입력하세요..."
                      value={inputValue}
                      onChange={(e, newValue) => setInputValue(newValue || '')}
                      onKeyPress={handleKeyPress}
                      multiline
                      autoAdjustHeight
                      disabled={isLoading}
                      styles={{
                        root: {
                          flex: 1,
                          width: '100%',
                        },
                        fieldGroup: {
                          border: 'none',
                          backgroundColor: 'transparent',
                          minHeight: '48px',
                        },
                        field: {
                          backgroundColor: 'transparent',
                          fontSize: '17px',
                          lineHeight: '26px',
                          minHeight: '52px',
                          padding: '14px 0',
                        },
                      }}
                    />
                    <IconButton
                      iconProps={{ iconName: 'Send' }}
                      title="전송"
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      styles={{
                        root: {
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: inputValue.trim() ? '#0078d4' : 'transparent',
                          color: inputValue.trim() ? '#ffffff' : '#605e5c',
                          ':hover': {
                            backgroundColor: inputValue.trim() ? '#106ebe' : '#f3f2f1',
                          },
                          ':disabled': {
                            backgroundColor: 'transparent',
                            color: '#c8c6c4',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* 결과 패널 */}
      {showResultPanel && (
        <div className="result-panel">
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #edebe9' } }}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              작업 결과
            </Text>
            <IconButton
              iconProps={{ iconName: 'Cancel' }}
              title="패널 닫기"
              onClick={toggleResultPanel}
            />
          </Stack>

          <Stack tokens={{ childrenGap: 12 }}>
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <IconButton
                iconProps={{ iconName: 'Download' }}
                title="다운로드"
                text="다운로드"
              />
              <IconButton
                iconProps={{ iconName: 'History' }}
                title="작업 기록"
                text="기록"
              />
            </Stack>

            {resultHistory.map((result) => (
              <Stack
                key={result.id}
                styles={{
                  root: {
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '4px',
                    border: '1px solid #edebe9',
                  },
                }}
              >
                <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                  {result.title}
                </Text>
                <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                  {result.timestamp.toLocaleString()}
                </Text>
                <Text>{result.content}</Text>
              </Stack>
            ))}
          </Stack>
        </div>
      )}

      {/* 결과 패널 토글 버튼 */}
      {!showResultPanel && resultHistory.length > 0 && (
        <IconButton
          iconProps={{ iconName: 'DoubleChevronLeft' }}
          title="결과 패널 열기"
          onClick={toggleResultPanel}
          styles={{
            root: {
              position: 'fixed',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              ':hover': {
                backgroundColor: '#f3f2f1',
              },
              zIndex: 9,
            },
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        multiple
        onChange={handleFileChange}
      />
    </div>
  );
};

export default StableChatInterface;