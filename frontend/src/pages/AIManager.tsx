import React, { useState, useRef, useEffect } from 'react';
import {
  Stack,
  TextField,
  IconButton,
  Text,
  MessageBar,
  MessageBarType,
  Separator,
  ScrollablePane,
  mergeStyles,
  IStackTokens,
  DefaultButton,
  PrimaryButton,
} from '@fluentui/react';

const containerStyles = mergeStyles({
  height: 'calc(100vh - 80px)',
  display: 'flex',
  gap: '20px',
});

const chatPanelStyles = mergeStyles({
  flex: '0 0 40%',
  backgroundColor: '#ffffff',
  border: '1px solid #edebe9',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const resultPanelStyles = mergeStyles({
  flex: '0 0 58%',
  backgroundColor: '#ffffff',
  border: '1px solid #edebe9',
  borderRadius: '8px',
  padding: '20px',
  overflowY: 'auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const messagesContainerStyles = mergeStyles({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  backgroundColor: '#faf9f8',
});

const messageStyles = mergeStyles({
  padding: '12px 16px',
  marginBottom: '12px',
  borderRadius: '8px',
  maxWidth: '80%',
  wordWrap: 'break-word',
});

const userMessageStyles = mergeStyles({
  backgroundColor: '#0078d4',
  color: '#ffffff',
  marginLeft: 'auto',
});

const aiMessageStyles = mergeStyles({
  backgroundColor: '#f3f2f1',
  color: '#323130',
});

const inputContainerStyles = mergeStyles({
  padding: '16px',
  borderTop: '1px solid #edebe9',
  backgroundColor: '#ffffff',
});

const stackTokens: IStackTokens = { childrenGap: 12 };

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIManager: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '안녕하세요! KIS AI 매니저입니다. 무엇을 도와드릴까요?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: `처리 중: "${inputValue}"에 대한 응답을 생성하고 있습니다...`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={containerStyles}>
      <div className={chatPanelStyles}>
        <Stack styles={{ root: { padding: '16px', backgroundColor: '#ffffff' } }}>
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            AI 채팅
          </Text>
        </Stack>
        <Separator />

        <div className={messagesContainerStyles}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${messageStyles} ${
                message.sender === 'user' ? userMessageStyles : aiMessageStyles
              }`}
            >
              <Text variant="medium">{message.text}</Text>
              <Text
                variant="tiny"
                styles={{
                  root: {
                    marginTop: '4px',
                    opacity: 0.8,
                    color: message.sender === 'user' ? '#ffffff' : '#605e5c',
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
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <TextField
              placeholder="메시지를 입력하세요..."
              value={inputValue}
              onChange={(e, newValue) => setInputValue(newValue || '')}
              onKeyPress={handleKeyPress}
              multiline
              autoAdjustHeight
              styles={{ root: { flex: 1 } }}
              disabled={isLoading}
            />
            <IconButton
              iconProps={{ iconName: 'Send' }}
              title="전송"
              ariaLabel="메시지 전송"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              styles={{
                root: {
                  height: '32px',
                  width: '32px',
                  backgroundColor: '#0078d4',
                  color: '#ffffff',
                  ':hover': {
                    backgroundColor: '#106ebe',
                  },
                  ':disabled': {
                    backgroundColor: '#f3f2f1',
                  },
                },
              }}
            />
          </Stack>
        </div>
      </div>

      <div className={resultPanelStyles}>
        <Stack tokens={stackTokens}>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: '16px' } }}>
            AI 처리 결과
          </Text>
          <Separator />

          <MessageBar messageBarType={MessageBarType.info}>
            AI 응답 결과가 여기에 표시됩니다.
          </MessageBar>

          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: '20px' } }}>
            <Stack horizontal tokens={{ childrenGap: 12 }}>
              <DefaultButton text="새 견적서 생성" iconProps={{ iconName: 'Add' }} />
              <DefaultButton text="보고서 생성" iconProps={{ iconName: 'ReportDocument' }} />
              <DefaultButton text="데이터 분석" iconProps={{ iconName: 'AnalyticsReport' }} />
            </Stack>

            <Stack
              styles={{
                root: {
                  padding: '20px',
                  backgroundColor: '#faf9f8',
                  borderRadius: '8px',
                  border: '1px solid #edebe9',
                  minHeight: '200px',
                },
              }}
            >
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                최근 작업
              </Text>
              <Text
                variant="small"
                styles={{ root: { marginTop: '12px', color: '#605e5c' } }}
              >
                아직 처리된 작업이 없습니다.
              </Text>
            </Stack>

            <Stack
              styles={{
                root: {
                  padding: '20px',
                  backgroundColor: '#faf9f8',
                  borderRadius: '8px',
                  border: '1px solid #edebe9',
                },
              }}
            >
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                빠른 도구
              </Text>
              <Stack horizontal wrap tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
                <DefaultButton text="견적 AI" />
                <DefaultButton text="이메일 작성" />
                <DefaultButton text="보고서 작성" />
                <DefaultButton text="데이터 시각화" />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </div>
    </div>
  );
};

export default AIManager;