import React from 'react';
import { Stack, Text, DetailsList, IColumn, SelectionMode, ProgressIndicator } from '@fluentui/react';

interface InventoryItem {
  key: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
}

const items: InventoryItem[] = [
  { key: '1', name: 'LCD 모니터 27인치', category: '전자제품', quantity: 45, unit: '대', status: '정상' },
  { key: '2', name: '노트북 충전기', category: '액세서리', quantity: 12, unit: '개', status: '부족' },
  { key: '3', name: 'USB 케이블', category: '케이블', quantity: 230, unit: '개', status: '정상' },
];

const columns: IColumn[] = [
  { key: 'name', name: '품명', fieldName: 'name', minWidth: 150, maxWidth: 250 },
  { key: 'category', name: '카테고리', fieldName: 'category', minWidth: 100, maxWidth: 150 },
  { key: 'quantity', name: '수량', fieldName: 'quantity', minWidth: 60, maxWidth: 80 },
  { key: 'unit', name: '단위', fieldName: 'unit', minWidth: 50, maxWidth: 70 },
  { key: 'status', name: '상태', fieldName: 'status', minWidth: 60, maxWidth: 100 },
];

const Inventory: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        재고 관리
      </Text>
      
      <Stack horizontal tokens={{ childrenGap: 40 }}>
        <Stack>
          <Text variant="medium">총 재고 품목</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>287</Text>
        </Stack>
        <Stack>
          <Text variant="medium">부족 품목</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600, color: '#d13438' } }}>5</Text>
        </Stack>
        <Stack>
          <Text variant="medium">경고 품목</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600, color: '#ffb900' } }}>12</Text>
        </Stack>
      </Stack>

      <ProgressIndicator label="재고 사용률" percentComplete={0.73} />
      
      <DetailsList
        items={items}
        columns={columns}
        selectionMode={SelectionMode.none}
        isHeaderVisible={true}
      />
    </Stack>
  );
};

export default Inventory;