import React from 'react';
import { Stack, Text, Toggle, TextField, PrimaryButton, DefaultButton, Separator, Dropdown, IDropdownOption } from '@fluentui/react';

const languageOptions: IDropdownOption[] = [
  { key: 'ko', text: '한국어' },
  { key: 'en', text: 'English' },
  { key: 'ja', text: '日本語' },
];

const themeOptions: IDropdownOption[] = [
  { key: 'light', text: '라이트 모드' },
  { key: 'dark', text: '다크 모드' },
  { key: 'auto', text: '시스템 설정 따라감' },
];

const Settings: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        설정
      </Text>
      
      <Stack tokens={{ childrenGap: 20 }}>
        <Stack>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 16 } }}>
            일반 설정
          </Text>
          <Stack tokens={{ childrenGap: 16 }}>
            <TextField label="회사명" defaultValue="(주)한국산업" />
            <TextField label="사업자 번호" defaultValue="123-45-67890" />
            <Dropdown
              label="언어"
              options={languageOptions}
              defaultSelectedKey="ko"
            />
            <Dropdown
              label="테마"
              options={themeOptions}
              defaultSelectedKey="light"
            />
          </Stack>
        </Stack>
        
        <Separator />
        
        <Stack>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 16 } }}>
            AI 설정
          </Text>
          <Stack tokens={{ childrenGap: 16 }}>
            <TextField label="OpenAI API 키" type="password" placeholder="sk-..." />
            <Toggle label="AI 자동 응답" defaultChecked />
            <Toggle label="데이터 학습 허용" />
          </Stack>
        </Stack>
        
        <Separator />
        
        <Stack>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 16 } }}>
            알림 설정
          </Text>
          <Stack tokens={{ childrenGap: 12 }}>
            <Toggle label="이메일 알림" defaultChecked />
            <Toggle label="시스템 알림" defaultChecked />
            <Toggle label="모바일 푸시 알림" />
          </Stack>
        </Stack>
        
        <Separator />
        
        <Stack>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 16 } }}>
            데이터 관리
          </Text>
          <Stack tokens={{ childrenGap: 12 }}>
            <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
              마지막 백업: 2025년 9월 21일 오전 10:30
            </Text>
            <Stack horizontal tokens={{ childrenGap: 12 }}>
              <PrimaryButton text="지금 백업" iconProps={{ iconName: 'CloudUpload' }} />
              <DefaultButton text="백업 복원" iconProps={{ iconName: 'CloudDownload' }} />
              <DefaultButton text="데이터 내보내기" iconProps={{ iconName: 'Export' }} />
            </Stack>
          </Stack>
        </Stack>
        
        <Stack horizontal tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 20 } }}>
          <PrimaryButton text="저장" iconProps={{ iconName: 'Save' }} />
          <DefaultButton text="취소" />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Settings;