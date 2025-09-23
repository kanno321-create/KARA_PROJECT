import React from 'react';
import { Stack, Text, DetailsList, IColumn, SelectionMode, DefaultButton, SearchBox, Dropdown, IDropdownOption } from '@fluentui/react';

interface EstimateItem {
  key: string;
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

const items: EstimateItem[] = [
  { key: '1', id: 'EST-2025-001', customer: '삼성전자', date: '2025-09-21', amount: '5,240,000', status: '진행중' },
  { key: '2', id: 'EST-2025-002', customer: 'LG전자', date: '2025-09-20', amount: '3,120,000', status: '완료' },
  { key: '3', id: 'EST-2025-003', customer: 'SK하이닉스', date: '2025-09-19', amount: '8,750,000', status: '대기중' },
];

const columns: IColumn[] = [
  { key: 'id', name: '견적번호', fieldName: 'id', minWidth: 100, maxWidth: 150 },
  { key: 'customer', name: '고객명', fieldName: 'customer', minWidth: 150, maxWidth: 200 },
  { key: 'date', name: '작성일', fieldName: 'date', minWidth: 100, maxWidth: 150 },
  { key: 'amount', name: '금액', fieldName: 'amount', minWidth: 100, maxWidth: 150 },
  { key: 'status', name: '상태', fieldName: 'status', minWidth: 80, maxWidth: 100 },
];

const statusOptions: IDropdownOption[] = [
  { key: 'all', text: '전체' },
  { key: 'pending', text: '대기중' },
  { key: 'progress', text: '진행중' },
  { key: 'completed', text: '완료' },
];

const Estimates: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          견적서 관리
        </Text>
        <DefaultButton text="새 견적서" iconProps={{ iconName: 'Add' }} primary />
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 12 }}>
        <SearchBox
          placeholder="견적서 검색..."
          styles={{ root: { width: 300 } }}
        />
        <Dropdown
          placeholder="상태 선택"
          options={statusOptions}
          styles={{ root: { width: 150 } }}
        />
      </Stack>

      <DetailsList
        items={items}
        columns={columns}
        selectionMode={SelectionMode.none}
        isHeaderVisible={true}
        styles={{
          root: {
            '.ms-DetailsHeader': {
              paddingTop: 0,
            },
          },
        }}
      />
    </Stack>
  );
};

export default Estimates;