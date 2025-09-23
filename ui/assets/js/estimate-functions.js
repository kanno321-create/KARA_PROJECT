// Estimate System Functions - Complete JavaScript from estimate-simple.html

// Global Variables
let branchBreakers = [];
let accessories = [];
let customerInfo = {
    company: '',
    contact: '',
    email: '',
    address: ''
};
let enclosureInfo = {
    type: '옥내',
    boxType: '',
    material: '',
    request: ''
};
let mainBreakerInfo = {
    type: 'MCCB',
    poles: '',
    capacity: '',
    brand: ''
};

// Toggle Enclosure Type
function toggleEnclosureType(button) {
    document.querySelectorAll('.header-toggle-option').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    enclosureInfo.type = button.textContent;
}

// Toggle Breaker Type
function toggleBreakerType(button, type) {
    document.querySelectorAll('.oval-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
    mainBreakerInfo.type = type.toUpperCase();
}

// Open Breaker Settings
function openBreakerSettings() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('breaker-settings-popup').style.display = 'block';
}

// Close Breaker Settings
function closeBreakerSettings() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('breaker-settings-popup').style.display = 'none';
}

// Save Breaker Settings
function saveBreakerSettings() {
    closeBreakerSettings();
}

// Add Branch Breaker
function addBranchBreaker() {
    const type = document.getElementById('branchType').value;
    const poles = document.getElementById('branchPoles').value;
    const capacity = document.getElementById('branchCapacity').value;
    const quantity = document.getElementById('branchQuantity').value;

    if (!type || !poles || !capacity || !quantity) {
        alert('모든 항목을 선택해주세요.');
        return;
    }

    branchBreakers.push({
        type: type,
        poles: poles,
        capacity: capacity,
        quantity: parseInt(quantity)
    });

    const branchList = document.getElementById('branchList');
    const emptyMessage = branchList.querySelector('.branch-list-empty');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const branchItem = document.createElement('div');
    branchItem.className = 'branch-item';
    branchItem.innerHTML = `
        <span>${type} | ${poles} ${capacity} | 수량 ${quantity}</span>
        <button class="btn btn-small" onclick="removeBranchItem(this, ${branchBreakers.length - 1})">삭제</button>
    `;
    branchList.appendChild(branchItem);

    // Reset inputs
    document.getElementById('branchType').value = '';
    document.getElementById('branchPoles').value = '';
    document.getElementById('branchCapacity').value = '';
    document.getElementById('branchQuantity').value = '1';
}

// Remove Branch Item
function removeBranchItem(button, index) {
    const branchItem = button.parentElement;
    const branchList = document.getElementById('branchList');

    if (typeof index !== 'undefined') {
        branchBreakers.splice(index, 1);
    }

    branchItem.remove();

    if (branchList.children.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'branch-list-empty';
        emptyMessage.textContent = '분기 차단기를 추가하려면 위에서 설정 후 확인 버튼을 클릭하세요.';
        branchList.appendChild(emptyMessage);
    }
}

// Update Accessory Details
function updateAccessoryDetails() {
    const category = document.getElementById('accessoryCategory').value;
    const detailSelect = document.getElementById('accessoryDetail');
    const specSelect = document.getElementById('accessorySpec');

    detailSelect.innerHTML = '<option value="">선택</option>';
    specSelect.innerHTML = '<option value="">선택</option>';

    const options = {
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
        options[category].details.forEach(detail => {
            const optionElement = document.createElement('option');
            optionElement.value = detail;
            optionElement.textContent = detail;
            detailSelect.appendChild(optionElement);
        });

        // Handle specs based on detail selection for condenser
        if (category === 'condenser') {
            detailSelect.addEventListener('change', function() {
                const selectedDetail = this.value;
                specSelect.innerHTML = '<option value="">선택</option>';
                if (options[category].specs[selectedDetail]) {
                    options[category].specs[selectedDetail].forEach(spec => {
                        const optionElement = document.createElement('option');
                        optionElement.value = spec;
                        optionElement.textContent = spec;
                        specSelect.appendChild(optionElement);
                    });
                }
            });
        } else if (Array.isArray(options[category].specs)) {
            options[category].specs.forEach(spec => {
                const optionElement = document.createElement('option');
                optionElement.value = spec;
                optionElement.textContent = spec;
                specSelect.appendChild(optionElement);
            });
        }
    }
}

// Add Magnet Item
function addMagnetItem() {
    const model = document.getElementById('magnetModel').value;
    const timer = document.getElementById('magnetTimer').value;
    const pbl = document.getElementById('magnetPBL').value;
    const quantity = document.getElementById('magnetQuantity').value;

    if (!model) {
        alert('마그네트 모델을 선택해주세요.');
        return;
    }

    let itemName = `마그네트 ${model}`;
    if (timer === 'YES') itemName += ' + 타이머';
    if (pbl === 'YES') itemName += ' + PBL';

    accessories.push({
        category: 'magnet',
        model: model,
        timer: timer,
        pbl: pbl,
        quantity: parseInt(quantity),
        fullName: itemName
    });

    const accessoriesList = document.getElementById('accessoriesList');
    const emptyMessage = accessoriesList.querySelector('.accessories-list-empty');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const accessoryItem = document.createElement('div');
    accessoryItem.className = 'accessories-item';
    accessoryItem.innerHTML = `
        <span>${itemName} | 수량 ${quantity}</span>
        <button class="btn btn-small" onclick="removeAccessoryItem(this, ${accessories.length - 1})">삭제</button>
    `;
    accessoriesList.appendChild(accessoryItem);

    // Reset inputs
    document.getElementById('magnetModel').value = '';
    document.getElementById('magnetTimer').value = '';
    document.getElementById('magnetPBL').value = '';
    document.getElementById('magnetQuantity').value = '1';
}

// Add Accessory Item
function addAccessoryItem() {
    const category = document.getElementById('accessoryCategory').value;
    const detail = document.getElementById('accessoryDetail').value;
    const spec = document.getElementById('accessorySpec').value;
    const quantity = document.getElementById('accessoryQuantity').value;

    if (!category) {
        alert('부속자재를 선택해주세요.');
        return;
    }

    let itemName = category;
    if (detail) itemName += ' - ' + detail;
    if (spec) itemName += ' (' + spec + ')';

    accessories.push({
        category: category,
        detail: detail,
        spec: spec,
        quantity: parseInt(quantity),
        fullName: itemName
    });

    const accessoriesList = document.getElementById('accessoriesList');
    const emptyMessage = accessoriesList.querySelector('.accessories-list-empty');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const accessoryItem = document.createElement('div');
    accessoryItem.className = 'accessories-item';
    accessoryItem.innerHTML = `
        <span>${itemName} | 수량 ${quantity}</span>
        <button class="btn btn-small" onclick="removeAccessoryItem(this, ${accessories.length - 1})">삭제</button>
    `;
    accessoriesList.appendChild(accessoryItem);

    // Reset inputs
    document.getElementById('accessoryCategory').value = '';
    document.getElementById('accessoryDetail').innerHTML = '<option value="">선택</option>';
    document.getElementById('accessorySpec').innerHTML = '<option value="">선택</option>';
    document.getElementById('accessoryQuantity').value = '1';
}

// Remove Accessory Item
function removeAccessoryItem(button, index) {
    const accessoryItem = button.parentElement;
    const accessoriesList = document.getElementById('accessoriesList');

    if (typeof index !== 'undefined') {
        accessories.splice(index, 1);
    }

    accessoryItem.remove();

    if (accessoriesList.children.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'accessories-list-empty';
        emptyMessage.textContent = '부속자재를 추가하려면 위에서 설정 후 확인 버튼을 클릭하세요.';
        accessoriesList.appendChild(emptyMessage);
    }
}

// Generate Estimate
function generateEstimate() {
    const estimateSection = document.getElementById('estimateSection');
    estimateSection.style.display = 'flex';
    updateEstimateTable();
}

// Update Estimate Table
function updateEstimateTable() {
    const estimateTitle = document.querySelector('.estimate-title');
    const estimateTotal = document.querySelector('.estimate-total');

    const branchCount = branchBreakers.reduce((sum, item) => sum + item.quantity, 0);
    const accessoryCount = accessories.length;

    if (estimateTitle) {
        estimateTitle.textContent = `배전반 견적 | 메인 ${mainBreakerInfo.type || 'MCCB'} ${mainBreakerInfo.poles || '4P'} ${mainBreakerInfo.capacity || '100A'} | 분기 ${branchCount}개 | 부속자재 ${accessoryCount}개`;
    }

    if (estimateTotal) {
        estimateTotal.textContent = '합계: 750,000 원';
    }
}

// AI Chat Functions
let isDragging = false;
let startX, startY;

function openAIChat() {
    document.getElementById('ai-chat-popup').style.display = 'flex';
}

function toggleAiChat() {
    const popup = document.getElementById('ai-chat-popup');
    popup.style.display = popup.style.display === 'none' || popup.style.display === '' ? 'flex' : 'none';
}

// AI Chat Dragging
document.addEventListener('DOMContentLoaded', function() {
    const aiChatHeader = document.getElementById('ai-chat-header');
    if (aiChatHeader) {
        aiChatHeader.addEventListener('mousedown', function(e) {
            isDragging = true;
            const popup = document.getElementById('ai-chat-popup');
            const rect = popup.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            popup.style.cursor = 'grabbing';
            popup.style.opacity = '0.9';

            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);

            e.preventDefault();
        });
    }
});

function dragMove(e) {
    if (!isDragging) return;

    const popup = document.getElementById('ai-chat-popup');
    let newX = e.clientX - startX;
    let newY = e.clientY - startY;

    const minVisible = 50;

    if (newX < -popup.offsetWidth + minVisible) {
        newX = -popup.offsetWidth + minVisible;
    }
    if (newX > window.innerWidth - minVisible) {
        newX = window.innerWidth - minVisible;
    }
    if (newY < -popup.offsetHeight + minVisible) {
        newY = -popup.offsetHeight + minVisible;
    }
    if (newY > window.innerHeight - minVisible) {
        newY = window.innerHeight - minVisible;
    }

    popup.style.left = newX + 'px';
    popup.style.top = newY + 'px';
    popup.style.right = 'auto';
}

function dragEnd() {
    isDragging = false;
    const popup = document.getElementById('ai-chat-popup');
    popup.style.cursor = 'default';
    popup.style.opacity = '1';
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
}

// File Upload Functions
function handleFileSelect(files) {
    const fileList = document.getElementById('aiFileList');
    const analyzeBtn = document.getElementById('analyzeBtn');

    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'ai-file-item';
        fileItem.innerHTML = `
            <span>📄 ${file.name}</span>
            <span class="ai-file-remove" onclick="this.parentElement.remove(); updateAnalyzeButton();">삭제</span>
        `;
        fileList.appendChild(fileItem);
    });

    updateAnalyzeButton();
}

function updateAnalyzeButton() {
    const fileList = document.getElementById('aiFileList');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (fileList && analyzeBtn) {
        if (fileList.children.length > 0) {
            analyzeBtn.style.display = 'block';
        } else {
            analyzeBtn.style.display = 'none';
        }
    }
}

// Drag and Drop
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.ai-chat-file-area').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.ai-chat-file-area').classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.ai-chat-file-area').classList.remove('dragover');

    const files = e.dataTransfer.files;
    handleFileSelect(files);
}

// AI Analysis
function analyzeFilesAI() {
    const fileList = document.getElementById('aiFileList');
    if (!fileList || fileList.children.length === 0) {
        alert('분석할 파일을 먼저 업로드하세요.');
        return;
    }

    const chatContent = document.querySelector('.ai-chat-content');
    const analysisMessage = document.createElement('div');
    analysisMessage.className = 'ai-message';
    analysisMessage.textContent = '📊 AI가 파일을 분석하고 있습니다...';
    chatContent.appendChild(analysisMessage);

    setTimeout(() => {
        fillFormAutomatically();

        const resultMessage = document.createElement('div');
        resultMessage.className = 'ai-message';
        resultMessage.innerHTML = `
            ✅ <strong>분석 완료!</strong><br>
            도면을 분석하여 다음 정보를 자동으로 입력했습니다:<br>
            • 고객정보: ㈜한국전기공업<br>
            • 외함: 옥내, 기성함, STEEL 1.6T<br>
            • 메인차단기: MCCB 4P 200A<br>
            • 분기차단기: 7개 (MCCB/ELB 혼합)<br>
            • 부속자재: 마그네트 MC-100 + 타이머<br><br>
            견적 생성 버튼을 클릭하면 최종 견적이 생성됩니다.
        `;
        chatContent.appendChild(resultMessage);
        chatContent.scrollTop = chatContent.scrollHeight;

        fileList.innerHTML = '';
        updateAnalyzeButton();
    }, 3000);
}

// Auto Fill Form
function fillFormAutomatically() {
    // Customer info
    const customerInputs = document.querySelectorAll('.grid-2x2 .form-input');
    if (customerInputs[0]) customerInputs[0].value = '㈜한국전기공업';
    if (customerInputs[1]) customerInputs[1].value = '02-1234-5678';
    if (customerInputs[2]) customerInputs[2].value = 'contact@hkelectric.co.kr';
    if (customerInputs[3]) customerInputs[3].value = '서울시 강남구 테헤란로 123';

    // Simulate adding branch breakers
    addBranchBreakerAuto('MCCB', '2P', '30A', 3);
    addBranchBreakerAuto('ELB', '2P', '20A', 4);

    updateEstimateTable();
}

// Auto Add Branch Breaker
function addBranchBreakerAuto(type, poles, capacity, quantity) {
    const branchList = document.getElementById('branchList');

    const emptyMessage = branchList.querySelector('.branch-list-empty');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    const branchItem = document.createElement('div');
    branchItem.className = 'branch-item';
    branchItem.innerHTML = `
        <span>${type} | ${poles} ${capacity} | 수량 ${quantity}</span>
        <button class="btn btn-small" onclick="removeBranchItem(this)">삭제</button>
    `;
    branchList.appendChild(branchItem);

    branchBreakers.push({
        type: type,
        poles: poles,
        capacity: capacity,
        quantity: quantity
    });
}

// Send Message
function sendMessage() {
    const input = document.querySelector('.ai-chat-input');
    const message = input.value.trim();

    if (!message) return;

    const chatContent = document.querySelector('.ai-chat-content');

    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.textContent = message;
    chatContent.appendChild(userMessage);

    input.value = '';

    setTimeout(() => {
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message';
        aiMessage.textContent = '견적 관련 도움을 드리겠습니다. 구체적인 질문이 있으시면 알려주세요.';
        chatContent.appendChild(aiMessage);

        chatContent.scrollTop = chatContent.scrollHeight;
    }, 1000);

    chatContent.scrollTop = chatContent.scrollHeight;
}

// File Input Handler
document.addEventListener('DOMContentLoaded', function() {
    const aiFileInput = document.getElementById('aiFileInput');
    if (aiFileInput) {
        aiFileInput.addEventListener('change', function(e) {
            handleFileSelect(e.target.files);
        });
    }

    // Enter key for message sending
    const aiChatInput = document.querySelector('.ai-chat-input');
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});