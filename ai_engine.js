/**
 * ai_engine.js - Bộ não xử lý logic cho Trợ lý AI
 * Phiên bản: 5.0 (Hệ Thống Giám Sát Sự Kiện Trung Tâm)
 */

// Biến toàn cục để lưu trữ dữ liệu và trạng thái
let allPcComponents = [];
let conversationState = {};
let currentBuild = [];

// Hàm khởi tạo, được gọi từ script.js
function initializeAIAssistant(components) {
    allPcComponents = components;
    const aiBtn = document.getElementById('ai-assistant-btn');
    const aiModal = document.getElementById('ai-modal');
    const closeAiModalBtn = document.getElementById('close-ai-modal-btn');
    // --- NÂNG CẤP: Lấy container cha của toàn bộ nội dung modal ---
    const aiModalContent = document.querySelector('.ai-modal-content');

    // Gắn các listener cố định
    aiBtn?.addEventListener('click', startConversation);
    closeAiModalBtn?.addEventListener('click', endConversation);
    aiModal?.addEventListener('click', (e) => {
        if (e.target === aiModal) endConversation();
    });

    // --- ĐẠI NÂNG CẤP: HỆ THỐNG GIÁM SÁT SỰ KIỆN TRUNG TÂM ---
    // Gắn một listener duy nhất cho toàn bộ modal content để bắt tất cả các click
    aiModalContent?.addEventListener('click', (e) => {
        // Tìm nút bấm gần nhất với vị trí click
        const button = e.target.closest('.ai-option-btn');
        // Chỉ xử lý nếu tìm thấy nút và nút không bị vô hiệu hóa
        if (button && !button.disabled) {
            const text = button.textContent;
            const action = button.dataset.action;
            // Dữ liệu được lưu trong data-data attribute
            const data = button.dataset.data ? JSON.parse(button.dataset.data) : {};
            handleOptionClick(text, action, data);
        }
    });
}

// Bắt đầu cuộc trò chuyện
function startConversation() {
    document.getElementById('ai-modal')?.classList.add('visible');
    document.getElementById('ai-chat-log').innerHTML = ''; // Xóa lịch sử
    conversationState = { step: 'start' };
    currentBuild = [];

    appendMessage('ai', "Chào bạn, tôi là Trợ lý AI của Minh Đăng IT. Tôi có thể giúp gì cho bạn hôm nay?");
    showOptions([
        { text: 'Tư vấn lắp máy mới', action: 'startBuildPc' },
        { text: 'Máy của tôi gặp sự cố', action: 'diagnoseProblem' },
        { text: 'Tìm dịch vụ khác', action: 'findService' }
    ]);
}

// Kết thúc cuộc trò chuyện
function endConversation() {
    document.getElementById('ai-modal')?.classList.remove('visible');
}

// Hiển thị tin nhắn trong chat log
function appendMessage(sender, text, contentHtml = '') {
    const chatLog = document.getElementById('ai-chat-log');
    const messageDiv = document.createElement('div');
    
    if (sender === 'ai') {
        messageDiv.className = 'ai-message';
        messageDiv.innerHTML = `<div class="ai-avatar">🤖</div><div class="ai-bubble"><p>${text}</p>${contentHtml}</div>`;
    } else {
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `<div class="user-bubble">${text}</div>`;
    }
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Hiển thị các nút lựa chọn
function showOptions(options) {
    const optionsContainer = document.getElementById('ai-options-container');
    optionsContainer.innerHTML = ''; // Luôn xóa các nút cũ
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'ai-option-btn';
        button.textContent = option.text;
        button.dataset.action = option.action;
        if (option.data) {
            // Luôn stringify data để đảm bảo tính nhất quán
            button.dataset.data = JSON.stringify(option.data);
        }
        optionsContainer.appendChild(button);
    });
}

// Xử lý khi người dùng chọn một option
function handleOptionClick(text, action, data = {}) {
    // Chỉ hiển thị tin nhắn người dùng cho các hành động chính, không phải khi bấm "Thay đổi"
    if(action !== 'changeComponent' && action !== 'selectNewComponent' && action !== 'redisplayBuild') {
        appendMessage('user', text);
    }
    // Luôn dọn dẹp khu vực nút bấm chính
    document.getElementById('ai-options-container').innerHTML = '';

    setTimeout(() => {
        switch (action) {
            case 'startBuildPc': promptForBudget(); break;
            case 'setBudget':
                conversationState.budget = data;
                promptForPurpose(data.key);
                break;
            case 'setPurpose':
                conversationState.purpose = data;
                processBuildConfig();
                break;
            case 'diagnoseProblem':
                 appendMessage('ai', "Chức năng này đang được phát triển. Bạn có thể tham khảo các dịch vụ sửa chữa của chúng tôi nhé!");
                 setTimeout(endConversation, 2000);
                break;
            case 'findService':
                 appendMessage('ai', "Chức năng này đang được phát triển. Bạn có thể tham khảo các dịch vụ trên trang web nhé!");
                 setTimeout(endConversation, 2000);
                break;
            case 'addToCart': addBuildToCart(); break;
            case 'changeComponent': promptForComponentChange(data.type); break;
            case 'selectNewComponent': updateComponent(data.newComponent); break;
            case 'restart': startConversation(); break;
            case 'redisplayBuild':
                const result = calculatePsuAndFinalize(currentBuild, conversationState.budget);
                if (result && result.build) {
                    displayBuildResult(result.build, result.totalPrice, result.wattage);
                    showOptions([{ text: 'Thêm vào Yêu Cầu', action: 'addToCart' }, { text: 'Làm lại từ đầu', action: 'restart' }]);
                } else {
                    appendMessage('ai', "Đã có lỗi xảy ra khi hiển thị lại cấu hình.");
                }
                break;
        }
    }, 500);
}

// --- LUỒNG TƯ VẤN BUILD PC ---
function promptForBudget() {
    appendMessage('ai', "Tuyệt vời! Trước hết, bạn dự định đầu tư khoảng bao nhiêu cho bộ máy mới này?");
    showOptions([
        { text: 'Học sinh (< 8 triệu)', action: 'setBudget', data: { key: 'student-lt-8m', min: 0, max: 8000000 } },
        { text: 'Cơ bản (8 - 15 triệu)', action: 'setBudget', data: { key: 'basic-8-15m', min: 8000000, max: 15000000 } },
        { text: 'Tầm trung (15 - 25 triệu)', action: 'setBudget', data: { key: 'mid-15-25m', min: 15000000, max: 25000000 } },
        { text: 'Cao cấp (25 - 40 triệu)', action: 'setBudget', data: { key: 'high-25-40m', min: 25000000, max: 40000000 } },
        { text: 'Hạng sang (> 40 triệu)', action: 'setBudget', data: { key: 'luxury-gt-40m', min: 40000000, max: Infinity } }
    ]);
}

function promptForPurpose(budgetKey) {
    appendMessage('ai', "Đã hiểu. Bạn sẽ dùng máy chủ yếu cho mục đích gì?");
    let purposes = [
        { text: 'Học tập & Giải trí nhẹ', action: 'setPurpose', data: 'study' },
        { text: 'Chơi Game', action: 'setPurpose', data: 'gaming' },
        { text: 'Làm Đồ họa / Video', action: 'setPurpose', data: 'workstation' }
    ];
    if (budgetKey === 'student-lt-8m' || budgetKey === 'basic-8-15m') {
        purposes = purposes.filter(p => p.data !== 'workstation');
    }
    showOptions(purposes);
}

function processBuildConfig() {
    appendMessage('ai', "Ok, dựa trên lựa chọn của bạn, tôi đang phân tích các linh kiện phù hợp nhất. Vui lòng chờ trong giây lát...");
    setTimeout(() => {
        const result = buildPc(conversationState.budget, conversationState.purpose);
        if (result && result.build) {
            currentBuild = result.build;
            displayBuildResult(result.build, result.totalPrice, result.wattage);
            showOptions([{ text: 'Thêm vào Yêu Cầu', action: 'addToCart' }, { text: 'Làm lại từ đầu', action: 'restart' }]);
        } else {
            appendMessage('ai', "Rất tiếc, tôi không tìm thấy cấu hình nào phù hợp với các tiêu chí này. Bạn vui lòng thử lại với lựa chọn khác nhé.");
            showOptions([{ text: 'Chọn lại ngân sách', action: 'startBuildPc' }]);
        }
    }, 1000);
}

// --- LOGIC BUILD PC --- (Giữ nguyên, không thay đổi)
function findCheapestComponent(type, filterFunc = () => true) {
    return allPcComponents.filter(c => c.type === type && filterFunc(c)).sort((a, b) => a.price - b.price)[0];
}

function findComponents(type, filterFunc = () => true) {
    return allPcComponents.filter(c => c.type === type && filterFunc(c)).sort((a, b) => a.price - b.price);
}

function buildPc(budget, purpose) {
    let cpu, mainboard, ram, gpu, storage, psu, caseComponent, cooler;
    switch (budget.key) {
        case 'student-lt-8m':
            cpu = findCheapestComponent('cpu', c => c.price < 3500000 && c.name.includes('G'));
            gpu = null;
            mainboard = findCheapestComponent('mainboard', m => m.socket === cpu?.socket && m.ram_type === 'DDR4');
            ram = findCheapestComponent('ram', r => r.ram_type === 'DDR4' && r.name.includes('8GB'));
            storage = findCheapestComponent('storage', s => s.price < 1000000);
            let affordableCase = findCheapestComponent('case', c => c.price < 800000);
            caseComponent = affordableCase ? affordableCase : findCheapestComponent('case');
            cooler = null;
            break;
        case 'basic-8-15m':
            cpu = findCheapestComponent('cpu', c => c.price >= 2500000 && c.price < 4000000);
            mainboard = findCheapestComponent('mainboard', m => m.socket === cpu?.socket && m.ram_type === 'DDR4');
            ram = findCheapestComponent('ram', r => r.ram_type === 'DDR4' && r.name.includes('16GB'));
            gpu = findCheapestComponent('gpu', g => g.price >= 5000000 && g.price < 7000000);
            storage = findCheapestComponent('storage', s => s.name.includes('500GB'));
            caseComponent = findCheapestComponent('case', c => c.price < 1000000);
            cooler = findCheapestComponent('cooler', c => c.price < 500000);
            break;
        case 'mid-15-25m':
            cpu = findCheapestComponent('cpu', c => c.price >= 4000000 && c.price < 6000000);
            mainboard = findCheapestComponent('mainboard', m => m.socket === cpu?.socket);
            ram = findCheapestComponent('ram', r => r.ram_type === mainboard?.ram_type && r.name.includes('16GB'));
            gpu = findCheapestComponent('gpu', g => g.price >= 7000000 && g.price < 13000000);
            storage = findCheapestComponent('storage', s => s.name.includes('1TB'));
            caseComponent = findCheapestComponent('case');
            cooler = findCheapestComponent('cooler', c => c.price < 1000000);
            break;
        case 'high-25-40m':
            cpu = findCheapestComponent('cpu', c => c.price >= 6000000 && c.price < 12000000);
            mainboard = findCheapestComponent('mainboard', m => m.socket === cpu?.socket && m.ram_type === 'DDR5');
            ram = findCheapestComponent('ram', r => r.ram_type === 'DDR5' && r.name.includes('32GB'));
            gpu = findCheapestComponent('gpu', g => g.price >= 13000000 && g.price < 25000000);
            storage = findCheapestComponent('storage', s => s.name.includes('1TB') && s.price > 2000000);
            caseComponent = findCheapestComponent('case', c => c.price > 2000000);
            cooler = findCheapestComponent('cooler', c => c.price > 1000000);
            break;
        case 'luxury-gt-40m':
            cpu = findCheapestComponent('cpu', c => c.price > 12000000);
            mainboard = findCheapestComponent('mainboard', m => m.socket === cpu?.socket && m.ram_type === 'DDR5');
            ram = findCheapestComponent('ram', r => r.ram_type === 'DDR5' && r.name.includes('32GB'));
            gpu = findCheapestComponent('gpu', g => g.price > 25000000);
            storage = findCheapestComponent('storage', s => s.name.includes('2TB'));
            caseComponent = findCheapestComponent('case', c => c.price > 3000000);
            cooler = findCheapestComponent('cooler', c => c.price > 2000000);
            break;
    }
    const essentialComponents = [cpu, mainboard, ram, storage, caseComponent];
    if (cpu && !cpu.name.includes('G') && !gpu) return null; 
    if (essentialComponents.some(c => !c)) return null;
    return calculatePsuAndFinalize([cpu, mainboard, ram, gpu, storage, psu, caseComponent, cooler], budget);
}

function calculatePsuAndFinalize(build, budget) {
    let currentBuild = [...build];
    const wattage = currentBuild.filter(c => c).reduce((sum, item) => sum + (item.wattage || 0), 0);
    const requiredWattage = Math.ceil((wattage * 1.4) / 50) * 50;
    const psu = findCheapestComponent('psu', p => p.wattage >= requiredWattage);
    if (!psu) return null;
    currentBuild[currentBuild.findIndex(c => c?.type === 'psu')] = psu;
    const finalBuild = currentBuild.filter(Boolean);
    const totalPrice = finalBuild.reduce((sum, item) => sum + item.price, 0);
    if (totalPrice > budget.max && !(budget.key === 'student-lt-8m' && totalPrice < 8500000)) {
        return null;
    }
    return { build: finalBuild, totalPrice, wattage: requiredWattage };
}

// --- HIỂN THỊ KẾT QUẢ VÀ TƯƠNG TÁC ---
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function displayBuildResult(build, totalPrice, wattage) {
    const componentToVietnamese = {
        cpu: 'Vi xử lý (CPU)', mainboard: 'Bo mạch chủ', ram: 'RAM', gpu: 'Card đồ họa (VGA)',
        storage: 'Ổ cứng', psu: 'Nguồn (PSU)', case: 'Vỏ case', cooler: 'Tản nhiệt'
    };
    const buildHtml = build.map(item => `
        <div class="build-item-row">
            <img src="${item.image}" alt="${item.name}" class="build-item-image">
            <div class="build-item-info">
                <span class="build-item-type">${componentToVietnamese[item.type] || item.type}</span>
                <span class="build-item-name">${item.name}</span>
            </div>
            <span class="build-item-price">${formatPrice(item.price)}</span>
            <button class="ai-option-btn change-btn" data-action="changeComponent" data-data='${JSON.stringify({type: item.type})}'>Thay đổi</button>
        </div>`).join('');
    const resultHtml = `
        <div class="ai-result-card">
            <div class="ai-result-header"><h3>Cấu Hình Đề Xuất</h3><p>Dựa trên nhu cầu của bạn, đây là cấu hình tối ưu nhất (yêu cầu khoảng ${wattage}W).</p></div>
            <div class="ai-result-body">${buildHtml}</div>
            <div class="ai-result-footer"><span>TỔNG CỘNG:</span><span>${formatPrice(totalPrice)}</span></div>
        </div>`;
    appendMessage('ai', 'Tôi đã hoàn tất cấu hình cho bạn!', resultHtml);
}

function addBuildToCart() {
    appendMessage('ai', "Tuyệt vời! Tôi đang thêm các linh kiện vào giỏ hàng...");
    if (typeof addToCartFromAI === 'function') {
        addToCartFromAI(currentBuild);
    }
    setTimeout(() => {
        appendMessage('ai', "Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu.");
        showOptions([{ text: 'Bắt đầu lại', action: 'restart' }]);
    }, 1000);
}

function promptForComponentChange(type) {
    const componentToVietnamese = {
        cpu: 'Vi xử lý (CPU)', mainboard: 'Bo mạch chủ', ram: 'RAM', gpu: 'Card đồ họa (VGA)',
        storage: 'Ổ cứng', psu: 'Nguồn (PSU)', case: 'Vỏ case', cooler: 'Tản nhiệt'
    };
    const currentComponent = currentBuild.find(c => c.type === type);
    const cpu = currentBuild.find(c => c.type === 'cpu');
    const mainboard = currentBuild.find(c => c.type === 'mainboard');
    let filterFunc = () => true;
    if (type === 'mainboard') filterFunc = m => m.socket === cpu?.socket;
    else if (type === 'cpu') filterFunc = c => c.socket === mainboard?.socket;
    else if (type === 'ram') filterFunc = r => r.ram_type === mainboard?.ram_type;
    const availableOptions = findComponents(type, filterFunc);
    const optionsHtml = availableOptions.map(item => `
        <div class="build-item-row ${item.id === currentComponent.id ? 'current' : ''}">
            <img src="${item.image}" alt="${item.name}" class="build-item-image">
            <div class="build-item-info"><span class="build-item-name">${item.name}</span></div>
            <span class="build-item-price">${formatPrice(item.price)}</span>
            <button class="ai-option-btn select-btn" ${item.id === currentComponent.id ? 'disabled' : ''}
                data-action="selectNewComponent" data-data='${JSON.stringify({ newComponent: item })}'>
                Chọn
            </button>
        </div>`).join('');
    const resultHtml = `
        <div class="ai-result-card">
            <div class="ai-result-header"><h3>Chọn ${componentToVietnamese[type]} thay thế</h3><p>Các lựa chọn dưới đây đều tương thích.</p></div>
            <div class="ai-result-body">${optionsHtml}</div>
        </div>`;
    appendMessage('ai', `Đây là các lựa chọn cho ${componentToVietnamese[type]}:`, resultHtml);
    showOptions([{ text: 'Quay lại', action: 'redisplayBuild' }]);
}

function updateComponent(newComponent) {
    const index = currentBuild.findIndex(c => c.type === newComponent.type);
    if (index !== -1) {
        currentBuild[index] = newComponent;
        const cpu = currentBuild.find(c => c.type === 'cpu');
        const mainboard = currentBuild.find(c => c.type === 'mainboard');
        if (newComponent.type === 'cpu' && newComponent.socket !== mainboard.socket) {
            const newMainboard = findCheapestComponent('mainboard', m => m.socket === newComponent.socket);
            currentBuild[currentBuild.findIndex(c => c.type === 'mainboard')] = newMainboard;
        }
        if (newComponent.type === 'mainboard') {
             if (newComponent.socket !== cpu.socket) {
                 const newCpu = findCheapestComponent('cpu', c => c.socket === newComponent.socket);
                 currentBuild[currentBuild.findIndex(c => c.type === 'cpu')] = newCpu;
             }
             const ramIndex = currentBuild.findIndex(c => c.type === 'ram');
             if (currentBuild[ramIndex].ram_type !== newComponent.ram_type) {
                 const newRam = findCheapestComponent('ram', r => r.ram_type === newComponent.ram_type);
                 currentBuild[ramIndex] = newRam;
             }
        }
        const result = calculatePsuAndFinalize(currentBuild, conversationState.budget);
        if (result && result.build) {
            currentBuild = result.build;
            displayBuildResult(result.build, result.totalPrice, result.wattage);
            showOptions([{ text: 'Thêm vào Yêu Cầu', action: 'addToCart' }, { text: 'Làm lại từ đầu', action: 'restart' }]);
        } else {
             appendMessage('ai', "Rất tiếc, cấu hình mới vượt quá ngân sách của bạn. Vui lòng thử lại.");
             showOptions([{ text: 'Làm lại từ đầu', action: 'restart' }]);
        }
    }
}

