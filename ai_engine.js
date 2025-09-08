/**
 * ai_engine.js - Bộ não xử lý logic cho Trợ lý AI
 * Phiên bản: 16.0 (AI Giải Thích Lựa Chọn)
 */

// Biến toàn cục để lưu trữ dữ liệu và trạng thái
let allPcComponents = [];
let allServicesData = [];
let conversationState = {};
let currentBuild = [];
let recommendedServices = [];

// --- HÀM KHỞI TẠO & ĐIỀU PHỐI (Không thay đổi) ---
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

// --- LUỒNG HỘI THOẠI CHÍNH (Không thay đổi) ---
function startConversation() {
    document.getElementById('ai-modal')?.classList.add('visible');
    document.getElementById('ai-chat-log').innerHTML = '';
    conversationState = { step: 'start' };
    currentBuild = [];
    recommendedServices = [];
    appendMessage('ai', "Chào bạn, tôi là Trợ lý AI của Minh Đăng IT. Tôi có thể giúp gì cho bạn hôm nay?");
    showOptions([
        { text: 'Tư vấn lắp máy mới', action: 'startBuildPc' },
        { text: 'Máy của tôi gặp sự cố', action: 'startDiagnose' },
        { text: 'Tìm hiểu dịch vụ', action: 'startServiceNav' }
    ]);
}
function endConversation() { document.getElementById('ai-modal')?.classList.remove('visible'); }
function handleOptionClick(text, action, data = {}) {
    if(!['changeComponent', 'selectNewComponent', 'redisplayBuild'].includes(action)) { appendMessage('user', text); }
    document.getElementById('ai-options-container').innerHTML = '';
    setTimeout(() => {
        switch (action) {
            case 'startBuildPc': promptForBudget(); break;
            case 'setBudget': conversationState.budget = data; promptForPurpose(data.key); break;
            case 'setPurpose': conversationState.purpose = data; processBuildConfig(); break;
            case 'addToCart': addBuildToCart(); break;
            case 'changeComponent': promptForComponentChange(data.type); break;
            case 'selectNewComponent': updateComponent(data.newComponent); break;
            case 'redisplayBuild': redisplayCurrentBuild(); break;
            case 'saveBuild': generateAndShareImage(); break;
            case 'startDiagnose': promptForSymptom(); break;
            case 'setSymptom': processDiagnosis(data.symptom); break;
            case 'addServicesToCart': addRecommendedServicesToCart(); break;
            case 'startServiceNav': promptForServiceCategory(); break;
            case 'setServiceCategory': displaySubServices(data.categoryId); break;
            case 'restart': startConversation(); break;
        }
    }, 500);
}

// --- TIỆN ÍCH HIỂN THỊ (Không thay đổi) ---
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
function showOptions(options) {
    const optionsContainer = document.getElementById('ai-options-container');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'ai-option-btn';
        button.textContent = option.text;
        button.dataset.action = option.action;
        if (option.data) { button.dataset.data = JSON.stringify(option.data); }
        if (option.imageUrl) { button.dataset.imageUrl = option.imageUrl; }
        optionsContainer.appendChild(button);
    });
}
function showOptionsAfterBuild() {
    showOptions([
        { text: 'Thêm vào Yêu Cầu', action: 'addToCart' },
        { text: 'Lưu ảnh cấu hình', action: 'saveBuild' },
        { text: 'Làm lại từ đầu', action: 'restart' }
    ]);
}

// --- CÁC LUỒNG TƯ VẤN KHÁC (Không thay đổi) ---
function promptForServiceCategory(){appendMessage('ai',"Rất sẵn lòng! Bạn đang quan tâm đến lĩnh vực dịch vụ nào sau đây?");const e=allServicesData.filter(e=>"sua-chua-pc"!==e.id&&"xay-dung-pc"!==e.id).map(e=>({text:e.name,action:"setServiceCategory",data:{categoryId:e.id}}));showOptions(e)}
function displaySubServices(e){const t=allServicesData.find(t=>t.id===e);if(!t||!t.subServices)return void appendMessage('ai',"Rất tiếc, tôi không tìm thấy thông tin cho dịch vụ này.");appendMessage('ai',`Trong lĩnh vực "${t.name}", chúng tôi cung cấp các gói sau:`),recommendedServices=t.subServices,displayServiceRecommendations(recommendedServices,!1),showOptions([{text:"Thêm tất cả vào Yêu Cầu",action:"addServicesToCart"},{text:"Tìm hiểu lĩnh vực khác",action:"startServiceNav"},{text:"Bắt đầu lại",action:"restart"}])}
function promptForSymptom(){appendMessage('ai',"Tôi hiểu rồi. Xin hãy mô tả rõ hơn về triệu chứng mà máy tính của bạn đang gặp phải:"),showOptions([{text:"Máy chạy rất chậm, giật lag",action:"setSymptom",data:{symptom:"slow"}},{text:"Không lên nguồn / không lên hình",action:"setSymptom",data:{symptom:"no_power"}},{text:"Lỗi màn hình xanh (BSOD)",action:"setSymptom",data:{symptom:"bsod"}},{text:"Nhiễm virus, hiện nhiều quảng cáo lạ",action:"setSymptom",data:{symptom:"virus"}},{text:"Vấn đề khác",action:"setSymptom",data:{symptom:"other"}}])}
function processDiagnosis(e){appendMessage('ai',"Dựa trên mô tả của bạn, tôi đang phân tích các giải pháp phù hợp...");let t="",a=[];switch(e){case"slow":t="Máy chạy chậm thường do nhiều nguyên nhân. Giải pháp tốt nhất là bảo trì toàn diện và cân nhắc nâng cấp ổ cứng SSD.",a=["scpc01","scpc02"];break;case"no_power":t="Lỗi không lên nguồn/hình là một sự cố nghiêm trọng. Cần phải kiểm tra phần cứng chuyên sâu.",a=["scpc02"];break;case"bsod":t="Lỗi màn hình xanh thường liên quan đến lỗi phần mềm, driver hoặc RAM. Cần kiểm tra và cài đặt lại hệ điều hành.",a=["scpc03"];break;case"virus":t="Nhiễm virus và phần mềm quảng cáo có thể gây mất dữ liệu. Cần phải quét và diệt virus bằng công cụ chuyên dụng.",a=["anm02","scpc03"];break;case"other":t="Với các vấn đề phức tạp, cách tốt nhất là mang máy đến để được kiểm tra trực tiếp.",a=[]}const s=allServicesData.flatMap(e=>e.subServices);recommendedServices=a.map(e=>s.find(t=>t.subId===e)).filter(Boolean),setTimeout(()=>{appendMessage('ai',t),recommendedServices.length>0?(displayServiceRecommendations(recommendedServices),showOptions([{text:"Thêm dịch vụ vào Yêu Cầu",action:"addServicesToCart"},{text:"Bắt đầu lại",action:"restart"}])):(appendMessage('ai',"Bạn có thể liên hệ trực tiếp qua SĐT hoặc Zalo để được hỗ trợ nhanh nhất nhé!"),showOptions([{text:"Bắt đầu lại",action:"restart"}]))},1e3)}
function displayServiceRecommendations(e,t=!0){const a=e.map(e=>`<div class="build-item-row"><img src="${e.images[0]||"https://placehold.co/100x100/0a0a1a/00ffff?text=Dich+Vu"}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span></div>`).join(""),s=t?`<div class="ai-result-header"><h3>Dịch Vụ Đề Xuất</h3></div>`:"",o=`<div class="ai-result-card">${s}<div class="ai-result-body">${a}</div></div>`;appendMessage('ai',"Đây là các dịch vụ phù hợp:",o)}
function addRecommendedServicesToCart(){appendMessage('ai',"Đã hiểu, tôi đang thêm các dịch vụ vào giỏ hàng của bạn..."),"function"==typeof addServicesToCartFromAI&&recommendedServices.length>0?(addServicesToCartFromAI(recommendedServices),setTimeout(()=>{appendMessage('ai',"Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu."),showOptions([{text:"Bắt đầu lại",action:"restart"}])},1e3)):(appendMessage('ai',"Không có dịch vụ nào để thêm hoặc đã có lỗi xảy ra."),showOptions([{text:"Bắt đầu lại",action:"restart"}]))}
function promptForBudget(){appendMessage('ai',"Tuyệt vời! Trước hết, bạn dự định đầu tư khoảng bao nhiêu cho bộ máy mới này?"),showOptions([{text:"Học sinh (< 8 triệu)",action:"setBudget",data:{key:"student-lt-8m",min:0,max:8e6}},{text:"Cơ bản (8 - 15 triệu)",action:"setBudget",data:{key:"basic-8-15m",min:8e6,max:15e6}},{text:"Tầm trung (15 - 25 triệu)",action:"setBudget",data:{key:"mid-15-25m",min:15e6,max:25e6}},{text:"Cao cấp (25 - 40 triệu)",action:"setBudget",data:{key:"high-25-40m",min:25e6,max:4e7}},{text:"Hạng sang (> 40 triệu)",action:"setBudget",data:{key:"luxury-gt-40m",min:4e7,max:1/0}}])}
function promptForPurpose(e){appendMessage('ai',"Đã hiểu. Bạn sẽ dùng máy chủ yếu cho mục đích gì?");let t=[{text:"Học tập & Giải trí nhẹ",action:"setPurpose",data:"study"},{text:"Chơi Game",action:"setPurpose",data:"gaming"},{text:"Làm Đồ họa / Video",action:"setPurpose",data:"workstation"}];"student-lt-8m"!==e&&"basic-8-15m"!==e||(t=t.filter(e=>"workstation"!==e.data)),showOptions(t)}

// --- LOGIC XÂY DỰNG CẤU HÌNH PC THÔNG MINH (Không thay đổi) ---
function processBuildConfig(){appendMessage('ai',"Ok, bộ não AI của tôi đang phân tích và tính toán để tìm ra cấu hình tối ưu nhất cho bạn. Vui lòng chờ trong giây lát..."),setTimeout(()=>{const e=buildPcSmart(conversationState.budget,conversationState.purpose);e&&e.build?(currentBuild=e.build,displayBuildResult(e.build,e.totalPrice,e.wattage),showOptionsAfterBuild()):(appendMessage('ai',"Rất tiếc, tôi không tìm thấy cấu hình nào phù hợp với các tiêu chí này. Có thể do ngân sách quá thấp so với các linh kiện hiện có. Bạn vui lòng thử lại với lựa chọn khác nhé."),showOptions([{text:"Chọn lại ngân sách",action:"startBuildPc"}]))},1e3)}
function findBestComponents(e,t,a){const s=allPcComponents.filter(a=>a.type===e&&t(a));if(0===s.length)return[];const o=s.map(e=>{const t=e.performance_score*a.performance+e.value_score*a.value+e.aesthetic_score*a.aesthetic;return{...e,score:t}});return o.sort((e,t)=>t.score-e.score)}
function buildPcSmart(e,t){const a={gaming:{performance:.6,value:.3,aesthetic:.1},workstation:{performance:.7,value:.3,aesthetic:0},study:{performance:.2,value:.7,aesthetic:.1}}[t],s="study"===t||"workstation"===t&&e.max<15e6,o=s?e=>!e.name.includes("F"):()=>!0,n=findBestComponents("cpu",o,a),i="gaming"===t||"workstation"===t?findBestComponents("gpu",()=>!0,a):[null];for(const e of n)for(const t of i){let s={cpu:e,gpu:t};const o=findBestComponents("mainboard",e=>e.socket===s.cpu.socket,a);if(0===o.length)continue;s.mainboard=o[0];const n=findBestComponents("ram",e=>e.ram_type===s.mainboard.ram_type,a);if(0===n.length)continue;s.ram=n[0];const l={performance:.1,value:.8,aesthetic:.1};if(s.storage=findBestComponents("storage",()=>!0,l)[0],s.case=findBestComponents("case",()=>!0,l)[0],!s.storage||!s.case)continue;const r=Object.values(s).filter(Boolean),c=calculatePsuAndFinalize(r,e);if(c)return c}return null}
function calculatePsuAndFinalize(e,t){let a=[...e];const s=a.filter(e=>e).reduce((e,t)=>e+(t.wattage||0),0),o=50*Math.ceil(1.4*s/50),n=findComponents("psu",e=>e.wattage>=o).sort((e,t)=>t.value_score-e.value_score||e.price-t.price);if(0===n.length)return null;const i=n[0];a.push(i);const l=a.filter(Boolean),r=l.reduce((e,t)=>e+t.price,0);return r<t.min||r>t.max?t.max<=15e6&&r<=1.05*t.max?{build:l,totalPrice:r,wattage:o}:null:{build:l,totalPrice:r,wattage:o}}
function formatPrice(e){return isNaN(e)?e:new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(e)}

// --- NÂNG CẤP: HIỂN THỊ CẤU HÌNH KÈM GIẢI THÍCH ---
/**
 * NÂNG CẤP: Hiển thị kết quả cấu hình, kèm theo nút thông tin giải thích.
 */
function displayBuildResult(build, totalPrice, wattage) {
    const componentToVietnamese = { cpu: 'Vi xử lý (CPU)', mainboard: 'Bo mạch chủ', ram: 'RAM', gpu: 'Card đồ họa (VGA)', storage: 'Ổ cứng', psu: 'Nguồn (PSU)', case: 'Vỏ case', cooler: 'Tản nhiệt' };
    
    const buildHtml = build.map(item => {
        const reason = getComponentReason(item, conversationState.purpose);
        const infoIconHtml = `
            <i class="info-icon">i
                <span class="info-tooltip">${reason}</span>
            </i>`;

        return `
            <div class="build-item-row">
                <img src="${item.image}" alt="${item.name}" class="build-item-image">
                <div class="build-item-info">
                    <span class="build-item-type">${componentToVietnamese[item.type] || item.type}</span>
                    <span class="build-item-name">${item.name} ${infoIconHtml}</span>
                </div>
                <span class="build-item-price">${formatPrice(item.price)}</span>
                <button class="ai-option-btn change-btn" data-action="changeComponent" data-data='${JSON.stringify({type: item.type})}'>Thay đổi</button>
            </div>`;
    }).join('');

    const resultHtml = `
        <div class="ai-result-card">
            <div class="ai-result-header">
                <h3>Cấu Hình Đề Xuất</h3>
                <p>Dựa trên nhu cầu của bạn, đây là cấu hình tối ưu nhất (yêu cầu khoảng ${wattage}W).</p>
            </div>
            <div class="ai-result-body">${buildHtml}</div>
            <div class="ai-result-footer">
                <span>TỔNG CỘNG:</span>
                <span>${formatPrice(totalPrice)}</span>
            </div>
        </div>`;
    appendMessage('ai', 'Tôi đã hoàn tất cấu hình cho bạn!', resultHtml);
}

/**
 * NÂNG CẤP: Hàm cung cấp lý do lựa chọn linh kiện.
 */
function getComponentReason(component, purpose) {
    const purposeText = {
        gaming: "chơi game",
        workstation: "công việc đồ họa",
        study: "học tập và giải trí"
    }[purpose];

    switch (component.type) {
        case 'cpu':
            if (!component.name.includes('F') && (purpose === 'study' || !currentBuild.find(c => c.type === 'gpu'))) {
                return `Tôi chọn CPU này vì nó có nhân đồ họa tích hợp, giúp bạn tiết kiệm chi phí card màn hình rời mà vẫn đáp ứng tốt nhu cầu ${purposeText}.`;
            }
            return `Đây là CPU có hiệu năng trên giá thành (P/P) tốt nhất, rất phù hợp cho nhu cầu ${purposeText} của bạn trong tầm giá này.`;
        case 'gpu':
            return `Card đồ họa này là lựa chọn tối ưu trong phân khúc, đảm bảo trải nghiệm ${purposeText} mượt mà và hiệu quả.`;
        case 'mainboard':
            return "Bo mạch chủ này hoàn toàn tương thích với CPU, có đủ các cổng kết nối cần thiết và nền tảng ổn định để bạn sử dụng lâu dài.";
        case 'ram':
            const ramSize = component.name.includes('32GB') ? '32GB' : (component.name.includes('16GB') ? '16GB' : '8GB');
            return `${ramSize} RAM là mức dung lượng lý tưởng cho việc đa nhiệm và các tác vụ ${purposeText} một cách thoải mái.`;
        case 'storage':
            if (component.name.toLowerCase().includes('nvme')) {
                return "Ổ cứng SSD NVMe này sẽ giúp máy tính khởi động Windows và tải ứng dụng siêu nhanh, tăng tốc toàn bộ trải nghiệm của bạn.";
            }
            return "Ổ cứng này có dung lượng lớn, phù hợp để lưu trữ nhiều tài liệu, game và phim ảnh.";
        case 'psu':
            return `Bộ nguồn này cung cấp đủ công suất cho toàn bộ hệ thống và có chứng nhận hiệu suất tốt, đảm bảo hoạt động ổn định và an toàn.`;
        case 'case':
            return "Vỏ case này có thiết kế thông thoáng, giúp các linh kiện bên trong luôn mát mẻ, đồng thời vẫn đảm bảo tính thẩm mỹ cho góc máy của bạn.";
        case 'cooler':
            return "Tản nhiệt này đủ sức mạnh để giữ cho CPU luôn mát mẻ ngay cả khi xử lý các tác vụ nặng, giúp duy trì hiệu năng cao và tăng tuổi thọ linh kiện.";
        default:
            return "Linh kiện này được chọn để đảm bảo sự tương thích và cân bằng cho toàn bộ hệ thống.";
    }
}

// --- CÁC HÀM TIỆN ÍCH KHÁC (Không thay đổi) ---
function addBuildToCart(){appendMessage('ai',"Tuyệt vời! Tôi đang thêm các linh kiện vào giỏ hàng..."),"function"==typeof addBuildToCartFromAI&&addBuildToCartFromAI(currentBuild),setTimeout(()=>{appendMessage('ai',"Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu."),showOptions([{text:"Bắt đầu lại",action:"restart"}])},1e3)}
function findComponents(e,t=()=>!0){return allPcComponents.filter(a=>a.type===e&&t(a)).sort((e,t)=>e.price-t.price)}
function promptForComponentChange(e){const t={cpu:"Vi xử lý (CPU)",mainboard:"Bo mạch chủ",ram:"RAM",gpu:"Card đồ họa (VGA)",storage:"Ổ cứng",psu:"Nguồn (PSU)",case:"Vỏ case",cooler:"Tản nhiệt"},a=currentBuild.find(t=>t.type===e),s=currentBuild.find(e=>"cpu"===e.type),o=currentBuild.find(e=>"mainboard"===e.type);let n=()=>!0;"mainboard"===e?n=e=>e.socket===s?.socket:"cpu"===e?n=e=>e.socket===o?.socket:"ram"===e&&(n=e=>e.ram_type===o?.ram_type);const i=findComponents(e,n),l=i.map(e=>`<div class="build-item-row ${e.id===a.id?"current":""}"><img src="${e.image}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span><button class="ai-option-btn select-btn" ${e.id===a.id?"disabled":""} data-action="selectNewComponent" data-data='${JSON.stringify({newComponent:e})}'>Chọn</button></div>`).join(""),r=`<div class="ai-result-card"><div class="ai-result-header"><h3>Chọn ${t[e]} thay thế</h3><p>Các lựa chọn dưới đây đều tương thích.</p></div><div class="ai-result-body">${l}</div></div>`;appendMessage('ai',`Đây là các lựa chọn cho ${t[e]}:`,r),showOptions([{text:"Quay lại",action:"redisplayBuild"}])}
function updateComponent(e){const t=currentBuild.findIndex(t=>t.type===e.type);if(-1!==t){currentBuild[t]=e;const a=currentBuild.find(e=>"cpu"===e.type),s=currentBuild.find(e=>"mainboard"===e.type);"cpu"===e.type&&e.socket!==s.socket&&(currentBuild[currentBuild.findIndex(e=>"mainboard"===e.type)]=findComponents("mainboard",t=>t.socket===e.socket)[0]),"mainboard"===e.type&&(e.socket!==a.socket&&(currentBuild[currentBuild.findIndex(t=>"cpu"===t.type)]=findComponents("cpu",t=>t.socket===e.socket)[0]),currentBuild[currentBuild.findIndex(e=>"ram"===e.type)].ram_type!==e.ram_type&&(currentBuild[currentBuild.findIndex(e=>"ram"===e.type)]=findComponents("ram",t=>t.ram_type===e.ram_type)[0])),redisplayCurrentBuild()}}
function redisplayCurrentBuild(){const e=calculatePsuAndFinalize(currentBuild,{min:0,max:1/0});e&&e.build?(currentBuild=e.build,displayBuildResult(e.build,e.totalPrice,e.wattage),showOptionsAfterBuild()):appendMessage('ai',"Đã có lỗi xảy ra khi hiển thị lại cấu hình.")}
async function urlToBase64(e){try{const t=await fetch(e,{mode:"cors"});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const a=await t.blob();return new Promise((e,t)=>{const s=new FileReader;s.onloadend=()=>e(s.result),s.onerror=t,s.readAsDataURL(a)})}catch(t){return console.error(`Không thể chuyển đổi URL thành Base64: ${e}`,t),"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwZDBkMWYiIHN0cm9rZT0iIzAwZmZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm9unQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNUlMIDE0IDhsLTcgNyI+PC9wYXRoPjxjaXJjbGUgY3g9IjYuNSIgY3k9IjYuNSIgciI9IjIuNSIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcng9IjIiIHJ5PSIyIiBzdHJva2U9IiMwMGZmZmYiIGZpbGw9Im5vbmUiLz48L3N2Zz4="}}
async function generateAndShareImage(){appendMessage('ai',"Đang chuẩn bị dữ liệu và 'vẽ' ảnh cấu hình, vui lòng chờ một chút...");showOptions([]);try{const e=document.querySelector('a[aria-label="Trang chủ"] img')?.src||"img/logo.jpg",t=await urlToBase64(e),a=await Promise.all(currentBuild.map(async e=>{let t=e.image;t&&t.includes("google.com/search?q=")?t=new URLSearchParams(new URL(t).search).get("q"):t&&""!==t.trim()||(t=`https://placehold.co/100x100/1a1a2e/00ffff?text=${encodeURIComponent(e.type)}`);const a=await urlToBase64(t);return{...e,imageBase64:a}}));const s=document.getElementById("image-template-container"),o=document.getElementById("template-logo"),n=document.getElementById("template-component-list"),i=document.getElementById("template-total-price");o.src=t,n.innerHTML=a.map(e=>`<div style="display: flex; align-items: center; padding: 10px 5px; border-bottom: 1px dashed #3a3a5a;"><img src="${e.imageBase64}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 15px;" /><div style="flex-grow: 1; padding-right: 15px;"><div style="font-size: 0.8em; color: #999; text-transform: uppercase;">${e.type}</div><div style="color: #E0E0E0;">${e.name}</div></div><span style="font-weight: 700; color: white; font-family: 'Exo 2', sans-serif;">${formatPrice(e.price)}</span></div>`).join("");const l=currentBuild.reduce((e,t)=>e+t.price,0);i.textContent=formatPrice(l);const r=await html2canvas(s,{useCORS:!0,allowTaint:!0,backgroundColor:"#0d0d1f"}),c=r.toDataURL("image/png"),d=`<img src="${c}" alt="Xem trước cấu hình" style="max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color);">`;appendMessage('ai',"Ảnh cấu hình của bạn đã sẵn sàng!",d);const m=[{text:"Lưu ảnh về máy",action:"downloadImage",imageUrl:c},{text:"Thêm vào Yêu Cầu",action:"addToCart"},{text:"Làm lại từ đầu",action:"restart"}];if(navigator.share){const e=document.createElement("button");e.className="ai-option-btn",e.textContent="Chia sẻ ngay...",e.onclick=()=>{r.toBlob(e=>{try{const t=new File([e],"cau-hinh-pc-minhdang.png",{type:"image/png"}),a={files:[t]};navigator.canShare(a)&&navigator.share(a)}catch(e){console.log("Lỗi khi chia sẻ:",e)}},"image/png")};const t=document.getElementById("ai-options-container");showOptions(m),t.insertBefore(e,t.firstChild)}else showOptions(m)}catch(e){console.error("Lỗi khi tạo ảnh:",e),appendMessage('ai',`Rất tiếc, có lỗi xảy ra khi tạo ảnh: ${e.message}`),showOptionsAfterBuild()}}
function downloadImage(e,t){const a=document.createElement("a");a.href=e,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a)}

