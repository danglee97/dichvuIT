/**
 * ai_engine.js - Bộ não xử lý logic cho Trợ lý AI
 * Phiên bản: 27.0 (Bản sửa lỗi tra cứu dịch vụ ổn định)
 */

// Biến toàn cục để lưu trữ dữ liệu và trạng thái
let allPcComponents = [];
let allServicesData = [];
let conversationState = {};
let currentBuild = [];
let recommendedServices = [];

// --- HÀM KHỞI TẠO & ĐIỀU PHỐI ---
function initializeAIAssistant(components, services) {
    allPcComponents = components;
    allServicesData = services;

    const aiBtn = document.getElementById('ai-assistant-btn');
    const aiModal = document.getElementById('ai-modal');
    const closeAiModalBtn = document.getElementById('close-ai-modal-btn');
    const aiModalContent = document.querySelector('.ai-modal-content');

    aiBtn?.addEventListener('click', startConversation);
    closeAiModalBtn?.addEventListener('click', endConversation);
    aiModal?.addEventListener('click', (e) => { if (e.target === aiModal) endConversation(); });

    aiModalContent?.addEventListener('click', (e) => {
        const button = e.target.closest('.ai-option-btn');
        if (button && !button.disabled) {
            const text = button.textContent.trim();
            const action = button.dataset.action;
            if (action === 'downloadImage') {
                const imageUrl = button.dataset.imageUrl;
                downloadImage(imageUrl, 'cau-hinh-pc-minhdang.png');
                return;
            }
            const data = button.dataset.data ? JSON.parse(button.dataset.data) : {};
            handleOptionClick(text, action, data);
        }
    });
}

// --- LUỒNG HỘI THOẠI CHÍNH ---
function startConversation() {
    document.getElementById('ai-modal')?.classList.add('visible');
    document.getElementById('ai-chat-log').innerHTML = '';
    conversationState = { step: 'start' };
    currentBuild = [];
    recommendedServices = [];
    appendMessage('ai', "Chào bạn, tôi là Trợ lý AI của Minh Đăng IT. Tôi có thể giúp gì cho bạn hôm nay?");
    showOptions([
        { text: 'Tư vấn lắp máy mới', action: 'startBuildPc' },
        { text: 'Tư vấn nâng cấp máy', action: 'startUpgrade' },
        { text: 'Máy của tôi gặp sự cố', action: 'startDiagnose' },
        { text: 'Tìm hiểu dịch vụ khác', action: 'startServiceNav' }
    ]);
}

function endConversation() {
    document.getElementById('ai-modal')?.classList.remove('visible');
}

function handleOptionClick(text, action, data = {}) {
    if (!['changeComponent', 'selectNewComponent', 'redisplayBuild'].includes(action)) {
        appendMessage('user', text);
    }
    document.getElementById('ai-options-container').innerHTML = '';

    setTimeout(() => {
        switch (action) {
            case 'startBuildPc': promptForBudget(); break;
            case 'setBudget': conversationState.budget = data; promptForPurpose(data.key); break;
            case 'setPurpose': conversationState.purpose = data.purpose; promptForSubPurpose(data.purpose); break;
            case 'setSubPurpose': conversationState.subPurpose = data.subPurpose; processBuildConfig(); break;
            case 'startUpgrade': promptForUpgradeGoal(); break;
            case 'setUpgradeGoal': conversationState.upgradeGoal = data.goal; promptForUpgradeBudget(); break;
            case 'setUpgradeBudget': conversationState.upgradeBudget = data; promptForCurrentHardware_Interactive(); break;
            case 'getCurrentHardware': conversationState.currentHardware = data; promptForCurrentPsu(); break;
            case 'analyzeUpgrade': conversationState.currentPsuWattage = data.wattage; analyzeAndSuggestUpgrade(); break;
            case 'startDiagnose': promptForSymptom(); break;
            case 'setSymptom': provideTroubleshootingSteps(data.symptom); break;
            case 'escalateToProfessional': processDiagnosis(data.symptom); break;
            case 'addToCart': addBuildToCart(); break;
            case 'addSuggestionsToCart': addSuggestionsToCart(data.items); break;
            case 'suggestRelatedServices': suggestRelatedServicesAfterUpgrade(); break;
            case 'addAssemblyServiceToCart': addAssemblyServiceToCart(); break;
            case 'showFinalOptionsOnly': showOptionsAfterBuild(); break;
            case 'changeComponent': promptForComponentChange(data.type); break;
            case 'selectNewComponent': updateComponent(data.newComponent); break;
            case 'redisplayBuild': redisplayCurrentBuild(); break;
            case 'saveBuild': generateAndShareImage(); break;
            case 'addServicesToCart': addRecommendedServicesToCart(); break;
            case 'startServiceNav': promptForServiceCategory(); break;
            case 'setServiceCategory': displaySubServices(data.categoryId); break;
            case 'restart': startConversation(); break;
        }
    }, 500);
}

// --- TIỆN ÍCH HIỂN THỊ VÀ DỮ LIỆU ---
function appendMessage(sender, text, contentHtml = '') { const chatLog = document.getElementById('ai-chat-log'); const messageDiv = document.createElement('div'); if (sender === 'ai') { messageDiv.className = 'ai-message'; messageDiv.innerHTML = `<div class="ai-avatar">🤖</div><div class="ai-bubble"><p>${text}</p>${contentHtml}</div>`; } else { messageDiv.className = 'user-message'; messageDiv.innerHTML = `<div class="user-bubble">${text}</div>`; } chatLog.appendChild(messageDiv); chatLog.scrollTop = chatLog.scrollHeight; }
function showOptions(options) { const optionsContainer = document.getElementById('ai-options-container'); optionsContainer.innerHTML = ''; options.forEach(option => { const button = document.createElement('button'); button.className = 'ai-option-btn'; button.textContent = option.text; button.dataset.action = option.action; if (option.data) { button.dataset.data = JSON.stringify(option.data); } if (option.imageUrl) { button.dataset.imageUrl = option.imageUrl; } optionsContainer.appendChild(button); }); }
function showOptionsAfterBuild() { showOptions([ { text: 'Thêm vào Yêu Cầu', action: 'addToCart' }, { text: 'Lưu ảnh cấu hình', action: 'saveBuild' }, { text: 'Làm lại từ đầu', action: 'restart' } ]); }

// --- LUỒNG XÂY DỰNG PC CHUYÊN SÂU ---
function promptForBudget(){appendMessage('ai',"Tuyệt vời! Trước hết, bạn dự định đầu tư khoảng bao nhiêu cho bộ máy mới này?"),showOptions([{text:"Học sinh (< 8 triệu)",action:"setBudget",data:{key:"student-lt-8m",min:0,max:8e6}},{text:"Cơ bản (8 - 15 triệu)",action:"setBudget",data:{key:"basic-8-15m",min:8e6,max:15e6}},{text:"Tầm trung (15 - 25 triệu)",action:"setBudget",data:{key:"mid-15-25m",min:15e6,max:25e6}},{text:"Cao cấp (25 - 40 triệu)",action:"setBudget",data:{key:"high-25-40m",min:25e6,max:4e7}},{text:"Hạng sang (> 40 triệu)",action:"setBudget",data:{key:"luxury-gt-40m",min:4e7,max:1/0}}])}
function promptForPurpose(budgetKey){ appendMessage('ai', "Đã hiểu. Bạn sẽ dùng máy chủ yếu cho mục đích gì?"); let purposes = [ { text: 'Học tập & Giải trí nhẹ', action: 'setPurpose', data: { purpose: 'study' } }, { text: 'Chơi Game', action: 'setPurpose', data: { purpose: 'gaming' } }, { text: 'Làm Đồ họa / Video', action: 'setPurpose', data: { purpose: 'workstation' } } ]; if (budgetKey === 'student-lt-8m' || budgetKey === 'basic-8-15m') { purposes = purposes.filter(p => p.data.purpose !== 'workstation'); } showOptions(purposes); }
function promptForSubPurpose(mainPurpose) {
    if (mainPurpose === 'gaming') {
        appendMessage('ai', "Tuyệt vời! Để tối ưu tốt nhất, bạn thường chơi thể loại game nào?");
        showOptions([
            { text: 'Game Esport (CSGO, Valorant)', action: 'setSubPurpose', data: { subPurpose: 'gaming_esports' } },
            { text: 'Game bom tấn AAA (Cyberpunk)', action: 'setSubPurpose', data: { subPurpose: 'gaming_aaa' } },
            { text: 'Cả hai loại trên', action: 'setSubPurpose', data: { subPurpose: 'gaming_hybrid' } }
        ]);
    } else if (mainPurpose === 'workstation') {
        appendMessage('ai', "Rất rõ ràng. Bạn chủ yếu làm việc với các phần mềm thuộc lĩnh vực nào?");
        showOptions([
            { text: 'Đồ họa 2D, ảnh (Photoshop)', action: 'setSubPurpose', data: { subPurpose: 'workstation_2d' } },
            { text: 'Dựng phim, 3D (Premiere, Blender)', action: 'setSubPurpose', data: { subPurpose: 'workstation_3d' } }
        ]);
    } else {
        conversationState.subPurpose = 'study';
        processBuildConfig();
    }
}
function processBuildConfig() {
    appendMessage('ai', "Ok, bộ não AI của tôi đang phân tích và tính toán để tìm ra cấu hình tối ưu nhất cho bạn. Vui lòng chờ trong giây lát...");
    setTimeout(() => {
        const result = buildPcSmart(conversationState.budget, conversationState.subPurpose);
        if (result && result.build) {
            currentBuild = result.build;
            displayBuildResult(result.build, result.totalPrice, result.wattage);
        } else {
            appendMessage('ai', "Rất tiếc, tôi không tìm thấy cấu hình nào phù hợp với các tiêu chí này. Có thể do ngân sách quá thấp so với các linh kiện hiện có. Bạn vui lòng thử lại với lựa chọn khác nhé.");
            showOptions([{ text: 'Chọn lại ngân sách', action: 'startBuildPc' }]);
        }
    }, 1000);
}
function buildPcSmart(budget, subPurpose) {
    const weights = {
        gaming_esports: { performance: 0.7, value: 0.3, aesthetic: 0.0 },
        gaming_aaa:     { performance: 0.5, value: 0.3, aesthetic: 0.2 },
        gaming_hybrid:  { performance: 0.6, value: 0.3, aesthetic: 0.1 },
        workstation_2d: { performance: 0.6, value: 0.4, aesthetic: 0.0 },
        workstation_3d: { performance: 0.8, value: 0.2, aesthetic: 0.0 },
        study:          { performance: 0.2, value: 0.7, aesthetic: 0.1 }
    }[subPurpose];
    const needsGpu = subPurpose.includes('gaming') || subPurpose.includes('3d');
    const needsIGPU = !needsGpu;
    const cpuFilter = needsIGPU ? c => !c.name.includes('F') : () => true;
    const sortedCpus = findBestComponents('cpu', cpuFilter, weights);
    const sortedGpus = needsGpu ? findBestComponents('gpu', () => true, weights) : [null];
    for (const cpu of sortedCpus) {
        for (const gpu of sortedGpus) {
            let build = { cpu, gpu };
            const mainboards = findBestComponents('mainboard', m => m.socket === cpu.socket, weights);
            if (mainboards.length === 0) continue;
            build.mainboard = mainboards[0];
            const rams = findBestComponents('ram', r => r.ram_type === build.mainboard.ram_type, weights);
            if (rams.length === 0) continue;
            build.ram = rams[0];
            const valueWeights = { performance: 0.1, value: 0.8, aesthetic: 0.1 };
            build.storage = findBestComponents('storage', () => true, valueWeights)[0];
            build.case = findBestComponents('case', () => true, valueWeights)[0];
            if (!build.storage || !build.case) continue;
            const preliminaryBuild = Object.values(build).filter(Boolean);
            const result = calculatePsuAndFinalize(preliminaryBuild, budget);
            if (result) { return result; }
        }
    }
    return null;
}
function addBuildToCart() {
    appendMessage('ai', "Đang thêm cấu hình bạn đã chọn vào giỏ hàng...");

    // Kiểm tra xem hàm addBuildToCartFromAI có tồn tại không (để đảm bảo script.js đã tải)
    // và biến currentBuild có dữ liệu không
    if (typeof addBuildToCartFromAI === 'function' && currentBuild && currentBuild.length > 0) {
        
        // Gọi hàm từ script.js và truyền vào cấu hình hiện tại
        addBuildToCartFromAI(currentBuild);

        // Phản hồi cho người dùng sau khi thêm thành công
        setTimeout(() => {
            appendMessage('ai', "Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng ở góc màn hình để kiểm tra và gửi yêu cầu.");
            // Hiển thị các lựa chọn tiếp theo, không bao gồm nút "Thêm vào giỏ hàng" nữa
            showOptions([
                { text: 'Lưu ảnh cấu hình', action: 'saveBuild' },
                { text: 'Làm lại từ đầu', action: 'restart' }
            ]);
        }, 1000); // Thêm độ trễ nhỏ để cảm giác mượt hơn

    } else {
        // Xử lý lỗi nếu không tìm thấy hàm hoặc không có cấu hình để thêm
        console.error("Lỗi: Hàm addBuildToCartFromAI không tồn tại hoặc currentBuild rỗng.");
        appendMessage('ai', "Rất tiếc, đã có lỗi xảy ra khi cố gắng thêm vào giỏ hàng. Vui lòng thử lại.");
        showOptionsAfterBuild(); // Hiển thị lại các lựa chọn ban đầu
    }
}
function displayBuildResult(build, totalPrice, wattage) {
    const componentToVietnamese = { cpu: 'Vi xử lý (CPU)', mainboard: 'Bo mạch chủ', ram: 'RAM', gpu: 'Card đồ họa (VGA)', storage: 'Ổ cứng', psu: 'Nguồn (PSU)', case: 'Vỏ case', cooler: 'Tản nhiệt' };
    const buildHtml = build.map(item => {
        const reason = getComponentReason(item, conversationState.subPurpose);
        const infoIconHtml = ` <i class="info-icon">i <span class="info-tooltip">${reason}</span> </i>`;
        return ` <div class="build-item-row"> <img src="${item.image}" alt="${item.name}" class="build-item-image"> <div class="build-item-info"> <span class="build-item-type">${componentToVietnamese[item.type] || item.type}</span> <span class="build-item-name">${item.name} ${infoIconHtml}</span> </div> <span class="build-item-price">${formatPrice(item.price)}</span> <button class="ai-option-btn change-btn" data-action="changeComponent" data-data='${JSON.stringify({ type: item.type })}'>Thay đổi</button> </div>`;
    }).join('');
    const resultHtml = ` <div class="ai-result-card"> <div class="ai-result-header"> <h3>Cấu Hình Đề Xuất</h3> <p>Dựa trên nhu cầu của bạn, đây là cấu hình tối ưu nhất (yêu cầu khoảng ${wattage}W).</p> </div> <div class="ai-result-body">${buildHtml}</div> <div class="ai-result-footer"> <span>TỔNG CỘNG:</span> <span>${formatPrice(totalPrice)}</span> </div> </div>`;
    appendMessage('ai', 'Tôi đã hoàn tất cấu hình cho bạn!', resultHtml);
    promptForAssemblyService();
}
function getComponentReason(component, subPurpose) {
    const purposeText = { gaming_esports: "chơi game Esport với FPS cao", gaming_aaa: "chiến các game bom tấn AAA ở thiết lập đồ họa cao", gaming_hybrid: "chơi mượt mà nhiều thể loại game", workstation_2d: "công việc thiết kế đồ họa 2D", workstation_3d: "dựng phim và làm mô hình 3D", study: "học tập và giải trí" }[subPurpose];
    switch (component.type) {
        case 'cpu': if (subPurpose === 'gaming_esports') return `Với game Esport, CPU này có xung nhịp đơn nhân cao, là yếu tố quyết định để đạt được FPS tối đa.`; if (!component.name.includes('F') && (subPurpose === 'study' || !currentBuild.find(c => c.type === 'gpu'))) { return `Tôi chọn CPU này vì nó có nhân đồ họa tích hợp, giúp bạn tiết kiệm chi phí card màn hình rời mà vẫn đáp ứng tốt nhu cầu ${purposeText}.`; } return `Đây là CPU có hiệu năng trên giá thành (P/P) tốt nhất, rất phù hợp cho nhu cầu ${purposeText} của bạn trong tầm giá này.`;
        case 'gpu': if (subPurpose === 'gaming_aaa') return `Để có trải nghiệm đồ họa mãn nhãn trong các game AAA, card đồ họa này là lựa chọn có sức mạnh xử lý tốt nhất trong phân khúc.`; return `Card đồ họa này là lựa chọn tối ưu, đảm bảo trải nghiệm ${purposeText} mượt mà và hiệu quả.`;
        default: return `Linh kiện này được chọn để đảm bảo sự tương thích và cân bằng cho toàn bộ hệ thống, phục vụ tốt cho nhu cầu ${purposeText}.`;
    }
}
function promptForAssemblyService() { appendMessage('ai', "Cấu hình của bạn đã sẵn sàng! Để đảm bảo máy hoạt động ổn định và có tính thẩm mỹ cao nhất, bạn có muốn sử dụng dịch vụ 'Lắp ráp & Đi dây gọn gàng' chuyên nghiệp của chúng tôi không?"); showOptions([ { text: "Có, thêm dịch vụ này", action: "addAssemblyServiceToCart" }, { text: "Không, cảm ơn", action: "showFinalOptionsOnly" } ]); }
function addAssemblyServiceToCart() {
    const allSubServices = allServicesData.flatMap(s => s.subServices || []);
    const serviceToAdd = allSubServices.find(s => s && s.subId === 'xdpc01');
    if (serviceToAdd && typeof addServicesToCartFromAI === 'function') {
        addServicesToCartFromAI([serviceToAdd]);
        appendMessage('ai', "Tuyệt vời! Tôi đã thêm dịch vụ lắp ráp vào giỏ hàng của bạn.");
    } else {
        appendMessage('ai', "Rất tiếc, tôi không tìm thấy dịch vụ lắp ráp lúc này, nhưng bạn có thể yêu cầu thêm khi liên hệ nhé.");
    }
    showOptionsAfterBuild();
}

// --- LUỒNG TƯ VẤN NÂNG CẤP ---
function promptForUpgradeGoal(){appendMessage('ai',"Tuyệt vời! Bạn muốn nâng cấp máy để cải thiện hiệu năng cho mục đích chính nào?"),showOptions([{text:"Chơi Game mượt hơn",action:"setUpgradeGoal",data:{goal:"gaming"}},{text:"Làm việc, đồ họa nhanh hơn",action:"setUpgradeGoal",data:{goal:"workstation"}},{text:"Tăng tốc độ chung & khởi động",action:"setUpgradeGoal",data:{goal:"general"}}])}
function promptForUpgradeBudget(){appendMessage('ai',"Bạn dự định đầu tư khoảng bao nhiêu cho lần nâng cấp này?"),showOptions([{text:"Tiết kiệm (< 3 triệu)",action:"setUpgradeBudget",data:{min:0,max:3e6}},{text:"Cơ bản (3 - 7 triệu)",action:"setUpgradeBudget",data:{min:3e6,max:7e6}},{text:"Tối ưu (7 - 15 triệu)",action:"setUpgradeBudget",data:{min:7e6,max:15e6}},{text:"Đột phá (> 15 triệu)",action:"setUpgradeBudget",data:{min:15e6,max:1/0}}])}
function promptForCurrentHardware_Interactive(){const e=conversationState.upgradeGoal;let t=["cpu","mainboard"];"gaming"===e&&t.push("gpu");const a=t.map(e=>`\n        <div class="interactive-select-container">\n            <label class="form-label">${{cpu:"CPU hiện tại",mainboard:"Mainboard hiện tại",gpu:"VGA hiện tại"}[e]}</label>\n            <input type="text" id="current_${e}_input" data-type="${e}" class="form-input interactive-select-input" placeholder="Gõ để tìm kiếm ${e.toUpperCase()}...">\n            <div id="current_${e}_list" class="interactive-select-list"></div>\n        </div>\n    `).join(""),s=`\n        <div class="ai-result-card" style="margin-top:0;">\n            <div class="ai-result-body" style="padding: 1rem;">\n                <p style="font-size: 0.9rem; margin-bottom: 1rem;">Để đưa ra lời khuyên chính xác, bạn vui lòng tìm và chọn các linh kiện hiện tại của mình từ danh sách nhé:</p>\n                <form id="upgrade-form">${a}</form>\n            </div>\n        </div>\n    `;appendMessage('ai',"Vui lòng cho tôi biết cấu hình hiện tại của bạn:",s),t.forEach(e=>{const t=document.getElementById(`current_${e}_input`),a=document.getElementById(`current_${e}_list`),s=allPcComponents.filter(t=>t.type===e);t.addEventListener("input",()=>{const e=t.value.toLowerCase();if(e.length<2)return void(a.style.display="none");const o=s.filter(t=>t.name.toLowerCase().includes(e)).slice(0,20);a.innerHTML=o.map(e=>`<div class="interactive-select-item" data-id="${e.id}">${e.name}</div>`).join(""),a.style.display=o.length>0?"block":"none"}),a.addEventListener("click",e=>{if(e.target.classList.contains("interactive-select-item")){const o=e.target.dataset.id,n=s.find(e=>e.id===o);t.value=n.name,t.dataset.selectedId=n.id,a.style.display="none"}})});const o={text:"Tiếp tục",action:"getCurrentHardware",data:{}};const n=document.getElementById("ai-options-container");n.innerHTML="";const i=document.createElement("button");i.className="ai-option-btn",i.textContent=o.text,i.onclick=()=>{let e={};let a=!0;t.forEach(t=>{const s=document.getElementById(`current_${t}_input`).dataset.selectedId;s?e[t]=allPcComponents.find(e=>e.id===s):a=!1}),a?handleOptionClick("Cấu hình của tôi là...","getCurrentHardware",e):alert("Vui lòng tìm và chọn tất cả các linh kiện được yêu cầu từ danh sách.")},n.appendChild(i)}
function promptForCurrentPsu(){appendMessage('ai',"Cảm ơn bạn. Bước cuối cùng và rất quan trọng, bạn cho tôi biết bộ nguồn (PSU) hiện tại của bạn có công suất bao nhiêu Watt nhé? (Bạn có thể xem thông số này trên thân của bộ nguồn)");const e=`\n        <div class="ai-result-card" style="margin-top:0;">\n            <div class="ai-result-body" style="padding: 1rem;">\n                <form id="psu-form">\n                    <input type="number" id="current_psu_wattage" placeholder="Nhập công suất PSU, vd: 550" class="form-input">\n                </form>\n            </div>\n        </div>\n    `;appendMessage('ai',"Công suất nguồn hiện tại:",e);const t={text:"Phân tích & Đề xuất",action:"analyzeUpgrade",data:{}};const a=document.getElementById("ai-options-container");a.innerHTML="";const s=document.createElement("button");s.className="ai-option-btn",s.textContent=t.text,s.onclick=()=>{const e=document.getElementById("current_psu_wattage").value;if(!e||isNaN(e)||e<200)return void alert("Vui lòng nhập một công suất hợp lệ (vd: 550).");t.data={wattage:parseInt(e)},handleOptionClick(`Nguồn của tôi là ${e}W`,"analyzeUpgrade",t.data)},a.appendChild(s)}
function analyzeAndSuggestUpgrade() { appendMessage('ai', "Đã nhận đủ thông tin. Bộ não AI đang phân tích sâu hơn để tìm ra combo nâng cấp tốt nhất. Xin chờ một lát..."); setTimeout(() => { const { upgradeGoal, upgradeBudget, currentHardware, currentPsuWattage } = conversationState; const bestUpgradeCombo = findBestUpgradeCombo(upgradeGoal, upgradeBudget, currentHardware); if (!bestUpgradeCombo || bestUpgradeCombo.items.length === 0) { appendMessage('ai', "Rất tiếc, với ngân sách này, tôi chưa tìm thấy phương án nâng cấp nào thực sự mang lại hiệu quả rõ rệt. Bạn có thể cân nhắc tăng ngân sách hoặc bắt đầu lại nhé."); showOptionsAfterUpgradeSuggestion(null); return; } const { requiredPsuWattage } = calculateNewSystemPower(currentHardware, bestUpgradeCombo.items); let finalHtml = ''; let suggestionItems = bestUpgradeCombo.items; if (currentPsuWattage >= requiredPsuWattage) { finalHtml = createSuggestionHtml("Nguồn của bạn đủ đáp ứng!", bestUpgradeCombo.reason, bestUpgradeCombo.items, bestUpgradeCombo.totalPrice, "rgba(0, 255, 100, 0.1)", "#50ff50"); appendMessage('ai', 'Tuyệt vời! Dựa trên phân tích, đây là combo nâng cấp tốt nhất cho bạn:', finalHtml); } else { const remainingBudgetForPsu = upgradeBudget.max - bestUpgradeCombo.totalPrice; const suitablePsu = findComponents('psu', p => p.wattage >= requiredPsuWattage && p.price <= remainingBudgetForPsu).sort((a, b) => a.price - b.price)[0]; if (suitablePsu) { const psuSuggestion = { type: 'psu', item: suitablePsu }; suggestionItems.push(psuSuggestion); finalHtml = createSuggestionHtml("Cảnh báo: Cần nâng cấp nguồn!", "Combo nâng cấp này yêu cầu công suất lớn hơn. Để đảm bảo an toàn và ổn định, bạn cần nâng cấp cả bộ nguồn (PSU).", suggestionItems, bestUpgradeCombo.totalPrice + suitablePsu.price, "rgba(255, 150, 0, 0.1)", "#ff9600"); appendMessage('ai', 'Phân tích hoàn tất! Tôi đề xuất bạn nâng cấp theo combo sau:', finalHtml); } else { suggestionItems = []; finalHtml = createSuggestionHtml("Cảnh báo quan trọng: Nguồn không đủ!", `Combo nâng cấp tốt nhất cần một bộ nguồn mạnh hơn (khoảng ${requiredPsuWattage}W), nhưng ngân sách của bạn không đủ để thêm PSU.`, bestUpgradeCombo.items, null, "rgba(255, 50, 50, 0.1)", "#ff3232", "<strong>Lời khuyên:</strong> Bạn nên cân nhắc giảm bớt một linh kiện trong combo để dành tiền nâng cấp nguồn, hoặc tăng tổng ngân sách đầu tư."); appendMessage('ai', 'Phân tích hoàn tất, tuy nhiên có một vấn đề quan trọng:', finalHtml); } } showOptionsAfterUpgradeSuggestion(suggestionItems); }, 1500); }
function findBestUpgradeCombo(goal, budget, hardware) { let suggestions = []; const primary = findPrimaryUpgrade_Interactive(goal, budget, hardware); if (!primary) return null; suggestions.push(primary); let remainingBudget = { min: 0, max: budget.max - primary.item.price }; let tempHardware = { ...hardware, [primary.type]: primary.item }; if (remainingBudget.max > 1000000) { let secondary = null; if (goal === 'gaming' && primary.type === 'gpu') { const cpuCandidate = findPrimaryUpgrade_Interactive('workstation', remainingBudget, tempHardware); if (cpuCandidate && cpuCandidate.type === 'cpu') secondary = cpuCandidate; } else if ((goal === 'workstation' || goal === 'gaming') && primary.type === 'cpu') { const ssdCandidate = findPrimaryUpgrade_Interactive('general', remainingBudget, tempHardware); if (ssdCandidate && ssdCandidate.type === 'storage') secondary = ssdCandidate; } if (secondary) { suggestions.push(secondary); } } return { items: suggestions, totalPrice: suggestions.reduce((sum, s) => sum + s.item.price, 0), reason: suggestions.length > 1 ? "Đây là combo nâng cấp mang lại hiệu quả toàn diện nhất trong tầm giá." : suggestions[0].reason }; }
function findPrimaryUpgrade_Interactive(goal, budget, hardware) { let candidates = []; const currentCpuScore = hardware.cpu?.performance_score || 0; const currentGpuScore = hardware.gpu?.performance_score || 0; if (goal === 'general') { const ssd = findComponents('storage', c => c.name.toLowerCase().includes('nvme') && c.price <= budget.max).sort((a, b) => a.price - b.price)[0]; if (ssd) candidates.push({ type: 'storage', item: ssd, reason: `Đây là nâng cấp đáng giá nhất, giúp máy bạn khởi động và chạy ứng dụng nhanh hơn gấp nhiều lần.`, priority: 100 }); } if (goal === 'gaming') { const gpus = findComponents('gpu', c => c.price <= budget.max && c.performance_score > currentGpuScore).sort((a, b) => b.performance_score - a.performance_score)[0]; if (gpus) candidates.push({ type: 'gpu', item: gpus, reason: `Nâng cấp VGA sẽ mang lại cải thiện rõ rệt nhất về FPS và chất lượng hình ảnh khi chơi game.`, priority: 90 }); } if (goal === 'workstation' || goal === 'gaming') { const cpus = findComponents('cpu', c => c.socket === hardware.mainboard.socket && c.price <= budget.max && c.performance_score > currentCpuScore).sort((a, b) => b.performance_score - a.performance_score)[0]; if (cpus) candidates.push({ type: 'cpu', item: cpus, reason: `Nâng cấp CPU sẽ tăng tốc đáng kể các tác vụ xử lý đa nhân như render video, livestream.`, priority: 80 }); } if (candidates.length === 0) return null; return candidates.sort((a, b) => b.priority - a.priority)[0]; }
function calculateNewSystemPower(currentHardware, newItems) { let newSystemConfig = { ...currentHardware }; newItems.forEach(item => { newSystemConfig[item.type] = item.item; }); const newSystemWattage = Object.values(newSystemConfig).reduce((sum, comp) => sum + (comp?.wattage || 0), 0) + 100; const requiredPsuWattage = Math.ceil((newSystemWattage * 1.5) / 50) * 50; return { newSystemWattage, requiredPsuWattage }; }
function createSuggestionHtml(title, description, items, totalPrice, headerBg, headerColor, footerContent = '') { const itemsHtml = items.map(createSuggestionItemHtml).join(''); const footerHtml = totalPrice !== null ? `<div class="ai-result-footer"><span>TỔNG CỘNG NÂNG CẤP:</span><span>${formatPrice(totalPrice)}</span></div>` : `<div class="ai-result-footer" style="font-size: 0.9rem; font-weight: normal; display: block;">${footerContent}</div>`; return `<div class="ai-result-card"><div class="ai-result-header" style="background-color: ${headerBg};"><h3 style="color: ${headerColor};">${title}</h3><p>${description}</p></div>${itemsHtml}${footerHtml}</div>`; }
function createSuggestionItemHtml(suggestion) { const typeMap = { cpu: 'Vi xử lý (CPU)', mainboard: 'Bo mạch chủ', ram: 'RAM', gpu: 'Card đồ họa (VGA)', storage: 'Ổ cứng', psu: 'Nguồn (PSU)' }; return `<div class="ai-result-body" style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;"><div class="build-item-row"><img src="${suggestion.item.image}" alt="${suggestion.item.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-type">${typeMap[suggestion.type] || suggestion.type}</span><span class="build-item-name">${suggestion.item.name}</span></div><span class="build-item-price">${formatPrice(suggestion.item.price)}</span></div></div>`; }
function showOptionsAfterUpgradeSuggestion(suggestionItems) { let options = []; if (suggestionItems && suggestionItems.length > 0) { options.push({ text: 'Thêm vào Yêu Cầu', action: 'addSuggestionsToCart', data: { items: suggestionItems } }); } options.push({ text: 'Tư vấn dịch vụ đi kèm', action: 'suggestRelatedServices' }); options.push({ text: 'Bắt đầu lại', action: 'restart' }); showOptions(options); }
function suggestRelatedServicesAfterUpgrade() {
    appendMessage('ai', "Chắc chắn rồi! Để đảm bảo hệ thống của bạn hoạt động hoàn hảo sau khi nâng cấp, tôi đề xuất các dịch vụ chuyên nghiệp sau:");
    const serviceIds = ['scpc01', 'scpc03'];
    const allSubServices = allServicesData.flatMap(s => s.subServices || []);
    recommendedServices = serviceIds.map(id => allSubServices.find(sub => sub && sub.subId === id)).filter(Boolean);
    if (recommendedServices.length > 0) {
        displayServiceRecommendations(recommendedServices, false);
        showOptions([
            { text: 'Thêm các dịch vụ này', action: 'addServicesToCart' },
            { text: 'Bắt đầu lại', action: 'restart' }
        ]);
    } else {
        appendMessage('ai', "Tôi không tìm thấy dịch vụ đi kèm phù hợp lúc này.");
        showOptions([{ text: 'Bắt đầu lại', action: 'restart' }]);
    }
}
function addSuggestionsToCart(items) {
    appendMessage('ai', "Đang thêm các linh kiện đề xuất vào giỏ hàng của bạn...");
    const itemsToAdd = items.map(s => ({ ...s.item, quantity: 1, subId: s.item.id, images: [s.item.image] }));
    if (typeof addBuildToCartFromAI === 'function') {
        addBuildToCartFromAI(itemsToAdd);
    }
    setTimeout(() => {
        appendMessage('ai', "Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại.");
        showOptions([{ text: 'Bắt đầu lại', action: 'restart' }]);
    }, 1000);
}

// --- LUỒNG XỬ LÝ SỰ CỐ ---
function promptForSymptom(){appendMessage('ai',"Tôi hiểu rồi. Xin hãy mô tả rõ hơn về triệu chứng mà máy tính của bạn đang gặp phải:"),showOptions([{text:"Máy chạy rất chậm, giật lag",action:"setSymptom",data:{symptom:"slow"}},{text:"Không lên nguồn / không lên hình",action:"setSymptom",data:{symptom:"no_power"}},{text:"Lỗi màn hình xanh (BSOD)",action:"setSymptom",data:{symptom:"bsod"}},{text:"Nhiễm virus, hiện nhiều quảng cáo lạ",action:"setSymptom",data:{symptom:"virus"}},{text:"Vấn đề khác",action:"setSymptom",data:{symptom:"other"}}])}
function provideTroubleshootingSteps(symptom) { const troubleshootingData = { slow: { title: "Máy chạy chậm, giật lag", steps: [ "<strong>Khởi động lại máy tính:</strong> Đây là bước đơn giản nhất nhưng thường rất hiệu quả để giải phóng bộ nhớ RAM tạm thời.", "<strong>Kiểm tra các ứng dụng khởi động cùng Windows:</strong> Mở Task Manager (Ctrl+Shift+Esc), vào tab 'Startup' và tắt các ứng dụng không cần thiết.", "<strong>Dọn dẹp ổ đĩa:</strong> Chuột phải vào ổ C, chọn 'Properties' -> 'Disk Cleanup' để xóa các file rác an toàn." ] }, no_power: { title: "Không lên nguồn / không lên hình", steps: [ "<strong>Kiểm tra dây nguồn và ổ cắm:</strong> Đảm bảo dây cắm chắc chắn vào cả máy tính và ổ điện. Thử một ổ cắm khác.", "<strong>Kiểm tra công tắc nguồn PSU:</strong> Phía sau thùng máy, đảm bảo công tắc trên bộ nguồn đang ở vị trí 'I' (Bật), không phải 'O' (Tắt).", "<strong>Kiểm tra dây tín hiệu màn hình:</strong> Đảm bảo dây (HDMI, DisplayPort) được cắm chặt vào cả màn hình và card đồ họa." ] }, bsod: { title: "Lỗi màn hình xanh (BSOD)", steps: [ "<strong>Chụp lại mã lỗi:</strong> Cố gắng dùng điện thoại chụp lại màn hình xanh, đặc biệt là dòng chữ STOP CODE (vd: IRQL_NOT_LESS_OR_EQUAL).", "<strong>Gỡ các thiết bị ngoại vi:</strong> Rút hết USB, máy in, webcam... ra khỏi máy và khởi động lại xem có hết lỗi không.", "<strong>Kiểm tra lại RAM:</strong> Nếu bạn rành kỹ thuật, hãy tắt máy, rút điện, mở thùng máy và cắm lại các thanh RAM cho chắc chắn." ] }, virus: { title: "Nhiễm virus, quảng cáo lạ", steps: [ "<strong>Ngắt kết nối Internet:</strong> Rút dây mạng hoặc tắt Wifi ngay lập tức để ngăn virus lây lan hoặc gửi dữ liệu ra ngoài.", "<strong>Quét bằng Windows Defender:</strong> Mở 'Windows Security', vào 'Virus & threat protection' và chọn 'Full scan'.", "<strong>Tuyệt đối không đăng nhập:</strong> Không đăng nhập vào tài khoản ngân hàng, mạng xã hội... cho đến khi máy được xử lý." ] }, other: { title: "Các vấn đề phức tạp khác", steps: [] } }; const data = troubleshootingData[symptom]; if (symptom === 'other' || !data) { appendMessage('ai', "Với các vấn đề phức tạp, cách tốt nhất là mang máy đến để được các kỹ thuật viên của chúng tôi kiểm tra trực tiếp bằng các công cụ chuyên dụng. Bạn có thể liên hệ qua SĐT hoặc Zalo để được hỗ trợ nhanh nhất nhé!"); showOptions([{ text: 'Bắt đầu lại', action: 'restart' }]); return; } const stepsHtml = data.steps.map(step => `<li>${step}</li>`).join(''); const troubleshootingHtml = ` <div class="ai-result-card"> <div class="ai-result-header"> <h3>Các bước bạn có thể thử tại nhà</h3> <p>Trước khi cần đến sự trợ giúp chuyên nghiệp, bạn hãy thử các bước đơn giản và an toàn sau đây cho tình trạng: <strong>${data.title}</strong></p> </div> <div class="ai-result-body" style="padding: 0 1.25rem 1rem;"> <ul style="list-style-type: decimal; padding-left: 20px; display: flex; flex-direction: column; gap: 0.75rem;"> ${stepsHtml} </ul> </div> </div> `; appendMessage('ai', "Tôi hiểu vấn đề của bạn. Dưới đây là một vài gợi ý:", troubleshootingHtml); showOptions([ { text: 'Vẫn không được, cần trợ giúp!', action: 'escalateToProfessional', data: { symptom: symptom } }, { text: 'Cảm ơn, tôi sẽ thử!', action: 'restart' } ]); }
function processDiagnosis(symptom) {
    appendMessage('ai', "Đã hiểu. Dựa trên mô tả của bạn, đây là các gói dịch vụ chuyên nghiệp có thể giải quyết triệt để vấn đề này:");
    let serviceIds = [];
    switch (symptom) {
        case 'slow': serviceIds = ['scpc01', 'scpc03']; break;
        case 'no_power': serviceIds = ['scpc02']; break;
        case 'bsod': serviceIds = ['scpc03', 'scpc02']; break;
        case 'virus': serviceIds = ['anm02', 'scpc03']; break;
    }
    const allSubServices = allServicesData.flatMap(s => s.subServices || []);
    recommendedServices = serviceIds.map(id => allSubServices.find(sub => sub && sub.subId === id)).filter(Boolean);
    if (recommendedServices.length > 0) {
        displayServiceRecommendations(recommendedServices);
        showOptions([
            { text: 'Thêm dịch vụ vào Yêu Cầu', action: 'addServicesToCart' },
            { text: 'Bắt đầu lại', action: 'restart' }
        ]);
    } else {
        appendMessage('ai', "Có vẻ đã có lỗi xảy ra, tôi không tìm thấy dịch vụ phù hợp.");
        showOptions([{ text: 'Bắt đầu lại', action: 'restart' }]);
    }
}

// --- CÁC HÀM TIỆN ÍCH KHÁC ---
function displayServiceRecommendations(e,t=!0){const a=e.map(e=>`<div class="build-item-row"><img src="${e.images[0]||"https://placehold.co/100x100/0a0a1a/00ffff?text=Dich+Vu"}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span></div>`).join(""),s=t?`<div class="ai-result-header"><h3>Dịch Vụ Đề Xuất</h3></div>`:``,o=`<div class="ai-result-card">${s}<div class="ai-result-body">${a}</div></div>`;appendMessage('ai',"Đây là các dịch vụ phù hợp:",o)}
function promptForServiceCategory(){appendMessage('ai',"Rất sẵn lòng! Bạn đang quan tâm đến lĩnh vực dịch vụ nào sau đây?");const e=allServicesData.filter(e=>"sua-chua-pc"!==e.id&&"xay-dung-pc"!==e.id).map(e=>({text:e.name,action:"setServiceCategory",data:{categoryId:e.id}}));showOptions(e)}
function displaySubServices(e){const t=allServicesData.find(t=>t.id===e);if(!t||!t.subServices)return void appendMessage('ai',"Rất tiếc, tôi không tìm thấy thông tin cho dịch vụ này.");appendMessage('ai',`Trong lĩnh vực "${t.name}", chúng tôi cung cấp các gói sau:`),recommendedServices=t.subServices,displayServiceRecommendations(recommendedServices,!1),showOptions([{text:"Thêm tất cả vào Yêu Cầu",action:"addServicesToCart"},{text:"Tìm hiểu lĩnh vực khác",action:"startServiceNav"},{text:"Bắt đầu lại",action:"restart"}])}
function addRecommendedServicesToCart(){appendMessage('ai',"Đã hiểu, tôi đang thêm các dịch vụ vào giỏ hàng của bạn..."),"function"==typeof addServicesToCartFromAI&&recommendedServices.length>0?(addServicesToCartFromAI(recommendedServices),setTimeout(()=>{appendMessage('ai',"Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu."),showOptions([{text:"Bắt đầu lại",action:"restart"}])},1e3)):(appendMessage('ai',"Không có dịch vụ nào để thêm hoặc đã có lỗi xảy ra."),showOptions([{text:"Bắt đầu lại",action:"restart"}]))}
function findComponents(e,t=()=>!0){return allPcComponents.filter(a=>a.type===e&&t(a)).sort((e,t)=>e.price-t.price)}
function promptForComponentChange(e){const t={cpu:"Vi xử lý (CPU)",mainboard:"Bo mạch chủ",ram:"RAM",gpu:"Card đồ họa (VGA)",storage:"Ổ cứng",psu:"Nguồn (PSU)",case:"Vỏ case",cooler:"Tản nhiệt"},a=currentBuild.find(t=>t.type===e),s=currentBuild.find(e=>"cpu"===e.type),o=currentBuild.find(e=>"mainboard"===e.type);let n=()=>!0;"mainboard"===e?n=e=>e.socket===s?.socket:"cpu"===e?n=e=>e.socket===o?.socket:"ram"===e&&(n=e=>e.ram_type===o?.ram_type);const i=findComponents(e,n),l=i.map(e=>`<div class="build-item-row ${e.id===a.id?"current":""}"><img src="${e.image}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span><button class="ai-option-btn select-btn" ${e.id===a.id?"disabled":""} data-action="selectNewComponent" data-data='${JSON.stringify({newComponent:e})}'>Chọn</button></div>`).join(""),r=`<div class="ai-result-card"><div class="ai-result-header"><h3>Chọn ${t[e]} thay thế</h3><p>Các lựa chọn dưới đây đều tương thích.</p></div><div class="ai-result-body">${l}</div></div>`;appendMessage('ai',`Đây là các lựa chọn cho ${t[e]}:`,r),showOptions([{text:"Quay lại",action:"redisplayBuild"}])}
function updateComponent(e){const t=currentBuild.findIndex(t=>t.type===e.type);if(-1!==t){currentBuild[t]=e;const a=currentBuild.find(e=>"cpu"===e.type),s=currentBuild.find(e=>"mainboard"===e.type);"cpu"===e.type&&e.socket!==s.socket&&(currentBuild[currentBuild.findIndex(e=>"mainboard"===e.type)]=findComponents("mainboard",t=>t.socket===e.socket)[0]),"mainboard"===e.type&&(e.socket!==a.socket&&(currentBuild[currentBuild.findIndex(t=>"cpu"===t.type)]=findComponents("cpu",t=>t.socket===e.socket)[0]),currentBuild[currentBuild.findIndex(e=>"ram"===e.type)].ram_type!==e.ram_type&&(currentBuild[currentBuild.findIndex(e=>"ram"===e.type)]=findComponents("ram",t=>t.ram_type===e.ram_type)[0])),redisplayCurrentBuild()}}
function redisplayCurrentBuild(){const e=calculatePsuAndFinalize(currentBuild,{min:0,max:1/0});e&&e.build?(currentBuild=e.build,displayBuildResult(e.build,e.totalPrice,e.wattage),showOptionsAfterBuild()):appendMessage('ai',"Đã có lỗi xảy ra khi hiển thị lại cấu hình.")}
async function urlToBase64(e){try{const t=await fetch(e,{mode:"cors"});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const a=await t.blob();return new Promise((e,t)=>{const s=new FileReader;s.onloadend=()=>e(s.result),s.onerror=t,s.readAsDataURL(a)})}catch(t){return console.error(`Không thể chuyển đổi URL thành Base64: ${e}`,t),"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwZDBkMWYiIHN0cm9rZT0iIzAwZmZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNUlMIDE0IDhsLTcgNyI+PC9wYXRoPjxjaXJjbGUgY3g9IjYuNSIgY3k9IjYuNSIgciI9IjIuNSIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjIiIHJ5PSIyIiBzdHJva2U9IiMwMGZmZmYiIGZpbGw9Im5vbmUiLz48L3N2Zz4="}}
async function generateAndShareImage(){appendMessage('ai',"Đang chuẩn bị dữ liệu và 'vẽ' ảnh cấu hình, vui lòng chờ một chút...");showOptions([]);try{const e=document.querySelector('a[aria-label="Trang chủ"] img')?.src||"img/logo.jpg",t=await urlToBase64(e),a=await Promise.all(currentBuild.map(async e=>{let t=e.image;t&&t.includes("google.com/search?q=")?t=new URLSearchParams(new URL(t).search).get("q"):t&&""!==t.trim()||(t=`https://placehold.co/100x100/1a1a2e/00ffff?text=${encodeURIComponent(e.type)}`);const a=await urlToBase64(t);return{...e,imageBase64:a}}));const s=document.getElementById("image-template-container"),o=document.getElementById("template-logo"),n=document.getElementById("template-component-list"),i=document.getElementById("template-total-price");o.src=t,n.innerHTML=a.map(e=>`<div style="display: flex; align-items: center; padding: 10px 5px; border-bottom: 1px dashed #3a3a5a;"><img src="${e.imageBase64}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 15px;" /><div style="flex-grow: 1; padding-right: 15px;"><div style="font-size: 0.8em; color: #999; text-transform: uppercase;">${e.type}</div><div style="color: #E0E0E0;">${e.name}</div></div><span style="font-weight: 700; color: white; font-family: 'Exo 2', sans-serif;">${formatPrice(e.price)}</span></div>`).join("");const l=currentBuild.reduce((e,t)=>e+t.price,0);i.textContent=formatPrice(l);const r=await html2canvas(s,{useCORS:!0,allowTaint:!0,backgroundColor:"#0d0d1f"}),c=r.toDataURL("image/png"),d=`<img src="${c}" alt="Xem trước cấu hình" style="max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color);">`;appendMessage('ai',"Ảnh cấu hình của bạn đã sẵn sàng!",d);const m=[{text:"Lưu ảnh về máy",action:"downloadImage",imageUrl:c},{text:"Thêm vào Yêu Cầu",action:"addToCart"},{text:"Làm lại từ đầu",action:"restart"}];if(navigator.share){const e=document.createElement("button");e.className="ai-option-btn",e.textContent="Chia sẻ ngay...",e.onclick=()=>{r.toBlob(e=>{try{const t=new File([e],"cau-hinh-pc-minhdang.png",{type:"image/png"}),a={files:[t]};navigator.canShare(a)&&navigator.share(a)}catch(e){console.log("Lỗi khi chia sẻ:",e)}},"image/png")};const t=document.getElementById("ai-options-container");showOptions(m),t.insertBefore(e,t.firstChild)}else showOptions(m)}catch(e){console.error("Lỗi khi tạo ảnh:",e),appendMessage('ai',`Rất tiếc, có lỗi xảy ra khi tạo ảnh: ${e.message}`),showOptionsAfterBuild()}}
function downloadImage(e,t){const a=document.createElement("a");a.href=e,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a)}
function formatPrice(e){return isNaN(e)?e:new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(e)}
function findBestComponents(e,t,a){const s=allPcComponents.filter(a=>a.type===e&&t(a));if(0===s.length)return[];const o=s.map(e=>{const t=e.performance_score*a.performance+e.value_score*a.value+e.aesthetic_score*a.aesthetic;return{...e,score:t}});return o.sort((e,t)=>t.score-e.score)}
function calculatePsuAndFinalize(e,t){let a=[...e];const s=a.filter(e=>e).reduce((e,t)=>e+(t.wattage||0),0),o=50*Math.ceil(1.4*s/50),n=findComponents("psu",e=>e.wattage>=o).sort((e,t)=>t.value_score-e.value_score||e.price-t.price);if(0===n.length)return null;const i=n[0];a.push(i);const l=a.filter(Boolean),r=l.reduce((e,t)=>e+t.price,0);return r<t.min||r>t.max?t.max<=15e6&&r<=1.05*t.max?{build:l,totalPrice:r,wattage:o}:null:{build:l,totalPrice:r,wattage:o}}

