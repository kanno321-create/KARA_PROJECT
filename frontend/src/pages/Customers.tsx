import React from 'react';
import { Stack, Text, DetailsList, IColumn, SelectionMode, Persona, PersonaSize } from '@fluentui/react';

interface Customer {
  key: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  lastOrder: string;
}

const customers: Customer[] = [
  { key: '1', name: '김철수', company: '삼성전자', email: 'kim@samsung.com', phone: '010-1234-5678', lastOrder: '2025-09-15' },
  { key: '2', name: '이영희', company: 'LG전자', email: 'lee@lg.com', phone: '010-2345-6789', lastOrder: '2025-09-10' },
  { key: '3', name: '박민수', company: 'SK하이닉스', email: 'park@sk.com', phone: '010-3456-7890', lastOrder: '2025-09-05' },
];

const columns: IColumn[] = [
  {
    key: 'name',
    name: '고객명',
    fieldName: 'name',
    minWidth: 150,
    maxWidth: 200,
    onRender: (item: Customer) => (
      <Persona text={item.name} secondaryText={item.company} size={PersonaSize.size32} />
    ),
  },
  { key: 'email', name: '이메일', fieldName: 'email', minWidth: 150, maxWidth: 200 },
  { key: 'phone', name: '연락처', fieldName: 'phone', minWidth: 120, maxWidth: 150 },
  { key: 'lastOrder', name: '최근 거래', fieldName: 'lastOrder', minWidth: 100, maxWidth: 150 },
];

const Customers: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          고객 관리
        </Text>
      </Stack>
      
      <Stack horizontal tokens={{ childrenGap: 40 }}>
        <Stack>
          <Text variant="medium">총 고객수</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>342</Text>
        </Stack>
        <Stack>
          <Text variant="medium">신규 고객 (이번 달)</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600, color: '#107c10' } }}>12</Text>
        </Stack>
      </Stack>
      
      <DetailsList
        items={customers}
        columns={columns}
        selectionMode={SelectionMode.none}
        isHeaderVisible={true}
      />
    </Stack>
  );
};

export default Customers;