import React, { useState, useRef, useEffect } from 'react';

interface BranchBreaker {
  type: string;
  poles: string;
  capacity: string;
  quantity: number;
}

interface Accessory {
  category: string;
  detail: string;
  spec: string;
  quantity: number;
  fullName: string;
}

interface CustomerInfo {
  company: string;
  contact: string;
  email: string;
  address: string;
}

interface EnclosureInfo {
  type: string;
  boxType: string;
  material: string;
  request: string;
}

interface MainBreakerInfo {
  type: string;
  poles: string;
  capacity: string;
  brand: string;
}

interface TabData {
  id: number;
  title: string;
  customerInfo: CustomerInfo;
  enclosureInfo: EnclosureInfo;
  mainBreakerInfo: MainBreakerInfo;
  branchBreakers: BranchBreaker[];
  accessories: Accessory[];
  estimateVisible: boolean;
}

interface QuoteSystemProps {
  initialData?: {
    activeTabId: number;
    nextTabId: number;
    tabs: TabData[];
  };
  onDataChange?: (data: any) => void;
}

export function QuoteSystem({ initialData, onDataChange }: QuoteSystemProps = {}) {
  // localStorage에서 데이터 복원 시도
  const getInitialData = () => {
    try {
      const savedData = localStorage.getItem('quoteSystemData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved quote data', e);
    }
    return initialData;
  };

  const savedData = getInitialData();

  // 탭 관리 상태 - localStorage나 initialData가 있으면 사용, 없으면 기본값 사용
  const [activeTabId, setActiveTabId] = useState(savedData?.activeTabId || 1);
  const [nextTabId, setNextTabId] = useState(savedData?.nextTabId || 2);
  const [tabs, setTabs] = useState<TabData[]>(savedData?.tabs || [{
    id: 1,
    title: '견적서 1',
    customerInfo: {
      company: '',
      contact: '',
      email: '',
      address: ''
    },
    enclosureInfo: {
      type: '옥내',
      boxType: '',
      material: '',
      request: ''
    },
    mainBreakerInfo: {
      type: 'MCCB',
      poles: '',
      capacity: '',
      brand: ''
    },
    branchBreakers: [],
    accessories: [],
    estimateVisible: false
  }]);

  // 현재 활성 탭의 데이터 가져오기
  const currentTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const [branchBreakers, setBranchBreakers] = useState<BranchBreaker[]>(currentTab.branchBreakers);
  const [accessories, setAccessories] = useState<Accessory[]>(currentTab.accessories);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(currentTab.customerInfo);
  const [enclosureInfo, setEnclosureInfo] = useState<EnclosureInfo>(currentTab.enclosureInfo);
  const [mainBreakerInfo, setMainBreakerInfo] = useState<MainBreakerInfo>(currentTab.mainBreakerInfo);
  const [estimateVisible, setEstimateVisible] = useState(currentTab.estimateVisible);
  const [completeSummaryShown, setCompleteSummaryShown] = useState(false);
  
  // AI 채팅 관련 상태
  const [aiChatVisible, setAiChatVisible] = useState(false);
  const [aiFiles, setAiFiles] = useState<File[]>([]);
  const [aiMessages, setAiMessages] = useState([
    { type: 'ai', content: '안녕하세요! 도면이나 자료를 업로드하시면 자동으로 견적을 생성해드립니다. 견적 관련 궁금한 것이 있으시면 언제든 물어보세요.' }
  ]);

  // 탭 데이터가 변경될 때 tabs 배열 업데이트
  const updateCurrentTabData = () => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        return {
          ...tab,
          branchBreakers,
          accessories,
          customerInfo,
          enclosureInfo,
          mainBreakerInfo,
          estimateVisible
        };
      }
      return tab;
    }));
  };

  // 데이터가 변경될 때마다 현재 탭 업데이트
  useEffect(() => {
    updateCurrentTabData();
  }, [branchBreakers, accessories, customerInfo, enclosureInfo, mainBreakerInfo, estimateVisible]);

  // 부모 컴포넌트에 데이터 전달 및 localStorage 저장
  useEffect(() => {
    const data = {
      activeTabId,
      nextTabId,
      tabs
    };

    // localStorage에 저장
    localStorage.setItem('quoteSystemData', JSON.stringify(data));

    // 부모 컴포넌트에 전달
    if (onDataChange) {
      onDataChange(data);
    }
  }, [tabs, activeTabId, nextTabId]);

  // 활성 탭이 변경되면 해당 탭의 데이터 로드
  useEffect(() => {
    const targetTab = tabs.find(tab => tab.id === activeTabId);
    if (targetTab) {
      setBranchBreakers(targetTab.branchBreakers);
      setAccessories(targetTab.accessories);
      setCustomerInfo(targetTab.customerInfo);
      setEnclosureInfo(targetTab.enclosureInfo);
      setMainBreakerInfo(targetTab.mainBreakerInfo);
      setEstimateVisible(targetTab.estimateVisible);
    }
  }, [activeTabId]);

  const [aiInput, setAiInput] = useState('');
  
  // 차단기 설정 팝업 상태
  const [breakerSettingsVisible, setBreakerSettingsVisible] = useState(false);
  const [breakerGrade, setBreakerGrade] = useState('표준형'); // 경제형/표준형
  const [mainBreakerQuantity, setMainBreakerQuantity] = useState(1); // 메인 차단기 수량
  const [showResetConfirm, setShowResetConfirm] = useState(false); // 새로고침 확인 말풍선
  
  // Drag 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: window.innerWidth / 2 - 260, y: window.innerHeight / 2 - 325 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 외함 설치 타입 토글
  const toggleEnclosureType = (type: string) => {
    setEnclosureInfo(prev => ({ ...prev, type }));
  };

  // 메인 차단기 타입 토글
  const toggleBreakerType = (type: string) => {
    setMainBreakerInfo(prev => ({ ...prev, type }));
  };

  // 차단기 설정 팝업
  const openBreakerSettings = () => {
    setBreakerSettingsVisible(true);
  };

  const closeBreakerSettings = () => {
    setBreakerSettingsVisible(false);
  };

  const saveBreakerSettings = () => {
    // 설정된 값들을 메인 차단기 정보에 저장
    console.log('차단기 브랜드:', mainBreakerInfo.brand);
    console.log('차단기 종류:', breakerGrade);
    console.log('메인 차단기 수량:', mainBreakerQuantity);

    // 여기에 필요한 추가 저장 로직 구현 가능

    alert(`차단기 설정이 저장되었습니다.\n브랜드: ${mainBreakerInfo.brand || '미선택'}\n종류: ${breakerGrade}\n수량: ${mainBreakerQuantity}개`);
    closeBreakerSettings();
  };

  // 분기 차단기 추가
  const addBranchBreaker = () => {
    const type = (document.getElementById('branchType') as HTMLSelectElement)?.value;
    const poles = (document.getElementById('branchPoles') as HTMLSelectElement)?.value;
    const capacity = (document.getElementById('branchCapacity') as HTMLSelectElement)?.value;
    const quantity = parseInt((document.getElementById('branchQuantity') as HTMLInputElement)?.value || '1');

    if (!type || !poles || !capacity) {
      alert('모든 항목을 선택해주세요.');
      return;
    }

    const newBreaker: BranchBreaker = { type, poles, capacity, quantity };
    setBranchBreakers(prev => [...prev, newBreaker]);

    // 입력 필드 초기화
    if (document.getElementById('branchType')) (document.getElementById('branchType') as HTMLSelectElement).value = '';
    if (document.getElementById('branchPoles')) (document.getElementById('branchPoles') as HTMLSelectElement).value = '';
    if (document.getElementById('branchCapacity')) (document.getElementById('branchCapacity') as HTMLSelectElement).value = '';
    if (document.getElementById('branchQuantity')) (document.getElementById('branchQuantity') as HTMLInputElement).value = '1';
  };

  // 분기 차단기 삭제
  const removeBranchItem = (index: number) => {
    setBranchBreakers(prev => prev.filter((_, i) => i !== index));
  };

  // 부속자재 세부선택 업데이트
  const updateAccessoryDetails = () => {
    const category = (document.getElementById('accessoryCategory') as HTMLSelectElement)?.value;
    const detailSelect = document.getElementById('accessoryDetail') as HTMLSelectElement;
    const specSelect = document.getElementById('accessorySpec') as HTMLSelectElement;

    if (!detailSelect || !specSelect) return;

    detailSelect.innerHTML = '<option value="">선택</option>';
    specSelect.innerHTML = '<option value="">선택</option>';

    const options: Record<string, any> = {
      'meter': {
        details: ['단상', '삼상'],
        specs: ['전자식', '기계식']
      },
      '3ct': {
        details: ['100/5A', '200/5A', '300/5A', '400/5A', '500/5A'],
        specs: ['부스바용', '환CT']
      },
      'timer': {
        details: ['일몰일출', '입력/출력'],
        specs: ['20A', '30A', '40A', '50A', '75A', '100A']
      },
      'eocr': {
        details: ['일반형', 'ZCT내장형'],
        specs: ['22', '32', '40', '60']
      },
      'condenser': {
        details: ['단상', '삼상'],
        specs: {
          '단상': [
            'uf: 10', 'uf: 15', 'uf: 20', 'uf: 30', 'uf: 40', 'uf: 50', 'uf: 75', 'uf: 100', 'uf: 150', 'uf: 175', 'uf: 200', 'uf: 250', 'uf: 300', 'uf: 400', 'uf: 500', 'uf: 1000',
            'KVA: 10', 'KVA: 15', 'KVA: 20', 'KVA: 25', 'KVA: 30', 'KVA: 40', 'KVA: 50'
          ],
          '삼상': [
            'uf: 10', 'uf: 15', 'uf: 20', 'uf: 30', 'uf: 40', 'uf: 50', 'uf: 75', 'uf: 100', 'uf: 200', 'uf: 250', 'uf: 300', 'uf: 400', 'uf: 500',
            'KVA: 10', 'KVA: 15', 'KVA: 20', 'KVA: 25', 'KVA: 30', 'KVA: 35', 'KVA: 40', 'KVA: 50', 'KVA: 60', 'KVA: 75', 'KVA: 100'
          ]
        }
      },
      'etc': {
        details: ['3구콘센트', '2구콘센트', '분전반소화기', 'TR', 'F/S', '수위센서', '단자커버', '단자피커버', '외함검침창'],
        specs: ['표준', '특수']
      }
    };

    if (options[category]) {
      options[category].details.forEach((detail: string) => {
        const optionElement = document.createElement('option');
        optionElement.value = detail;
        optionElement.textContent = detail;
        detailSelect.appendChild(optionElement);
      });

      if (category === 'condenser') {
        detailSelect.onchange = updateCondenserSpecs;
      } else {
        if (Array.isArray(options[category].specs)) {
          options[category].specs.forEach((spec: string) => {
            const optionElement = document.createElement('option');
            optionElement.value = spec;
            optionElement.textContent = spec;
            specSelect.appendChild(optionElement);
          });
        }
        detailSelect.onchange = null;
      }
    }
  };

  // 콘덴서 규격 업데이트
  const updateCondenserSpecs = () => {
    const detail = (document.getElementById('accessoryDetail') as HTMLSelectElement)?.value;
    const specSelect = document.getElementById('accessorySpec') as HTMLSelectElement;

    if (!specSelect) return;

    specSelect.innerHTML = '<option value="">선택</option>';

    const condenserSpecs: Record<string, string[]> = {
      '단상': [
        'uf: 10', 'uf: 15', 'uf: 20', 'uf: 30', 'uf: 40', 'uf: 50', 'uf: 75', 'uf: 100', 'uf: 150', 'uf: 175', 'uf: 200', 'uf: 250', 'uf: 300', 'uf: 400', 'uf: 500', 'uf: 1000',
        'KVA: 10', 'KVA: 15', 'KVA: 20', 'KVA: 25', 'KVA: 30', 'KVA: 40', 'KVA: 50'
      ],
      '삼상': [
        'uf: 10', 'uf: 15', 'uf: 20', 'uf: 30', 'uf: 40', 'uf: 50', 'uf: 75', 'uf: 100', 'uf: 200', 'uf: 250', 'uf: 300', 'uf: 400', 'uf: 500',
        'KVA: 10', 'KVA: 15', 'KVA: 20', 'KVA: 25', 'KVA: 30', 'KVA: 35', 'KVA: 40', 'KVA: 50', 'KVA: 60', 'KVA: 75', 'KVA: 100'
      ]
    };

    if (condenserSpecs[detail]) {
      condenserSpecs[detail].forEach(spec => {
        const optionElement = document.createElement('option');
        optionElement.value = spec;
        optionElement.textContent = spec;
        specSelect.appendChild(optionElement);
      });
    }
  };

  // 마그네트 아이템 추가
  const addMagnetItem = () => {
    const model = (document.getElementById('magnetModel') as HTMLSelectElement)?.value;
    const timer = (document.getElementById('magnetTimer') as HTMLSelectElement)?.value;
    const pbl = (document.getElementById('magnetPBL') as HTMLSelectElement)?.value;
    const qty = parseInt((document.getElementById('magnetQuantity') as HTMLInputElement)?.value || '1');

    if (!model) {
      alert('마그네트 모델을 선택하세요.');
      return;
    }

    let specs = model;
    if (timer === 'YES') specs += ' + 타이머';
    if (pbl === 'YES') specs += ' + PBL';

    const newAccessory: Accessory = {
      category: '마그네트',
      detail: specs,
      spec: '',
      quantity: qty,
      fullName: `마그네트 | ${specs}`
    };

    setAccessories(prev => [...prev, newAccessory]);

    // 입력 필드 초기화
    if (document.getElementById('magnetModel')) (document.getElementById('magnetModel') as HTMLSelectElement).value = '';
    if (document.getElementById('magnetTimer')) (document.getElementById('magnetTimer') as HTMLSelectElement).value = '';
    if (document.getElementById('magnetPBL')) (document.getElementById('magnetPBL') as HTMLSelectElement).value = '';
    if (document.getElementById('magnetQuantity')) (document.getElementById('magnetQuantity') as HTMLInputElement).value = '1';
  };

  // 부속자재 아이템 추가
  const addAccessoryItem = () => {
    const category = (document.getElementById('accessoryCategory') as HTMLSelectElement)?.value;
    const detail = (document.getElementById('accessoryDetail') as HTMLSelectElement)?.value;
    const spec = (document.getElementById('accessorySpec') as HTMLSelectElement)?.value;
    const qty = parseInt((document.getElementById('accessoryQuantity') as HTMLInputElement)?.value || '1');

    if (!category || !detail) {
      alert('부속자재와 세부선택을 모두 선택하세요.');
      return;
    }

    let itemName = category;
    if (detail) itemName += ' - ' + detail;
    if (spec) itemName += ' (' + spec + ')';

    const newAccessory: Accessory = {
      category,
      detail,
      spec,
      quantity: qty,
      fullName: itemName
    };

    setAccessories(prev => [...prev, newAccessory]);

    // 입력 필드 초기화
    if (document.getElementById('accessoryCategory')) (document.getElementById('accessoryCategory') as HTMLSelectElement).value = '';
    if (document.getElementById('accessoryDetail')) (document.getElementById('accessoryDetail') as HTMLSelectElement).innerHTML = '<option value="">선택</option>';
    if (document.getElementById('accessorySpec')) (document.getElementById('accessorySpec') as HTMLSelectElement).innerHTML = '<option value="">선택</option>';
    if (document.getElementById('accessoryQuantity')) (document.getElementById('accessoryQuantity') as HTMLInputElement).value = '1';
  };

  // 부속자재 삭제
  const removeAccessoryItem = (index: number) => {
    setAccessories(prev => prev.filter((_, i) => i !== index));
  };

  // 견적 생성
  const generateEstimate = () => {
    setEstimateVisible(true);
  };

  // 새로고침 - 현재 탭 초기화
  const resetCurrentTab = () => {
    setShowResetConfirm(false);
    // 현재 탭을 초기 상태로 리셋
      const resetTab: TabData = {
        id: activeTabId,
        title: tabs.find(t => t.id === activeTabId)?.title || `견적서 ${activeTabId}`,
        customerInfo: {
          company: '',
          contact: '',
          email: '',
          address: ''
        },
        enclosureInfo: {
          type: '옥내',
          boxType: '',
          material: '',
          request: ''
        },
        mainBreakerInfo: {
          type: 'MCCB',
          poles: '',
          capacity: '',
          brand: ''
        },
        branchBreakers: [],
        accessories: [],
        estimateVisible: false
      };

      // 상태 업데이트
      setCustomerInfo(resetTab.customerInfo);
      setEnclosureInfo(resetTab.enclosureInfo);
      setMainBreakerInfo(resetTab.mainBreakerInfo);
      setBranchBreakers(resetTab.branchBreakers);
      setAccessories(resetTab.accessories);
      setEstimateVisible(resetTab.estimateVisible);
      setCompleteSummaryShown(false);

      // tabs 배열도 업데이트
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? resetTab : tab
      ));
  };

  // AI 채팅 토글
  const toggleAiChat = () => {
    setAiChatVisible(!aiChatVisible);
  };

  // AI 메시지 전송
  const sendAiMessage = () => {
    if (!aiInput.trim()) return;

    setAiMessages(prev => [...prev, { type: 'user', content: aiInput }]);
    const currentInput = aiInput;
    setAiInput('');

    setTimeout(() => {
      setAiMessages(prev => [...prev, { type: 'ai', content: '견적 관련 도움을 드리겠습니다. 구체적인 질문이 있으시면 알려주세요.' }]);
    }, 1000);
  };

  // 파일 업로드 처리
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setAiFiles(prev => [...prev, ...Array.from(files)]);
  };

  // AI 파일 분석
  const analyzeFilesAI = () => {
    if (aiFiles.length === 0) {
      alert('분석할 파일을 먼저 업로드하세요.');
      return;
    }

    setAiMessages(prev => [...prev, { type: 'ai', content: '📊 AI가 파일을 분석하고 있습니다...' }]);

    setTimeout(() => {
      fillFormAutomatically();
      setAiMessages(prev => [...prev, { type: 'ai', content: '✅ 분석 완료! 도면을 분석하여 자동으로 견적 정보를 입력했습니다. 견적 생성 버튼을 클릭하면 최종 견적이 생성됩니다.' }]);
      setAiFiles([]);
    }, 3000);
  };

  // 자동 폼 채우기
  const fillFormAutomatically = () => {
    // 고객정보 자동 입력
    setCustomerInfo({
      company: '㈜한국전기공업',
      contact: '02-1234-5678',
      email: 'contact@hkelectric.co.kr',
      address: '서울시 강남구 테헤란로 123'
    });

    // 외함정보 자동 설정
    setEnclosureInfo(prev => ({
      ...prev,
      boxType: '기성함',
      material: 'STEEL 1.6T'
    }));

    // 메인차단기 자동 설정
    setMainBreakerInfo(prev => ({
      ...prev,
      poles: '4P',
      capacity: '200A'
    }));

    // 견적 테이블 업데이트
    setEstimateVisible(true);
  };

  // 탭 데이터 업데이트
  const updateTabData = () => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            customerInfo,
            enclosureInfo,
            mainBreakerInfo,
            branchBreakers,
            accessories,
            estimateVisible
          }
        : tab
    ));
  };

  // 새 탭 추가
  const addNewTab = () => {
    const newTab: TabData = {
      id: nextTabId,
      title: `견적서 ${nextTabId}`,
      customerInfo: {
        company: '',
        contact: '',
        email: '',
        address: ''
      },
      enclosureInfo: {
        type: '옥내',
        boxType: '',
        material: '',
        request: ''
      },
      mainBreakerInfo: {
        type: 'MCCB',
        poles: '',
        capacity: '',
        brand: ''
      },
      branchBreakers: [],
      accessories: [],
      estimateVisible: false
    };
    
    updateTabData(); // 현재 탭 데이터 저장
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(prev => prev + 1);
    
    // 새 탭 데이터로 상태 초기화
    setCustomerInfo(newTab.customerInfo);
    setEnclosureInfo(newTab.enclosureInfo);
    setMainBreakerInfo(newTab.mainBreakerInfo);
    setBranchBreakers(newTab.branchBreakers);
    setAccessories(newTab.accessories);
    setEstimateVisible(newTab.estimateVisible);
  };

  // 탭 전환
  const switchTab = (tabId: number) => {
    updateTabData(); // 현재 탭 데이터 저장
    
    const targetTab = tabs.find(tab => tab.id === tabId);
    if (targetTab) {
      setActiveTabId(tabId);
      setCustomerInfo(targetTab.customerInfo);
      setEnclosureInfo(targetTab.enclosureInfo);
      setMainBreakerInfo(targetTab.mainBreakerInfo);
      setBranchBreakers(targetTab.branchBreakers);
      setAccessories(targetTab.accessories);
      setEstimateVisible(targetTab.estimateVisible);
    }
  };

  // 탭 닫기
  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return; // 최소 1개 탭은 유지
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // 닫은 탭이 활성 탭이면 다른 탭으로 전환
    if (tabId === activeTabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      const newActiveTab = remainingTabs[0];
      if (newActiveTab) {
        switchTab(newActiveTab.id);
      }
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setDragPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="h-full flex flex-col bg-white">
      <style jsx>{`
        .quote-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: white;
          font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
          font-size: 14px;
          position: relative;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tab-container {
          background: white;
          border-bottom: 1px solid #e1dfdd;
          display: flex;
          align-items: center;
          padding: 0 20px;
        }

        .tab {
          padding: 10px 16px;
          border: 1px solid #d1d1d1;
          border-bottom: none;
          background: #f9f9f9;
          cursor: pointer;
          margin-right: 2px;
          display: flex;
          align-items: center;
          border-radius: 4px 4px 0 0;
          transition: all 0.2s ease;
        }

        .tab.active {
          background: white;
          border-color: var(--color-brand);
          color: var(--color-brand);
        }

        .tab:hover:not(.active) {
          background: #f0f0f0;
        }

        .tab-close {
          margin-left: 8px;
          cursor: pointer;
          color: #999;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
        }

        .tab-close:hover {
          background: #e1dfdd;
          color: #666;
        }

        .new-tab {
          padding: 6px 10px;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
          box-shadow: 0 2px 6px rgba(16, 163, 127, 0.25);
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .new-tab:hover {
          background: var(--color-brand-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(16, 163, 127, 0.35);
        }

        .content-container {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .left-panel {
          width: 500px;
          min-width: 500px;
          max-width: 500px;
          padding: 20px;
          overflow-y: auto;
          background: white;
          border-right: 1px solid #e1dfdd;
          flex-shrink: 0;
        }

        .right-panel {
          flex: 1;
          min-width: 0;
          padding: 20px;
          overflow-y: auto;
          background: white;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .right-panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 400px;
        }

        .center-generate-button {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-brand) 0%, #0E8F71 100%);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 18px;
          font-weight: 700;
          box-shadow:
            0 8px 32px rgba(16, 163, 127, 0.4),
            inset 0 2px 8px rgba(255, 255, 255, 0.2),
            inset 0 -2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: pulse-glow 3s ease-in-out infinite;
          margin-left: -100px;
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 8px 32px rgba(16, 163, 127, 0.4),
              inset 0 2px 8px rgba(255, 255, 255, 0.2),
              inset 0 -2px 8px rgba(0, 0, 0, 0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 
              0 12px 40px rgba(16, 163, 127, 0.5),
              inset 0 2px 8px rgba(255, 255, 255, 0.25),
              inset 0 -2px 8px rgba(0, 0, 0, 0.15);
          }
        }

        .center-generate-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .center-generate-button:hover {
          transform: scale(1.05);
          box-shadow: 
            0 12px 40px rgba(16, 163, 127, 0.6),
            inset 0 3px 12px rgba(255, 255, 255, 0.3),
            inset 0 -3px 12px rgba(0, 0, 0, 0.2);
        }

        .center-generate-button:active {
          transform: scale(0.98);
        }

        .center-button-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .center-button-text {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.2;
        }

        .section {
          margin-bottom: 20px;
          border: 1px solid #e1dfdd;
          border-radius: 4px;
          background: white;
        }

        .section-header {
          background: #f9f9f9;
          padding: 12px 16px;
          border-bottom: 1px solid #e1dfdd;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-content {
          padding: 16px;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .form-row-horizontal {
          display: flex;
          gap: 12px;
          align-items: end;
          margin-bottom: 12px;
        }

        .grid-2x2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .grid-1x5 {
          display: grid;
          grid-template-columns: 90px 70px 80px 60px 80px;
          gap: 12px;
          align-items: end;
        }

        .grid-1x2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          align-items: end;
        }

        .header-toggle-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 20px;
          padding: 2px;
          border: 1px solid #d1d1d1;
        }

        .header-toggle-option {
          padding: 4px 12px;
          border-radius: 18px;
          background: transparent;
          color: #666;
          border: none;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s;
        }

        .header-toggle-option.active {
          background: var(--color-brand);
          color: white;
        }

        .breaker-settings-btn {
          padding: 8px 16px;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
          transition: all 0.2s ease;
        }

        .breaker-settings-btn:hover {
          background: var(--color-brand-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 163, 127, 0.4);
        }

        .oval-toggle-container {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .oval-toggle-container.vertical {
          flex-direction: column;
          gap: 6px;
          width: 100px;
        }

        .oval-toggle {
          padding: 8px 16px;
          border: 2px solid #d1d1d1;
          border-radius: 25px;
          background: white;
          color: #666;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s;
          min-width: 80px;
          text-align: center;
        }

        .oval-toggle.active {
          background: var(--color-brand);
          border-color: var(--color-brand);
          color: white;
        }

        .oval-toggle.elb.active {
          background: #d13438;
          border-color: #d13438;
          color: white;
        }

        .main-breaker-layout {
          display: flex;
          gap: 20px;
          align-items: start;
          position: relative;
        }

        .main-breaker-layout .form-row {
          margin-bottom: 8px;
          flex-shrink: 0;
          width: auto;
          min-width: 80px;
        }

        .main-select {
          width: 80px !important;
          min-width: 80px !important;
          max-width: 80px !important;
          position: relative !important;
          z-index: auto !important;
        }

        .form-label {
          font-size: 13px;
          color: #605e5c;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .form-input, .form-select {
          padding: 8px 12px;
          border: 1px solid #d1d1d1;
          border-radius: 2px;
          font-size: 14px;
          background: white;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--color-brand);
        }

        .generate-estimate-section {
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e1dfdd;
          background: #f9f9f9;
        }

        .generate-estimate-btn {
          padding: 12px 32px;
          font-size: 15px;
          font-weight: 600;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 3px 10px rgba(16, 163, 127, 0.3);
        }

        .generate-estimate-btn:hover {
          background: var(--color-brand-strong);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(16, 163, 127, 0.4);
        }

        .btn {
          padding: 8px 16px;
          border: 1px solid #d1d1d1;
          border-radius: 2px;
          background: white;
          color: #323130;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          background: var(--color-brand);
          color: white;
          border-color: var(--color-brand);
          box-shadow: 0 2px 6px rgba(16, 163, 127, 0.25);
          transition: all 0.2s ease;
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-primary:hover {
          background: var(--color-brand-strong);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(16, 163, 127, 0.35);
        }

        .btn:hover {
          background: #f3f2f1;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
        }

        .branch-list, .accessories-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e1dfdd;
          border-radius: 4px;
          background: white;
        }

        .branch-item, .accessories-item {
          padding: 8px 12px;
          border-bottom: 1px solid #f3f2f1;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .branch-item:last-child, .accessories-item:last-child {
          border-bottom: none;
        }

        .branch-item:hover, .accessories-item:hover {
          background: #f9f9f9;
        }

        .branch-list-empty, .accessories-list-empty {
          padding: 20px;
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .estimate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: #f9f9f9;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .estimate-title {
          font-size: 16px;
          font-weight: 600;
          color: #323130;
        }

        .estimate-total {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-brand);
        }

        .estimate-table {
          border: 1px solid #e1dfdd;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 15px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1dfdd;
        }

        th {
          background: #f9f9f9;
          font-weight: 600;
          font-size: 14px;
          color: #323130;
        }

        td {
          font-size: 14px;
          color: #323130;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .bottom-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .ai-chat-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          box-shadow: 0 4px 16px rgba(16, 163, 127, 0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ai-chat-button:hover {
          background: var(--color-brand-strong);
          transform: scale(1.05) translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 163, 127, 0.5);
        }

        .ai-chat-popup {
          position: fixed;
          width: 520px;
          height: 650px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          display: ${aiChatVisible ? 'flex' : 'none'};
          flex-direction: column;
          z-index: 999999;
          resize: both;
          overflow: hidden;
          min-width: 390px;
          min-height: 520px;
          border: 3px solid var(--color-brand);
          will-change: transform;
          contain: none;
          isolation: isolate;
          left: ${dragPosition.x}px;
          top: ${dragPosition.y}px;
        }

        .ai-chat-popup::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: rgba(16, 163, 127, 0.1);
          z-index: -1;
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(16, 163, 127, 0.3);
        }

        .ai-chat-header {
          background: var(--color-brand);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          user-select: none;
          position: relative;
          z-index: 1;
        }

        .ai-chat-title {
          font-weight: 600;
          font-size: 16px;
        }

        .ai-chat-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-chat-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .ai-chat-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          border-bottom: 1px solid #e1dfdd;
        }

        .ai-chat-messages {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 15px;
        }

        .ai-message, .user-message {
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 80%;
          word-wrap: break-word;
        }

        .ai-message {
          background: #f9f9f9;
          color: #323130;
          align-self: flex-start;
        }

        .user-message {
          background: var(--color-brand);
          color: white;
          align-self: flex-end;
        }

        .ai-chat-file-area {
          border: 2px dashed #d1d1d1;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .ai-chat-file-area:hover,
        .ai-chat-file-area.dragover {
          border-color: var(--color-brand);
          background: #f0f9f6;
        }

        .ai-chat-file-list {
          margin-top: 10px;
        }

        .ai-file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9f9f9;
          border-radius: 4px;
          margin-bottom: 5px;
        }

        .analyze-btn {
          width: 100%;
          padding: 8px;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-bottom: 10px;
          box-shadow: 0 2px 6px rgba(16, 163, 127, 0.25);
          transition: all 0.2s ease;
        }

        .analyze-btn:hover {
          background: var(--color-brand-strong);
          box-shadow: 0 3px 8px rgba(16, 163, 127, 0.35);
        }

        .ai-chat-input-area {
          padding: 15px 20px;
          border-top: 1px solid #e1dfdd;
          background: white;
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .ai-chat-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d1d1;
          border-radius: 4px;
          resize: none;
          min-height: 40px;
          max-height: 120px;
          font-family: inherit;
          font-size: 14px;
        }

        .ai-chat-input:focus {
          outline: none;
          border-color: var(--color-brand);
        }

        .ai-send-button {
          padding: 8px 16px;
          background: var(--color-brand);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(16, 163, 127, 0.25);
          transition: all 0.2s ease;
        }

        .ai-send-button:hover {
          background: var(--color-brand-strong);
          box-shadow: 0 3px 8px rgba(16, 163, 127, 0.35);
        }

        /* 브레이커 설정 팝업 */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .popup-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          min-width: 400px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e1dfdd;
        }

        .popup-title {
          font-size: 18px;
          font-weight: 600;
          color: #323130;
        }

        .popup-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .popup-close:hover {
          background: #f3f2f1;
        }

        .popup-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e1dfdd;
        }

        .popup-btn {
          padding: 10px 20px;
          border: 1px solid #d1d1d1;
          border-radius: 4px;
          background: white;
          color: #323130;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .popup-btn:hover {
          background: #f3f2f1;
        }

        .popup-btn.primary {
          background: var(--color-brand);
          color: white;
          border-color: var(--color-brand);
        }

        .popup-btn.primary:hover {
          background: var(--color-brand-strong);
        }
      `}</style>

      <div className="quote-container">
        <div className="main-content">
          {/* 탭 컨테이너 */}
          <div className="tab-container">
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => switchTab(tab.id)}
              >
                {tab.title}
                {tabs.length > 1 && (
                  <span 
                    className="tab-close" 
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
            <button className="new-tab" onClick={addNewTab}>+ 새 탭</button>
          </div>

          {/* 콘텐츠 컨테이너 */}
          <div className="content-container">
            {/* 좌측 패널 */}
            <div className="left-panel">
              {/* 고객정보 섹션 */}
              <div className="section">
                <div className="section-header">
                  <span>고객정보</span>
                </div>
                <div className="section-content">
                  <div className="grid-2x2">
                    <div className="form-row">
                      <label className="form-label">업체명</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={customerInfo.company}
                        onChange={e => setCustomerInfo(prev => ({...prev, company: e.target.value}))}
                        placeholder="업체명을 입력하세요"
                      />
                    </div>
                    <div className="form-row">
                      <label className="form-label">연락처</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={customerInfo.contact}
                        onChange={e => setCustomerInfo(prev => ({...prev, contact: e.target.value}))}
                        placeholder="연락처를 입력하세요"
                      />
                    </div>
                    <div className="form-row">
                      <label className="form-label">이메일</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={customerInfo.email}
                        onChange={e => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                        placeholder="이메일을 입력하세요"
                      />
                    </div>
                    <div className="form-row">
                      <label className="form-label">주소</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={customerInfo.address}
                        onChange={e => setCustomerInfo(prev => ({...prev, address: e.target.value}))}
                        placeholder="주소를 입력하세요"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 외함정보 섹션 */}
              <div className="section">
                <div className="section-header">
                  <span>외함정보</span>
                  <div className="header-toggle">
                    <button 
                      className={`header-toggle-option ${enclosureInfo.type === '옥내' ? 'active' : ''}`}
                      onClick={() => toggleEnclosureType('옥내')}
                    >
                      옥내
                    </button>
                    <button 
                      className={`header-toggle-option ${enclosureInfo.type === '옥외' ? 'active' : ''}`}
                      onClick={() => toggleEnclosureType('옥외')}
                    >
                      옥외
                    </button>
                  </div>
                </div>
                <div className="section-content">
                  <div className="grid-1x2">
                    <div className="form-row">
                      <label className="form-label">함체타입</label>
                      <select 
                        className="form-select"
                        value={enclosureInfo.boxType}
                        onChange={e => setEnclosureInfo(prev => ({...prev, boxType: e.target.value}))}
                      >
                        <option value="">선택하세요</option>
                        <option value="기성함">기성함</option>
                        <option value="제작함">제작함</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="form-label">재질</label>
                      <select 
                        className="form-select"
                        value={enclosureInfo.material}
                        onChange={e => setEnclosureInfo(prev => ({...prev, material: e.target.value}))}
                      >
                        <option value="">선택하세요</option>
                        <option value="STEEL 1.6T">STEEL 1.6T</option>
                        <option value="STEEL 2.0T">STEEL 2.0T</option>
                        <option value="STS 1.5T">STS 1.5T</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="form-label">특이사항</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={enclosureInfo.request}
                      onChange={e => setEnclosureInfo(prev => ({...prev, request: e.target.value}))}
                      placeholder="특이사항을 입력하세요"
                    />
                  </div>
                </div>
              </div>

              {/* 메인 차단기 섹션 */}
              <div className="section">
                <div className="section-header">
                  <span>메인 차단기</span>
                  <button className="breaker-settings-btn" onClick={openBreakerSettings}>
                    차단기 설정
                  </button>
                </div>
                <div className="section-content">
                  <div className="main-breaker-layout">
                    <div className="oval-toggle-container vertical">
                      <button 
                        className={`oval-toggle ${mainBreakerInfo.type === 'MCCB' ? 'active' : ''}`}
                        onClick={() => toggleBreakerType('MCCB')}
                      >
                        MCCB
                      </button>
                      <button 
                        className={`oval-toggle elb ${mainBreakerInfo.type === 'ELB' ? 'active' : ''}`}
                        onClick={() => toggleBreakerType('ELB')}
                      >
                        ELB
                      </button>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div className="grid-1x2">
                        <div className="form-row">
                          <label className="form-label">극수</label>
                          <select 
                            className="form-select main-select"
                            value={mainBreakerInfo.poles}
                            onChange={e => setMainBreakerInfo(prev => ({...prev, poles: e.target.value}))}
                          >
                            <option value="">선택</option>
                            <option value="2P">2P</option>
                            <option value="3P">3P</option>
                            <option value="4P">4P</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label className="form-label">용량</label>
                          <select 
                            className="form-select main-select"
                            value={mainBreakerInfo.capacity}
                            onChange={e => setMainBreakerInfo(prev => ({...prev, capacity: e.target.value}))}
                          >
                            <option value="">선택</option>
                            <option value="100A">100A</option>
                            <option value="125A">125A</option>
                            <option value="150A">150A</option>
                            <option value="175A">175A</option>
                            <option value="200A">200A</option>
                            <option value="225A">225A</option>
                            <option value="250A">250A</option>
                            <option value="300A">300A</option>
                            <option value="350A">350A</option>
                            <option value="400A">400A</option>
                            <option value="500A">500A</option>
                            <option value="600A">600A</option>
                            <option value="700A">700A</option>
                            <option value="800A">800A</option>
                            <option value="1000A">1000A</option>
                            <option value="1200A">1200A</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 분기 차단기 섹션 */}
              <div className="section">
                <div className="section-header">
                  <span>분기 차단기</span>
                </div>
                <div className="section-content">
                  <div className="form-row-horizontal">
                    <div style={{ width: '60px' }}>
                      <label className="form-label">종류</label>
                      <select className="form-select" id="branchType" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="MCCB">MCCB</option>
                        <option value="ELB">ELB</option>
                      </select>
                    </div>
                    <div style={{ width: '60px', marginLeft: '8px' }}>
                      <label className="form-label">극수</label>
                      <select className="form-select" id="branchPoles" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="2P">2P</option>
                        <option value="3P">3P</option>
                        <option value="4P">4P</option>
                      </select>
                    </div>
                    <div style={{ width: '60px', marginLeft: '8px' }}>
                      <label className="form-label">용량</label>
                      <select className="form-select" id="branchCapacity" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="15A">15A</option>
                        <option value="20A">20A</option>
                        <option value="30A">30A</option>
                        <option value="40A">40A</option>
                        <option value="50A">50A</option>
                        <option value="60A">60A</option>
                        <option value="75A">75A</option>
                        <option value="100A">100A</option>
                        <option value="125A">125A</option>
                        <option value="150A">150A</option>
                        <option value="175A">175A</option>
                        <option value="200A">200A</option>
                        <option value="225A">225A</option>
                        <option value="250A">250A</option>
                        <option value="300A">300A</option>
                        <option value="350A">350A</option>
                        <option value="400A">400A</option>
                        <option value="500A">500A</option>
                        <option value="600A">600A</option>
                        <option value="700A">700A</option>
                        <option value="800A">800A</option>
                        <option value="1000A">1000A</option>
                        <option value="1200A">1200A</option>
                      </select>
                    </div>
                    <div style={{ width: '50px', marginLeft: '8px' }}>
                      <label className="form-label">수량</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        id="branchQuantity" 
                        defaultValue="1" 
                        min="1" 
                        max="10" 
                        style={{ width: '50px', fontSize: '12px', padding: '6px 4px', textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ width: '55px', marginLeft: '8px' }}>
                      <label className="form-label">&nbsp;</label>
                      <button 
                        className="btn btn-primary" 
                        onClick={addBranchBreaker}
                        style={{ width: '55px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
                      >
                        확인
                      </button>
                    </div>
                  </div>

                  <div className="branch-list">
                    {branchBreakers.length === 0 ? (
                      <div className="branch-list-empty">추가된 분기 차단기가 없습니다</div>
                    ) : (
                      branchBreakers.map((item, index) => (
                        <div key={index} className="branch-item">
                          <span>{item.type} {item.poles} {item.capacity} (수량: {item.quantity})</span>
                          <button className="btn btn-small" onClick={() => removeBranchItem(index)}>삭제</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 부속자재 섹션 */}
              <div className="section">
                <div className="section-header">
                  <span>부속자재</span>
                </div>
                <div className="section-content">
                  {/* 마그네트 라인 */}
                  <div className="form-row-horizontal" style={{ marginBottom: '15px' }}>
                    <div style={{ width: '75px' }}>
                      <label className="form-label">마그네트</label>
                      <select className="form-select" id="magnetModel" style={{ width: '75px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="MC-9">MC-9</option>
                        <option value="MC-12">MC-12</option>
                        <option value="MC-18">MC-18</option>
                        <option value="MC-22">MC-22</option>
                        <option value="MC-32">MC-32</option>
                        <option value="MC-40">MC-40</option>
                        <option value="MC-50">MC-50</option>
                        <option value="MC-65">MC-65</option>
                        <option value="MC-75">MC-75</option>
                        <option value="MC-85">MC-85</option>
                        <option value="MC-100">MC-100</option>
                        <option value="MC-130">MC-130</option>
                        <option value="MC-150">MC-150</option>
                      </select>
                    </div>
                    <div style={{ width: '60px', marginLeft: '8px' }}>
                      <label className="form-label">타이머</label>
                      <select className="form-select" id="magnetTimer" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="YES">포함</option>
                        <option value="NO">제외</option>
                      </select>
                    </div>
                    <div style={{ width: '60px', marginLeft: '8px' }}>
                      <label className="form-label">PBL</label>
                      <select className="form-select" id="magnetPBL" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="YES">포함</option>
                        <option value="NO">제외</option>
                      </select>
                    </div>
                    <div style={{ width: '50px', marginLeft: '8px' }}>
                      <label className="form-label">수량</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        id="magnetQuantity" 
                        defaultValue="1" 
                        min="1" 
                        max="10" 
                        style={{ width: '50px', fontSize: '12px', padding: '6px 4px', textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ width: '55px', marginLeft: '8px' }}>
                      <label className="form-label">&nbsp;</label>
                      <button 
                        className="btn btn-primary" 
                        onClick={addMagnetItem}
                        style={{ width: '55px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
                      >
                        확인
                      </button>
                    </div>
                  </div>

                  {/* 기타 부속자재 라인 */}
                  <div className="form-row-horizontal">
                    <div style={{ width: '75px' }}>
                      <label className="form-label">부속자재</label>
                      <select className="form-select" id="accessoryCategory" onChange={updateAccessoryDetails} style={{ width: '75px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                        <option value="meter">계량기</option>
                        <option value="3ct">3CT</option>
                        <option value="timer">타이머</option>
                        <option value="eocr">EOCR</option>
                        <option value="condenser">콘덴서</option>
                        <option value="etc">기타</option>
                      </select>
                    </div>
                    <div style={{ width: '75px', marginLeft: '8px' }}>
                      <label className="form-label">세부선택</label>
                      <select className="form-select" id="accessoryDetail" style={{ width: '75px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                      </select>
                    </div>
                    <div style={{ width: '60px', marginLeft: '8px' }}>
                      <label className="form-label">규격</label>
                      <select className="form-select" id="accessorySpec" style={{ width: '60px', fontSize: '12px', padding: '6px 4px' }}>
                        <option value="">선택</option>
                      </select>
                    </div>
                    <div style={{ width: '50px', marginLeft: '8px' }}>
                      <label className="form-label">수량</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        id="accessoryQuantity" 
                        defaultValue="1" 
                        min="1" 
                        max="10" 
                        style={{ width: '50px', fontSize: '12px', padding: '6px 4px', textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ width: '55px', marginLeft: '8px' }}>
                      <label className="form-label">&nbsp;</label>
                      <button 
                        className="btn btn-primary" 
                        onClick={addAccessoryItem}
                        style={{ width: '55px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}
                      >
                        확인
                      </button>
                    </div>
                  </div>

                  <div className="accessories-list">
                    {accessories.length === 0 ? (
                      <div className="accessories-list-empty">추가된 부속자재가 없습니다</div>
                    ) : (
                      accessories.map((item, index) => (
                        <div key={index} className="accessories-item">
                          <span>{item.fullName} (수량: {item.quantity})</span>
                          <button className="btn btn-small" onClick={() => removeAccessoryItem(index)}>삭제</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 견적 생성 버튼 섹션 */}
              <div className="generate-estimate-section">
                <button className="generate-estimate-btn" onClick={generateEstimate}>
                  견적 생성
                </button>
              </div>
            </div>

            {/* 우측 패널 */}
            <div className="right-panel" style={{ position: 'relative' }}>
              {/* 새로고침 버튼 및 확인 말풍선 */}
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 }}>
                {/* 확인 말풍선 */}
                {showResetConfirm && (
                  <div style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '0',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '200px',
                    animation: 'fadeIn 0.2s'
                  }}>
                    <div style={{ marginBottom: '12px', fontSize: '14px', color: '#374151' }}>
                      새로고침 하시겠습니까?
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={resetCurrentTab}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        새로고침
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        취소
                      </button>
                    </div>
                    {/* 말풍선 꼬리 */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '30px',
                      width: '0',
                      height: '0',
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid white',
                      filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
                    }}></div>
                  </div>
                )}

                {/* 새로고침 버튼 */}
                <button
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '500',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  🔄 새로고침
                </button>
              </div>

              {!estimateVisible ? (
                <div className="right-panel-empty">
                  <button className="center-generate-button" onClick={generateEstimate}>
                    <div className="center-button-text" style={{ fontSize: '24px', fontWeight: '700' }}>견적 생성</div>
                  </button>
                  <p style={{ marginTop: '24px', marginLeft: '-100px', color: '#666', textAlign: 'center', fontSize: '14px' }}>
                    좌측에서 필요한 정보를 입력한 후<br />
                    견적 생성 버튼을 클릭하세요
                  </p>
                </div>
              ) : (
                <div>
                  {/* 견적 헤더 */}
                  <div className="estimate-header">
                    <div className="estimate-title">견적서</div>
                    <div className="estimate-total">총액: 2,450,000원</div>
                  </div>

                  {/* 견적 테이블 */}
                  <div className="estimate-table">
                    <table>
                      <thead>
                        <tr>
                          <th>항목</th>
                          <th className="text-center">수량</th>
                          <th className="text-right">단가</th>
                          <th className="text-right">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>외함 ({enclosureInfo.boxType || '기성함'} - {enclosureInfo.material || 'STEEL 1.6T'})</td>
                          <td className="text-center">1</td>
                          <td className="text-right">850,000</td>
                          <td className="text-right">850,000</td>
                        </tr>
                        <tr>
                          <td>메인차단기 ({mainBreakerInfo.type} {mainBreakerInfo.poles} {mainBreakerInfo.capacity})</td>
                          <td className="text-center">1</td>
                          <td className="text-right">450,000</td>
                          <td className="text-right">450,000</td>
                        </tr>
                        {branchBreakers.map((item, index) => (
                          <tr key={index}>
                            <td>분기차단기 ({item.type} {item.poles} {item.capacity})</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">75,000</td>
                            <td className="text-right">{(75000 * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                        {accessories.map((item, index) => (
                          <tr key={index}>
                            <td>{item.fullName}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-right">125,000</td>
                            <td className="text-right">{(125000 * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 하단 버튼 */}
                  <div className="bottom-buttons">
                    <button className="btn">PDF 다운로드</button>
                    <button className="btn">Excel 다운로드</button>
                    <button className="btn btn-primary">견적서 전송</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI 채팅 버튼 */}
        <button className="ai-chat-button" onClick={toggleAiChat}>
          🤖
        </button>

        {/* AI 채팅 팝업 */}
        {aiChatVisible && (
          <div className="ai-chat-popup">
            <div className="ai-chat-header" onMouseDown={handleMouseDown}>
              <div className="ai-chat-title">AI 견적 도우미</div>
              <button className="ai-chat-close" onClick={toggleAiChat}>×</button>
            </div>
            
            <div className="ai-chat-body">
              <div className="ai-chat-messages">
                {aiMessages.map((message, index) => (
                  <div key={index} className={`${message.type}-message`}>
                    {message.content}
                  </div>
                ))}
              </div>

              <div className="ai-chat-file-area" onClick={() => document.getElementById('aiFileInput')?.click()}>
                <div>📁 도면이나 자료를 업로드하세요</div>
                <input 
                  type="file" 
                  id="aiFileInput" 
                  style={{ display: 'none' }} 
                  multiple 
                  accept=".pdf,.jpg,.jpeg,.png,.dwg"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {aiFiles.length > 0 && (
                <div className="ai-chat-file-list">
                  {aiFiles.map((file, index) => (
                    <div key={index} className="ai-file-item">
                      <span>{file.name}</span>
                      <button onClick={() => setAiFiles(prev => prev.filter((_, i) => i !== index))}>×</button>
                    </div>
                  ))}
                  <button className="analyze-btn" onClick={analyzeFilesAI}>
                    AI 분석 시작
                  </button>
                </div>
              )}
            </div>

            <div className="ai-chat-input-area">
              <textarea 
                className="ai-chat-input"
                placeholder="견적 관련 질문을 입력하세요..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAiMessage();
                  }
                }}
              />
              <button className="ai-send-button" onClick={sendAiMessage}>전송</button>
            </div>
          </div>
        )}

        {/* 차단기 설정 팝업 */}
        {breakerSettingsVisible && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <div className="popup-title">차단기 설정</div>
                <button className="popup-close" onClick={closeBreakerSettings}>×</button>
              </div>
              
              <div>
                <div className="form-row">
                  <label className="form-label">차단기 브랜드</label>
                  <select
                    className="form-select"
                    value={mainBreakerInfo.brand}
                    onChange={e => setMainBreakerInfo(prev => ({...prev, brand: e.target.value}))}
                  >
                    <option value="">선택하세요</option>
                    <option value="상도차단기">상도차단기</option>
                    <option value="LS산전">LS산전</option>
                    <option value="대륙차단기">대륙차단기</option>
                    <option value="비츠로">비츠로</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">차단기 종류</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className={`oval-toggle ${breakerGrade === '경제형' ? 'active' : ''}`}
                      onClick={() => setBreakerGrade('경제형')}
                      style={{ flex: 1 }}
                    >
                      경제형
                    </button>
                    <button
                      className={`oval-toggle ${breakerGrade === '표준형' ? 'active' : ''}`}
                      onClick={() => setBreakerGrade('표준형')}
                      style={{ flex: 1 }}
                    >
                      표준형
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">메인 차단기 수량</label>
                  <select
                    className="form-select"
                    value={mainBreakerQuantity}
                    onChange={e => setMainBreakerQuantity(parseInt(e.target.value))}
                  >
                    <option value="1">1개</option>
                    <option value="2">2개</option>
                    <option value="3">3개</option>
                    <option value="4">4개</option>
                    <option value="5">5개</option>
                  </select>
                </div>

                <div className="form-row">
                  <label className="form-label">분기 차단기 기본 브랜드</label>
                  <select className="form-select">
                    <option value="">선택하세요</option>
                    <option value="상도차단기">상도차단기</option>
                    <option value="LS산전">LS산전</option>
                    <option value="대륙차단기">대륙차단기</option>
                    <option value="비츠로">비츠로</option>
                  </select>
                </div>
              </div>

              <div className="popup-actions">
                <button className="popup-btn" onClick={closeBreakerSettings}>취소</button>
                <button className="popup-btn primary" onClick={saveBreakerSettings}>저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}