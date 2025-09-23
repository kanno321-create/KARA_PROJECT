import React, { useState } from 'react';
import {
  Stack,
  TextField,
  ComboBox,
  PrimaryButton,
  DefaultButton,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Text,
  Label,
  Separator,
} from '@fluentui/react';

// 데이터 타입 정의
interface ClientInfo {
  company: string;
  phone: string;
  email: string;
}

interface EnclosureInfo {
  place: string;  // 설치
  kind: string;   // 함종류
  material: string; // 재질
  misc: string;   // 기타요청
  customPrice: string; // 주문제작 단가
}

interface MainBreaker {
  type: string;   // 종류 (MCCB, ELB)
  poles: string;  // 극수 (2P, 3P, 4P)
  capacity: string; // 용량 (15A~800A)
  brand: string;  // 브랜드
  quantity: string; // 수량
}

interface BranchBreaker {
  type: string;
  poles: string;
  capacity: string;
  quantity: string;
}

interface Accessory {
  name: string;
  quantity: number;
}

interface EstimateLine {
  no: number;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}

const EstimateComponent: React.FC = () => {
  // 상태 관리
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    company: '',
    phone: '',
    email: ''
  });

  const [enclosureInfo, setEnclosureInfo] = useState<EnclosureInfo>({
    place: '옥내',
    kind: '기성함',
    material: 'STEEL 1.6T',
    misc: '',
    customPrice: ''
  });

  const [mainBreaker, setMainBreaker] = useState<MainBreaker>({
    type: 'MCCB',
    poles: '4P',
    capacity: '100A',
    brand: '',
    quantity: '1'
  });

  const [branches, setBranches] = useState<BranchBreaker[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [estimateLines, setEstimateLines] = useState<EstimateLine[]>([]);
  const [estimateTitle, setEstimateTitle] = useState('(견적 없음)');
  const [estimateTotal, setEstimateTotal] = useState(0);

  // 옵션 데이터
  const placeOptions = [
    { key: '옥내', text: '옥내' },
    { key: '옥외', text: '옥외' },
    { key: '옥내자립', text: '옥내자립' },
    { key: '옥외자립', text: '옥외자립' },
    { key: '전주부착형', text: '전주부착형' }
  ];

  const kindOptions = [
    { key: '기성함', text: '기성함' },
    { key: '주문제작함', text: '주문제작함' },
    { key: '계량기함', text: '계량기함' },
    { key: 'CT계량기함', text: 'CT계량기함' },
    { key: 'FRP 박스', text: 'FRP 박스' },
    { key: '하이박스', text: '하이박스' }
  ];

  const materialOptions = [
    { key: 'STEEL 1.0T', text: 'STEEL 1.0T' },
    { key: 'STEEL 1.6T', text: 'STEEL 1.6T' },
    { key: 'STEEL 2.0T', text: 'STEEL 2.0T' },
    { key: 'SUS201 1.0T', text: 'SUS201 1.0T' },
    { key: 'SUS201 1.2T', text: 'SUS201 1.2T' },
    { key: 'SUS201 1.5T', text: 'SUS201 1.5T' },
    { key: 'SUS304 1.2T', text: 'SUS304 1.2T' },
    { key: 'SUS304 1.5T', text: 'SUS304 1.5T' },
    { key: 'SUS304 2.0T', text: 'SUS304 2.0T' }
  ];

  const typeOptions = [
    { key: 'MCCB', text: 'MCCB' },
    { key: 'ELB', text: 'ELB' }
  ];

  const polesOptions = [
    { key: '2P', text: '2P' },
    { key: '3P', text: '3P' },
    { key: '4P', text: '4P' }
  ];

  const capacityOptions = [
    '15A', '20A', '30A', '40A', '50A', '60A', '75A', '100A', '125A', '150A',
    '175A', '200A', '225A', '250A', '300A', '350A', '400A', '500A', '600A',
    '630A', '700A', '800A'
  ].map(cap => ({ key: cap, text: cap }));

  // 테이블 컬럼 정의
  const estimateColumns: IColumn[] = [
    {
      key: 'no',
      name: 'No',
      fieldName: 'no',
      minWidth: 50,
      maxWidth: 50,
      isResizable: false,
    },
    {
      key: 'name',
      name: '품명',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'spec',
      name: '규격',
      fieldName: 'spec',
      minWidth: 250,
      maxWidth: 400,
      isResizable: true,
    },
    {
      key: 'unit',
      name: '단위',
      fieldName: 'unit',
      minWidth: 60,
      maxWidth: 80,
      isResizable: false,
    },
    {
      key: 'quantity',
      name: '수량',
      fieldName: 'quantity',
      minWidth: 70,
      maxWidth: 100,
      isResizable: false,
    },
    {
      key: 'price',
      name: '단가',
      fieldName: 'price',
      minWidth: 120,
      maxWidth: 150,
      isResizable: false,
      onRender: (item: EstimateLine) => `${item.price.toLocaleString()}원`
    },
    {
      key: 'amount',
      name: '금액',
      fieldName: 'amount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: false,
      onRender: (item: EstimateLine) => `${item.amount.toLocaleString()}원`
    }
  ];

  // 분기 차단기 추가
  const addBranch = () => {
    const newBranch: BranchBreaker = {
      type: 'MCCB',
      poles: '2P',
      capacity: '30A',
      quantity: '1'
    };
    setBranches([...branches, newBranch]);
  };

  // 분기 차단기 삭제
  const removeBranch = (index: number) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  // 견적 생성 (시뮬레이션)
  const generateEstimate = () => {
    // 간단한 견적 계산 시뮬레이션
    const lines: EstimateLine[] = [
      {
        no: 1,
        name: '배전반함체',
        spec: `${enclosureInfo.material} ${enclosureInfo.place}용`,
        unit: 'EA',
        quantity: 1,
        price: 150000,
        amount: 150000
      },
      {
        no: 2,
        name: `메인 차단기 ${mainBreaker.type}`,
        spec: `${mainBreaker.poles} ${mainBreaker.capacity}`,
        unit: 'EA',
        quantity: parseInt(mainBreaker.quantity) || 1,
        price: 80000,
        amount: 80000 * (parseInt(mainBreaker.quantity) || 1)
      }
    ];

    // 분기 차단기 추가
    branches.forEach((branch, index) => {
      lines.push({
        no: lines.length + 1,
        name: `분기 차단기 ${branch.type}`,
        spec: `${branch.poles} ${branch.capacity}`,
        unit: 'EA',
        quantity: parseInt(branch.quantity) || 1,
        price: 25000,
        amount: 25000 * (parseInt(branch.quantity) || 1)
      });
    });

    // 부속자재 추가
    accessories.forEach(acc => {
      lines.push({
        no: lines.length + 1,
        name: acc.name,
        spec: '',
        unit: 'EA',
        quantity: acc.quantity,
        price: 15000,
        amount: 15000 * acc.quantity
      });
    });

    const total = lines.reduce((sum, line) => sum + line.amount, 0);

    setEstimateLines(lines);
    setEstimateTotal(total);
    setEstimateTitle(`배전반 견적 | 메인 ${mainBreaker.type} ${mainBreaker.poles} ${mainBreaker.capacity} | 분기 ${branches.length}개`);
  };

  // 화면 지우기
  const clearAll = () => {
    setEstimateLines([]);
    setEstimateTotal(0);
    setEstimateTitle('(견적 없음)');
  };

  return (
    <div style={{ padding: '20px', height: '100vh', overflow: 'auto' }}>
      <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { height: '100%' } }}>

        {/* 좌측 입력 영역 */}
        <Stack tokens={{ childrenGap: 15 }} styles={{ root: { width: '400px' } }}>

          {/* 고객 정보 */}
          <Stack tokens={{ childrenGap: 10 }} styles={{ root: { padding: '15px', border: '1px solid #d1d1d1', borderRadius: '4px' } }}>
            <Label styles={{ root: { fontSize: '16px', fontWeight: 600 } }}>고객 정보</Label>
            <TextField
              label="업체명"
              value={clientInfo.company}
              onChange={(_, value) => setClientInfo({...clientInfo, company: value || ''})}
            />
            <TextField
              label="연락처"
              value={clientInfo.phone}
              onChange={(_, value) => setClientInfo({...clientInfo, phone: value || ''})}
            />
            <TextField
              label="이메일"
              value={clientInfo.email}
              onChange={(_, value) => setClientInfo({...clientInfo, email: value || ''})}
            />
          </Stack>

          {/* 외함 정보 */}
          <Stack tokens={{ childrenGap: 10 }} styles={{ root: { padding: '15px', border: '1px solid #d1d1d1', borderRadius: '4px' } }}>
            <Label styles={{ root: { fontSize: '16px', fontWeight: 600 } }}>외함</Label>
            <ComboBox
              label="설치"
              options={placeOptions}
              selectedKey={enclosureInfo.place}
              onChange={(_, option) => option && setEnclosureInfo({...enclosureInfo, place: option.key as string})}
            />
            <ComboBox
              label="함종류"
              options={kindOptions}
              selectedKey={enclosureInfo.kind}
              onChange={(_, option) => option && setEnclosureInfo({...enclosureInfo, kind: option.key as string})}
            />
            <ComboBox
              label="재질"
              options={materialOptions}
              selectedKey={enclosureInfo.material}
              onChange={(_, option) => option && setEnclosureInfo({...enclosureInfo, material: option.key as string})}
            />
            <TextField
              label="기타요청"
              value={enclosureInfo.misc}
              onChange={(_, value) => setEnclosureInfo({...enclosureInfo, misc: value || ''})}
            />
          </Stack>

          {/* 메인 차단기 */}
          <Stack tokens={{ childrenGap: 10 }} styles={{ root: { padding: '15px', border: '1px solid #d1d1d1', borderRadius: '4px' } }}>
            <Label styles={{ root: { fontSize: '16px', fontWeight: 600 } }}>메인 차단기</Label>
            <ComboBox
              label="종류"
              options={typeOptions}
              selectedKey={mainBreaker.type}
              onChange={(_, option) => option && setMainBreaker({...mainBreaker, type: option.key as string})}
            />
            <ComboBox
              label="극수"
              options={polesOptions}
              selectedKey={mainBreaker.poles}
              onChange={(_, option) => option && setMainBreaker({...mainBreaker, poles: option.key as string})}
            />
            <ComboBox
              label="용량"
              options={capacityOptions}
              selectedKey={mainBreaker.capacity}
              onChange={(_, option) => option && setMainBreaker({...mainBreaker, capacity: option.key as string})}
            />
            <TextField
              label="브랜드"
              value={mainBreaker.brand}
              onChange={(_, value) => setMainBreaker({...mainBreaker, brand: value || ''})}
            />
            <TextField
              label="수량"
              value={mainBreaker.quantity}
              onChange={(_, value) => setMainBreaker({...mainBreaker, quantity: value || '1'})}
            />
          </Stack>

          {/* 분기 차단기 */}
          <Stack tokens={{ childrenGap: 10 }} styles={{ root: { padding: '15px', border: '1px solid #d1d1d1', borderRadius: '4px' } }}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
              <Label styles={{ root: { fontSize: '16px', fontWeight: 600 } }}>분기 차단기</Label>
              <PrimaryButton text="분기 추가" onClick={addBranch} />
            </Stack>
            {branches.map((branch, index) => (
              <Stack key={index} horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                <ComboBox
                  label="종류"
                  options={typeOptions}
                  selectedKey={branch.type}
                  onChange={(_, option) => {
                    if (option) {
                      const newBranches = [...branches];
                      newBranches[index].type = option.key as string;
                      setBranches(newBranches);
                    }
                  }}
                  styles={{ root: { width: '80px' } }}
                />
                <ComboBox
                  label="극수"
                  options={polesOptions}
                  selectedKey={branch.poles}
                  onChange={(_, option) => {
                    if (option) {
                      const newBranches = [...branches];
                      newBranches[index].poles = option.key as string;
                      setBranches(newBranches);
                    }
                  }}
                  styles={{ root: { width: '70px' } }}
                />
                <ComboBox
                  label="용량"
                  options={capacityOptions}
                  selectedKey={branch.capacity}
                  onChange={(_, option) => {
                    if (option) {
                      const newBranches = [...branches];
                      newBranches[index].capacity = option.key as string;
                      setBranches(newBranches);
                    }
                  }}
                  styles={{ root: { width: '80px' } }}
                />
                <TextField
                  label="수량"
                  value={branch.quantity}
                  onChange={(_, value) => {
                    const newBranches = [...branches];
                    newBranches[index].quantity = value || '1';
                    setBranches(newBranches);
                  }}
                  styles={{ root: { width: '60px' } }}
                />
                <DefaultButton text="삭제" onClick={() => removeBranch(index)} />
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* 중간 버튼 영역 */}
        <Stack tokens={{ childrenGap: 10 }} styles={{ root: { width: '150px' } }} horizontalAlign="center" verticalAlign="center">
          <PrimaryButton text="시스템 견적 생성" onClick={generateEstimate} />
          <PrimaryButton text="AI 견적 생성" onClick={generateEstimate} />
          <DefaultButton text="화면 지우기" onClick={clearAll} />
        </Stack>

        {/* 우측 견적 결과 영역 */}
        <Stack tokens={{ childrenGap: 10 }} styles={{ root: { flex: 1 } }}>

          {/* 견적 제목 및 합계 */}
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              {estimateTitle}
            </Text>
            <Text variant="large" styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>
              합계: {estimateTotal.toLocaleString()} 원
            </Text>
          </Stack>

          <Separator />

          {/* 견적 테이블 */}
          <div style={{ flex: 1, minHeight: '400px' }}>
            <DetailsList
              items={estimateLines}
              columns={estimateColumns}
              layoutMode={DetailsListLayoutMode.justified}
              selectionMode={SelectionMode.none}
              styles={{
                root: {
                  fontSize: '14px'
                }
              }}
            />
          </div>

          {/* 하단 버튼 */}
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton text="엑셀 저장(회사 양식)" />
            <DefaultButton text="CSV 저장" />
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
};

export default EstimateComponent;