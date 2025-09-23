import React from 'react';
import { Stack, Text, MessageBar, MessageBarType } from '@fluentui/react';

const Email: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        이메일 관리
      </Text>
      
      <MessageBar messageBarType={MessageBarType.info}>
        이메일 기능이 공 준비 중입니다.
      </MessageBar>
    </Stack>
  );
};

export default Email;