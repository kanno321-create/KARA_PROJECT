import React from 'react';
import { Stack, Text, Pivot, PivotItem } from '@fluentui/react';

const SalesPurchase: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        판매/구매 관리
      </Text>
      
      <Pivot>
        <PivotItem headerText="판매">
          <Stack styles={{ root: { marginTop: 20 } }}>
            <Text>판매 내역이 표시됩니다.</Text>
          </Stack>
        </PivotItem>
        <PivotItem headerText="구매">
          <Stack styles={{ root: { marginTop: 20 } }}>
            <Text>구매 내역이 표시됩니다.</Text>
          </Stack>
        </PivotItem>
        <PivotItem headerText="거래처">
          <Stack styles={{ root: { marginTop: 20 } }}>
            <Text>거래처 목록이 표시됩니다.</Text>
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};

export default SalesPurchase;