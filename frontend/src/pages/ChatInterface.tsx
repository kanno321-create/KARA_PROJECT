import React, { useState, useRef, useEffect } from 'react';
import {
  Stack,
  TextField,
  IconButton,
  Text,
  mergeStyles,
} from '@fluentui/react';
import Sidebar from '../components/Sidebar';

const containerStyles = mergeStyles({
  height: '100vh',
  width: '100%',
  display: 'flex',
  backgroundColor: '#ffffff',
  position: 'relative',
});

const chatContainerStyles = (collapsed: boolean) => mergeStyles({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  marginLeft: collapsed ? '60px' : '280px',
  transition: 'margin-left 0.3s ease',
  height: '100vh',
  position: 'relative',
});

const welcomeScreenStyles = mergeStyles({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
});

const companyLogoStyles = mergeStyles({
  fontSize: '48px',
  fontWeight: 700,
  color: '#0078d4',
  marginBottom: '16px',
});

const welcomeTextStyles = mergeStyles({
  fontSize: '24px',
  color: '#605e5c',
  marginBottom: '40px',
});

const messagesContainerStyles = mergeStyles({
  flex: 1,
  overflowY: 'auto',
  padding: '20px 40px',
  maxWidth: '768px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
});

const messageStyles = mergeStyles({
  padding: '12px 16px',
  marginBottom: '16px',
  borderRadius: '8px',
  maxWidth: '70%',
  wordWrap: 'break-word',
});

const userMessageStyles = mergeStyles({
  backgroundColor: '#f3f2f1',
  marginLeft: 'auto',
  color: '#323130',
});

const aiMessageStyles = mergeStyles({
  backgroundColor: '#ffffff',
  border: '1px solid #edebe9',
  color: '#323130',
});

const inputContainerStyles = mergeStyles({
  padding: '20px 40px',
  maxWidth: '768px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
});

const inputWrapperStyles = mergeStyles({
  display: 'flex',
  alignItems: 'flex-end',
  gap: '8px',
  padding: '12px',
  borderRadius: '24px',
  border: '1px solid #d1d1d1',
  backgroundColor: '#ffffff',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
});

const textFieldStyles = mergeStyles({
  flex: 1,
  '.ms-TextField-fieldGroup': {
    border: 'none',
    backgroundColor: 'transparent',
  },
  '.ms-TextField-field': {
    backgroundColor: 'transparent',
    fontSize: '15px',
  },
});

const resultPanelStyles = mergeStyles({
  width: '400px',
  height: '100vh',
  backgroundColor: '#f9f9f9',
  borderLeft: '1px solid #edebe9',
  padding: '20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 99,
});

const resultHeaderStyles = mergeStyles({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #edebe9',
});

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
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
      // 파일 업로드 처리 로직
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
      // 드래그 앤 드롭 파일 처리
    }
  };

  const toggleResultPanel = () => {
    setShowResultPanel(!showResultPanel);
  };

  return (
    <div className={containerStyles}>
      <Sidebar onCollapseChange={setIsSidebarCollapsed} collapsed={isSidebarCollapsed} />

      <div
        className={chatContainerStyles(isSidebarCollapsed)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          <div className={welcomeScreenStyles}>
            <div className={companyLogoStyles}>㈜한국산업</div>
            <div className={welcomeTextStyles}>무엇을 도와드릴까요?</div>

            <div className={inputContainerStyles}>
              <div className={inputWrapperStyles}>
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
                  className={textFieldStyles}
                  placeholder="무엇이든 물어보세요"
                  value={inputValue}
                  onChange={(e, newValue) => setInputValue(newValue || '')}
                  onKeyPress={handleKeyPress}
                  multiline
                  autoAdjustHeight
                  disabled={isLoading}
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
        ) : (
          <>
            <div className={messagesContainerStyles}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${messageStyles} ${
                    message.sender === 'user' ? userMessageStyles : aiMessageStyles
                  }`}
                >
                  <Text>{message.text}</Text>
                  <Text
                    variant="tiny"
                    styles={{
                      root: {
                        marginTop: '4px',
                        opacity: 0.7,
                        color: '#605e5c',
                      },
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={inputContainerStyles}>
              <div className={inputWrapperStyles}>
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
                  className={textFieldStyles}
                  placeholder="메시지를 입력하세요..."
                  value={inputValue}
                  onChange={(e, newValue) => setInputValue(newValue || '')}
                  onKeyPress={handleKeyPress}
                  multiline
                  autoAdjustHeight
                  disabled={isLoading}
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
          </>
        )}
      </div>

      {/* 결과 패널 */}
      {showResultPanel && (
        <div className={resultPanelStyles}>
          <div className={resultHeaderStyles}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              작업 결과
            </Text>
            <IconButton
              iconProps={{ iconName: 'Cancel' }}
              title="패널 닫기"
              onClick={toggleResultPanel}
            />
          </div>

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

      {/* 결과 패널이 닫혀있을 때 다시 열기 버튼 */}
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
              zIndex: 98,
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

export default ChatInterface;