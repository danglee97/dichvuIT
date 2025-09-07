// ===================================================================
//  AI_ENGINE.JS - MODULE TRỢ LÝ TƯ VẤN AI (PHIÊN BẢN HOÀN THIỆN)
//  VERSION 2.1 - NÂNG CẤP GIAO DIỆN TRÌNH BÀY KẾT QUẢ
// ===================================================================

// --- ĐỊNH NGHĨA CÂY HỘI THOẠI VÀ LOGIC ---
const conversationTree = {
    start: {
        text: "Chào bạn, tôi là Trợ lý AI của Minh Đăng IT. Tôi có thể giúp gì cho bạn hôm nay?",
        options: [
            { text: "Tư vấn lắp máy mới", next: "build_pc_purpose" },
            { text: "Máy tính của tôi gặp sự cố", next: "diagnose_symptom" },
            { text: "Tìm hiểu dịch vụ khác", next: "other_services" },
        ]
    },
    // --- Luồng 1: Xây dựng PC ---
    build_pc_purpose: {
        text: "Tuyệt vời! Bạn muốn build máy với mục đích chính là gì?",
        options: [
            { text: "Gaming / Stream", value: "Gaming / Stream", next: "build_pc_budget" },
            { text: "Đồ họa / Render Video", value: "Đồ họa / Render", next: "build_pc_budget" },
            { text: "Văn phòng / Học tập", value: "Văn phòng / Học tập", next: "build_pc_budget" }
        ]
    },
    build_pc_budget: {
        text: "Tôi đã hiểu. Ngân sách dự kiến của bạn cho bộ máy này là bao nhiêu?",
        options: [
            { text: "Dưới 15 triệu", value: "Dưới 15 triệu", key: "low", next: "result_build" },
            { text: "Từ 15 - 25 triệu", value: "15 - 25 triệu", key: "mid", next: "result_build" },
            { text: "Từ 25 - 40 triệu", value: "25 - 40 triệu", key: "high", next: "result_build" },
            { text: "Trên 40 triệu", value: "Trên 40 triệu", key: "ultra", next: "result_build" }
        ]
    },
    // --- Luồng 2: Chẩn đoán sự cố ---
    diagnose_symptom: {
        text: "Tôi rất tiếc khi nghe điều đó. Vui lòng mô tả sự cố bạn đang gặp phải:",
        options: [
            { text: "Máy chạy rất chậm, giật lag", value: "slow", next: "result_diagnose" },
            { text: "Máy không lên nguồn", value: "no_power", next: "result_diagnose" },
            { text: "Máy hay bị treo, màn hình xanh", value: "crash", next: "result_diagnose" },
            { text: "Vấn đề khác", value: "other", next: "result_diagnose" }
        ]
    },
    // --- Luồng 3: Dịch vụ khác ---
    other_services: {
        text: "Ngoài PC, chúng tôi còn cung cấp các giải pháp chuyên nghiệp khác. Bạn quan tâm đến lĩnh vực nào?",
        // Các options sẽ được tạo tự động
    },
    // --- Các bước kết quả ---
    result_build: { action: "buildPcConfig" },
    result_diagnose: { action: "diagnoseProblem" },
    result_other: { action: "showSubServices" }
};

// --- BỘ NÃO CỦA AI ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Khai báo các biến DOM ---
    const aiModal = document.getElementById('ai-assistant-modal');
    const openAiBtn = document.getElementById('ai-assistant-btn');
    const closeAiBtn = document.getElementById('ai-close-modal-btn');
    const chatLog = document.getElementById('ai-chat-log');
    const optionsContainer = document.getElementById('ai-options-container');

    if (!aiModal || !openAiBtn || !closeAiBtn || !chatLog || !optionsContainer) {
        console.error("Một hoặc nhiều thành phần UI của Trợ lý AI không được tìm thấy.");
        return;
    }
    
    let isDataReady = false;
    let conversationState = {};

    document.addEventListener('dataLoaded', () => {
        isDataReady = true;
        console.log("AI Engine: Dữ liệu đã sẵn sàng, AI có thể hoạt động.");
    });
    
    const addMessage = (type, text, contentHtml = '') => {
        const messageWrapper = document.createElement('div');
        if (contentHtml) {
            // Nếu có contentHtml, nó sẽ là toàn bộ nội dung của message
            messageWrapper.innerHTML = contentHtml;
        } else {
            messageWrapper.className = type === 'ai' ? 'ai-message' : 'user-message';
            let messageHtml = '';
            if (type === 'ai') messageHtml += `<div class="ai-avatar">🤖</div>`;
            messageHtml += `<div class="${type === 'ai' ? 'ai-bubble' : 'user-bubble'}">${text}</div>`;
            messageWrapper.innerHTML = messageHtml;
        }
        chatLog.appendChild(messageWrapper);
        chatLog.scrollTop = chatLog.scrollHeight;
    };

    const showOptions = (options) => {
        optionsContainer.innerHTML = '';
        if (!options || options.length === 0) {
            optionsContainer.style.display = 'none';
            return;
        }
        optionsContainer.style.display = 'flex';
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'ai-option-btn';
            button.textContent = option.text;
            button.dataset.next = option.next;
            button.dataset.value = option.value || option.text;
            if(option.key) button.dataset.key = option.key;
            optionsContainer.appendChild(button);
        });
    };

    const handleOptionClick = (e) => {
        if (!e.target.matches('.ai-option-btn')) return;
        const button = e.target;
        addMessage('user', button.textContent);
        
        const previousNodeKey = conversationState.currentNode;
        if (previousNodeKey === 'build_pc_purpose') conversationState.purpose = button.dataset.value;
        if (previousNodeKey === 'build_pc_budget') {
            conversationState.budget = button.dataset.value;
            conversationState.budget_key = button.dataset.key;
        }
        if (previousNodeKey === 'diagnose_symptom') conversationState.symptom = button.dataset.value;
        if (previousNodeKey === 'other_services') conversationState.serviceId = button.dataset.value;

        navigateToNode(button.dataset.next);
    };

    const navigateToNode = (nodeKey) => {
        const node = conversationTree[nodeKey];
        conversationState.currentNode = nodeKey;
        if (!node) return;

        if (node.text) addMessage('ai', node.text);

        if (node.options) {
            showOptions(node.options);
        } else if (node.action) {
            showOptions([]);
            executeAction(node.action);
        } else if (nodeKey === 'other_services') {
            const otherServiceOptions = servicesData
                .filter(s => s.id !== 'xay-dung-pc' && s.id !== 'sua-chua-pc')
                .map(s => ({ text: s.name, value: s.id, next: "result_other" }));
             otherServiceOptions.push({ text: "Quay lại", next: "start" });
             showOptions(otherServiceOptions);
        }
    };
    
    const executeAction = (actionName) => {
        switch (actionName) {
            case 'buildPcConfig': generatePcBuild(); break;
            case 'diagnoseProblem': diagnoseProblem(); break;
            case 'showSubServices': showSubServices(); break;
        }
    };
    
    const findComponent = (type, budget, constraints = {}) => {
        const candidates = pcComponentsData
            .filter(c => {
                if (c.type !== type || c.price > budget) return false;
                if (constraints.socket && c.socket && c.socket !== constraints.socket) return false;
                if (constraints.ram_type && c.ram_type && c.ram_type !== constraints.ram_type) return false;
                return true;
            })
            .sort((a, b) => b.price - a.price);
        return candidates[0] || null;
    };
    
    const generatePcBuild = () => {
        const { purpose, budget_key } = conversationState;
        addMessage('ai', `Ok, tôi đang phân tích theo nhu cầu **${purpose}**, ngân sách **${conversationState.budget}** để xây dựng cấu hình tương thích và tối ưu nhất...`);
        
        const budgetMappings = { low: 15000000, mid: 25000000, high: 40000000, ultra: 100000000 };
        const maxBudget = budgetMappings[budget_key];

        let build = {}; let currentCost = 0;

        let cpuBudget = maxBudget * 0.25;
        build.cpu = findComponent('cpu', cpuBudget);
        if (!build.cpu) {
            addMessage('ai', 'Rất tiếc, tôi không tìm thấy CPU phù hợp trong tầm giá này. Vui lòng thử lại với ngân sách khác.');
            showOptions([{ text: "Bắt đầu lại", next: "start" }]); return;
        }
        currentCost += build.cpu.price;

        let mainBudget = maxBudget * 0.15;
        build.mainboard = findComponent('mainboard', mainBudget, { socket: build.cpu.socket });
        if (!build.mainboard) build.mainboard = findComponent('mainboard', maxBudget, { socket: build.cpu.socket });
        if (!build.mainboard) {
            addMessage('ai', 'Rất tiếc, không có Mainboard nào tương thích với CPU đã chọn.');
            showOptions([{ text: "Bắt đầu lại", next: "start" }]); return;
        }
        currentCost += build.mainboard.price;

        let ramBudget = maxBudget * 0.1;
        build.ram = findComponent('ram', ramBudget, { ram_type: build.mainboard.ram_type });
        if (!build.ram) build.ram = findComponent('ram', maxBudget, { ram_type: build.mainboard.ram_type });
        if (!build.ram) {
            addMessage('ai', 'Rất tiếc, không có RAM nào tương thích với Mainboard đã chọn.');
            showOptions([{ text: "Bắt đầu lại", next: "start" }]); return;
        }
        currentCost += build.ram.price;
        
        let remainingBudget = maxBudget - currentCost;
        if (remainingBudget <= 0) {
             addMessage('ai', 'Ngân sách của bạn chỉ vừa đủ cho CPU, Mainboard và RAM. Hãy cân nhắc tăng ngân sách để có một bộ máy hoàn chỉnh.');
             displayBuildResult(Object.values(build).filter(c => c), currentCost); return;
        }
        
        if (purpose !== 'Văn phòng / Học tập') {
            build.gpu = findComponent('gpu', remainingBudget * 0.6);
            if (build.gpu) remainingBudget -= build.gpu.price;
        }
        
        build.storage = findComponent('storage', remainingBudget * 0.3);
        if (build.storage) remainingBudget -= build.storage.price;
        
        build.psu = findComponent('psu', remainingBudget * 0.4);
        if (build.psu) remainingBudget -= build.psu.price;

        build.case = findComponent('case', remainingBudget * 0.8);
        if(build.case) remainingBudget -= build.case.price;

        const finalBuild = Object.values(build).filter(c => c);
        const totalCost = finalBuild.reduce((sum, item) => sum + item.price, 0);
        
        displayBuildResult(finalBuild, totalCost);
    };

    const displayBuildResult = (build, total) => {
        let itemsHtml = '';
        build.forEach(item => {
            itemsHtml += `
                <div class="build-item-row">
                    <img src="${item.image || 'https://placehold.co/100x100/0a0a1a/00ffff?text=IMG'}" alt="${item.name}" class="build-item-image">
                    <div class="build-item-info">
                        <span class="build-item-type">${item.type}</span>
                        <span class="build-item-name">${item.name}</span>
                    </div>
                    <span class="build-item-price">${new Intl.NumberFormat('vi-VN').format(item.price)}đ</span>
                </div>`;
        });

        const resultHtml = `
            <div class="ai-result-card">
                <div class="ai-result-header">
                    <h3 class="font-tech">Cấu Hình Đề Xuất</h3>
                    <p>Dành cho: <strong>${conversationState.purpose}</strong><br>Ngân sách: <strong>${conversationState.budget}</strong></p>
                </div>
                <div class="ai-result-body">
                    ${itemsHtml}
                </div>
                <div class="ai-result-footer">
                    <span>Tổng cộng (ước tính):</span>
                    <span class="font-tech">${new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                </div>
            </div>`;

        addMessage('ai', '', resultHtml);
        showOptions([
            { text: "Thêm tất cả vào Yêu Cầu", value: JSON.stringify(build), next: "add_to_cart_and_close" },
            { text: "Làm lại từ đầu", next: "start" }
        ]);
    };
    
    const diagnoseProblem = () => {
        const { symptom } = conversationState;
        let suggestions = [];
        
        switch (symptom) {
            case 'slow':
                suggestions.push(findSubServiceById('scpc01'), findSubServiceById('scpc02'), findSubServiceById('scpc03'));
                break;
            case 'no_power':
            case 'crash':
                 suggestions.push(findSubServiceById('scpc01'));
                 addMessage('ai', "Sự cố này có thể do nhiều nguyên nhân (nguồn, mainboard, RAM...). Tốt nhất bạn nên mang máy đến để chúng tôi kiểm tra trực tiếp và báo giá chính xác.");
                break;
            case 'other':
                addMessage('ai', "Với các sự cố phức tạp, bạn vui lòng liên hệ trực tiếp qua SĐT hoặc Zalo để được hỗ trợ nhanh nhất nhé.");
                break;
        }

        const validSuggestions = suggestions.filter(s => s);
        if (validSuggestions.length > 0) {
            displayServiceResult(validSuggestions);
        } else {
             showOptions([{ text: "Làm lại từ đầu", next: "start" }]);
        }
    };
    
    const showSubServices = () => {
        const service = servicesData.find(s => s.id === conversationState.serviceId);
        if(service && service.subServices) displayServiceResult(service.subServices);
    };

    const findSubServiceById = (subId) => {
        for (const service of servicesData) {
            const found = service.subServices.find(sub => sub.subId === subId);
            if (found) return found;
        }
        return null;
    };
    
    const displayServiceResult = (services) => {
        let contentHtml = `<div class="mt-4 space-y-2 border-t border-gray-700 pt-3">`;
        services.forEach(item => {
            contentHtml += `<div class="flex justify-between items-center text-sm"><span>- ${item.name}</span><span class="font-mono text-primary">${isNaN(item.price) ? item.price : new Intl.NumberFormat('vi-VN').format(item.price) + 'đ'}</span></div>`;
        });
        contentHtml += `</div>`;
        
        addMessage('ai', "Dựa trên mô tả của bạn, tôi gợi ý một số dịch vụ sau:", contentHtml);
        showOptions([
            { text: "Thêm tất cả vào Yêu Cầu", value: JSON.stringify(services), next: "add_to_cart_and_close" },
            { text: "Làm lại từ đầu", next: "start" }
        ]);
    };

    const addToCartFromAI = (itemsJson) => {
        const items = JSON.parse(itemsJson);
        items.forEach(item => {
            const itemId = item.subId || item.id;
            const existingItem = cart.find(cartItem => (cartItem.subId || cartItem.id) === itemId);
            if (existingItem) existingItem.quantity++;
            else cart.push({ ...item, quantity: 1 });
        });
        localStorage.setItem('minhdangCart', JSON.stringify(cart));
        window.renderCart(); 
        
        addMessage('ai', "Đã thêm các mục vào giỏ hàng! Giỏ hàng của bạn sẽ tự động mở.");
        showOptions([{ text: "Bắt đầu cuộc trò chuyện mới", next: "start" }]);
        
        setTimeout(() => {
            closeAiModal();
            window.toggleCartPanel();
        }, 1500);
    };

    const startConversation = () => {
        chatLog.innerHTML = '';
        conversationState = {}; 
        if (!isDataReady) {
            addMessage('ai', "Dữ liệu đang được tải, vui lòng chờ trong giây lát...");
            setTimeout(startConversation, 1000);
            return;
        }
        navigateToNode('start');
    };

    const openAiModal = () => { aiModal.classList.add('visible'); startConversation(); };
    const closeAiModal = () => aiModal.classList.remove('visible');

    openAiBtn.addEventListener('click', openAiModal);
    closeAiBtn.addEventListener('click', closeAiModal);
    optionsContainer.addEventListener('click', (e) => {
        if (!e.target.matches('.ai-option-btn')) return;
        if (e.target.dataset.next === 'add_to_cart_and_close') {
            addMessage('user', e.target.textContent);
            addToCartFromAI(e.target.dataset.value);
        } else {
            handleOptionClick(e);
        }
    });
    
    aiModal.addEventListener('click', (e) => { if (e.target === aiModal) closeAiModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aiModal.classList.contains('visible')) closeAiModal(); });
    console.log("Trợ lý AI đã sẵn sàng!");
});

