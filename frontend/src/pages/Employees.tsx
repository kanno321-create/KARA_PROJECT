import React from 'react';
import { Stack, Text, Persona, PersonaSize, mergeStyles } from '@fluentui/react';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
}

const employees: Employee[] = [
  { id: '1', name: '이충원', position: '대표이사', department: '경영진', email: 'ceo@kis.com', phone: '010-1111-2222' },
  { id: '2', name: '김진수', position: '부장', department: '영업부', email: 'kim@kis.com', phone: '010-3333-4444' },
  { id: '3', name: '박서연', position: '과장', department: '개발부', email: 'park@kis.com', phone: '010-5555-6666' },
  { id: '4', name: '최민준', position: '대리', department: '재무부', email: 'choi@kis.com', phone: '010-7777-8888' },
];

const cardStyles = mergeStyles({
  width: 280,
  padding: 16,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  border: '1px solid #edebe9',
  transition: 'box-shadow 0.3s ease',
  ':hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
});

const Employees: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
        직원 관리
      </Text>
      
      <Stack horizontal tokens={{ childrenGap: 40 }}>
        <Stack>
          <Text variant="medium">총 직원수</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>24</Text>
        </Stack>
        <Stack>
          <Text variant="medium">부서 수</Text>
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>6</Text>
        </Stack>
      </Stack>
      
      <Stack horizontal wrap tokens={{ childrenGap: 16 }}>
        {employees.map((employee) => (
          <div key={employee.id} className={cardStyles}>
            <Persona
              text={employee.name}
              secondaryText={employee.position}
              tertiaryText={employee.department}
              size={PersonaSize.size48}
            />
            <Stack styles={{ root: { marginTop: 12 } }} tokens={{ childrenGap: 4 }}>
              <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                {employee.email}
              </Text>
              <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                {employee.phone}
              </Text>
            </Stack>
          </div>
        ))}
      </Stack>
    </Stack>
  );
};

export default Employees;