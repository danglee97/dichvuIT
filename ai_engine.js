/**
 * ai_engine.js - Bộ não xử lý logic cho Trợ lý AI
 * Phiên bản: 14.0 (Hoàn thiện - Hiển thị ảnh trong chat & Tải về)
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
    aiModal?.addEventListener('click', (e) => {
        if (e.target === aiModal) endConversation();
    });

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
        { text: 'Máy của tôi gặp sự cố', action: 'startDiagnose' },
        { text: 'Tìm hiểu dịch vụ', action: 'startServiceNav' }
    ]);
}

function endConversation() {
    document.getElementById('ai-modal')?.classList.remove('visible');
}

function handleOptionClick(text, action, data = {}) {
    if(!['changeComponent', 'selectNewComponent', 'redisplayBuild'].includes(action)) {
        appendMessage('user', text);
    }
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
            case 'saveBuild': 
                generateAndShareImage();
                break;
            case 'startDiagnose': promptForSymptom(); break;
            case 'setSymptom': processDiagnosis(data.symptom); break;
            case 'addServicesToCart': addRecommendedServicesToCart(); break;
            case 'startServiceNav': promptForServiceCategory(); break;
            case 'setServiceCategory': displaySubServices(data.categoryId); break;
            case 'restart': startConversation(); break;
        }
    }, 500);
}

// --- TIỆN ÍCH HIỂN THỊ ---

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
        if (option.data) {
            button.dataset.data = JSON.stringify(option.data);
        }
        if (option.imageUrl) {
            button.dataset.imageUrl = option.imageUrl;
        }
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

// (Các hàm logic xây dựng PC từ đây đến redisplayCurrentBuild được giữ nguyên)
function promptForServiceCategory(){appendMessage('ai',"Rất sẵn lòng! Bạn đang quan tâm đến lĩnh vực dịch vụ nào sau đây?");const e=allServicesData.filter(e=>"sua-chua-pc"!==e.id&&"xay-dung-pc"!==e.id).map(e=>({text:e.name,action:"setServiceCategory",data:{categoryId:e.id}}));showOptions(e)}function displaySubServices(e){const t=allServicesData.find(t=>t.id===e);if(!t||!t.subServices)return void appendMessage('ai',"Rất tiếc, tôi không tìm thấy thông tin cho dịch vụ này.");appendMessage('ai',`Trong lĩnh vực "${t.name}", chúng tôi cung cấp các gói sau:`),recommendedServices=t.subServices,displayServiceRecommendations(recommendedServices,!1),showOptions([{text:"Thêm tất cả vào Yêu Cầu",action:"addServicesToCart"},{text:"Tìm hiểu lĩnh vực khác",action:"startServiceNav"},{text:"Bắt đầu lại",action:"restart"}])}function promptForSymptom(){appendMessage('ai',"Tôi hiểu rồi. Xin hãy mô tả rõ hơn về triệu chứng mà máy tính của bạn đang gặp phải:"),showOptions([{text:"Máy chạy rất chậm, giật lag",action:"setSymptom",data:{symptom:"slow"}},{text:"Không lên nguồn / không lên hình",action:"setSymptom",data:{symptom:"no_power"}},{text:"Lỗi màn hình xanh (BSOD)",action:"setSymptom",data:{symptom:"bsod"}},{text:"Nhiễm virus, hiện nhiều quảng cáo lạ",action:"setSymptom",data:{symptom:"virus"}},{text:"Vấn đề khác",action:"setSymptom",data:{symptom:"other"}}])}function processDiagnosis(e){appendMessage('ai',"Dựa trên mô tả của bạn, tôi đang phân tích các giải pháp phù hợp...");let t="",a=[];switch(e){case"slow":t="Máy chạy chậm thường do nhiều nguyên nhân. Giải pháp tốt nhất là bảo trì toàn diện và cân nhắc nâng cấp ổ cứng SSD.",a=["scpc01","scpc02"];break;case"no_power":t="Lỗi không lên nguồn/hình là một sự cố nghiêm trọng. Cần phải kiểm tra phần cứng chuyên sâu.",a=["scpc02"];break;case"bsod":t="Lỗi màn hình xanh thường liên quan đến lỗi phần mềm, driver hoặc RAM. Cần kiểm tra và cài đặt lại hệ điều hành.",a=["scpc03"];break;case"virus":t="Nhiễm virus và phần mềm quảng cáo có thể gây mất dữ liệu. Cần phải quét và diệt virus bằng công cụ chuyên dụng.",a=["anm02","scpc03"];break;case"other":t="Với các vấn đề phức tạp, cách tốt nhất là mang máy đến để được kiểm tra trực tiếp.",a=[]}const s=allServicesData.flatMap(e=>e.subServices);recommendedServices=a.map(e=>s.find(t=>t.subId===e)).filter(Boolean),setTimeout(()=>{appendMessage('ai',t),recommendedServices.length>0?(displayServiceRecommendations(recommendedServices),showOptions([{text:"Thêm dịch vụ vào Yêu Cầu",action:"addServicesToCart"},{text:"Bắt đầu lại",action:"restart"}])):(appendMessage('ai',"Bạn có thể liên hệ trực tiếp qua SĐT hoặc Zalo để được hỗ trợ nhanh nhất nhé!"),showOptions([{text:"Bắt đầu lại",action:"restart"}]))},1e3)}
function displayServiceRecommendations(e,t=!0){const a=e.map(e=>`<div class="build-item-row"><img src="${e.images[0]||"https://placehold.co/100x100/0a0a1a/00ffff?text=Dich+Vu"}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span></div>`).join(""),s=t?`<div class="ai-result-header"><h3>Dịch Vụ Đề Xuất</h3></div>`:"",o=`<div class="ai-result-card">${s}<div class="ai-result-body">${a}</div></div>`;appendMessage('ai',"Đây là các dịch vụ phù hợp:",o)}function addRecommendedServicesToCart(){appendMessage('ai',"Đã hiểu, tôi đang thêm các dịch vụ vào giỏ hàng của bạn..."),"function"==typeof addServicesToCartFromAI&&recommendedServices.length>0?(addServicesToCartFromAI(recommendedServices),setTimeout(()=>{appendMessage('ai',"Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu."),showOptions([{text:"Bắt đầu lại",action:"restart"}])},1e3)):(appendMessage('ai',"Không có dịch vụ nào để thêm hoặc đã có lỗi xảy ra."),showOptions([{text:"Bắt đầu lại",action:"restart"}]))}
function promptForBudget(){appendMessage('ai',"Tuyệt vời! Trước hết, bạn dự định đầu tư khoảng bao nhiêu cho bộ máy mới này?"),showOptions([{text:"Học sinh (< 8 triệu)",action:"setBudget",data:{key:"student-lt-8m",min:0,max:8e6}},{text:"Cơ bản (8 - 15 triệu)",action:"setBudget",data:{key:"basic-8-15m",min:8e6,max:15e6}},{text:"Tầm trung (15 - 25 triệu)",action:"setBudget",data:{key:"mid-15-25m",min:15e6,max:25e6}},{text:"Cao cấp (25 - 40 triệu)",action:"setBudget",data:{key:"high-25-40m",min:25e6,max:4e7}},{text:"Hạng sang (> 40 triệu)",action:"setBudget",data:{key:"luxury-gt-40m",min:4e7,max:1/0}}])}function promptForPurpose(e){appendMessage('ai',"Đã hiểu. Bạn sẽ dùng máy chủ yếu cho mục đích gì?");let t=[{text:"Học tập & Giải trí nhẹ",action:"setPurpose",data:"study"},{text:"Chơi Game",action:"setPurpose",data:"gaming"},{text:"Làm Đồ họa / Video",action:"setPurpose",data:"workstation"}];"student-lt-8m"!==e&&"basic-8-15m"!==e||(t=t.filter(e=>"workstation"!==e.data)),showOptions(t)}
function processBuildConfig(){appendMessage('ai',"Ok, dựa trên lựa chọn của bạn, tôi đang phân tích các linh kiện phù hợp nhất. Vui lòng chờ trong giây lát..."),setTimeout(()=>{const e=buildPc(conversationState.budget,conversationState.purpose);e&&e.build?(currentBuild=e.build,displayBuildResult(e.build,e.totalPrice,e.wattage),showOptionsAfterBuild()):(appendMessage('ai',"Rất tiếc, tôi không tìm thấy cấu hình nào phù hợp với các tiêu chí này. Bạn vui lòng thử lại với lựa chọn khác nhé."),showOptions([{text:"Chọn lại ngân sách",action:"startBuildPc"}]))},1e3)}function findCheapestComponent(e,t=()=>!0){return allPcComponents.filter(a=>a.type===e&&t(a)).sort((e,t)=>e.price-t.price)[0]}function findComponents(e,t=()=>!0){return allPcComponents.filter(a=>a.type===e&&t(a)).sort((e,t)=>e.price-t.price)}
function buildPc(e,t){let a,s,o,n,i,l,r,c;switch(e.key){case"student-lt-8m":a=findCheapestComponent("cpu",e=>e.price<35e5&&e.name.includes("G")),n=null,s=findCheapestComponent("mainboard",e=>e.socket===a?.socket&&"DDR4"===e.ram_type),o=findCheapestComponent("ram",e=>"DDR4"===e.ram_type&&e.name.includes("8GB")),i=findCheapestComponent("storage",e=>e.price<1e6);let d=findCheapestComponent("case",e=>e.price<8e5);r=d||findCheapestComponent("case"),c=null;break;case"basic-8-15m":a=findCheapestComponent("cpu",e=>e.price>=25e5&&e.price<4e6),s=findCheapestComponent("mainboard",e=>e.socket===a?.socket&&"DDR4"===e.ram_type),o=findCheapestComponent("ram",e=>"DDR4"===e.ram_type&&e.name.includes("16GB")),n=findCheapestComponent("gpu",e=>e.price>=5e6&&e.price<7e6),i=findCheapestComponent("storage",e=>e.name.includes("500GB")),r=findCheapestComponent("case",e=>e.price<1e6),c=findCheapestComponent("cooler",e=>e.price<5e5);break;case"mid-15-25m":a=findCheapestComponent("cpu",e=>e.price>=4e6&&e.price<6e6),s=findCheapestComponent("mainboard",e=>e.socket===a?.socket),o=findCheapestComponent("ram",e=>e.ram_type===s?.ram_type&&e.name.includes("16GB")),n=findCheapestComponent("gpu",e=>e.price>=7e6&&e.price<13e6),i=findCheapestComponent("storage",e=>e.name.includes("1TB")),r=findCheapestComponent("case"),c=findCheapestComponent("cooler",e=>e.price<1e6);break;case"high-25-40m":a=findCheapestComponent("cpu",e=>e.price>=6e6&&e.price<12e6),s=findCheapestComponent("mainboard",e=>e.socket===a?.socket&&"DDR5"===e.ram_type),o=findCheapestComponent("ram",e=>"DDR5"===e.ram_type&&e.name.includes("32GB")),n=findCheapestComponent("gpu",e=>e.price>=13e6&&e.price<25e6),i=findCheapestComponent("storage",e=>e.name.includes("1TB")&&e.price>2e6),r=findCheapestComponent("case",e=>e.price>2e6),c=findCheapestComponent("cooler",e=>e.price>1e6);break;case"luxury-gt-40m":a=findCheapestComponent("cpu",e=>e.price>12e6),s=findCheapestComponent("mainboard",e=>e.socket===a?.socket&&"DDR5"===e.ram_type),o=findCheapestComponent("ram",e=>"DDR5"===e.ram_type&&e.name.includes("32GB")),n=findCheapestComponent("gpu",e=>e.price>25e6),i=findCheapestComponent("storage",e=>e.name.includes("2TB")),r=findCheapestComponent("case",e=>e.price>3e6),c=findCheapestComponent("cooler",e=>e.price>2e6)}const u=[a,s,o,i,r];return a&&!a.name.includes("G")&&!n?null:u.some(e=>!e)?null:calculatePsuAndFinalize([a,s,o,n,i,l,r,c],e)}
function calculatePsuAndFinalize(e,t){let a=[...e];const s=a.filter(e=>e).reduce((e,t)=>e+(t.wattage||0),0),o=50*Math.ceil(1.4*s/50),n=findCheapestComponent("psu",e=>e.wattage>=o);if(!n)return null;const i=a.findIndex(e=>"psu"===e?.type);-1!==i?a[i]=n:a.push(n);const l=a.filter(Boolean),r=l.reduce((e,t)=>e+t.price,0);return t&&t.max&&r>t.max&&!("student-lt-8m"===t.key&&r<85e5)?null:{build:l,totalPrice:r,wattage:o}}function formatPrice(e){return isNaN(e)?e:new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(e)}
function displayBuildResult(e,t,a){const s={cpu:"Vi xử lý (CPU)",mainboard:"Bo mạch chủ",ram:"RAM",gpu:"Card đồ họa (VGA)",storage:"Ổ cứng",psu:"Nguồn (PSU)",case:"Vỏ case",cooler:"Tản nhiệt"},o=e.map(e=>`<div class="build-item-row"><img src="${e.image}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-type">${s[e.type]||e.type}</span><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span><button class="ai-option-btn change-btn" data-action="changeComponent" data-data='${JSON.stringify({type:e.type})}'>Thay đổi</button></div>`).join(""),n=`<div class="ai-result-card"><div class="ai-result-header"><h3>Cấu Hình Đề Xuất</h3><p>Dựa trên nhu cầu của bạn, đây là cấu hình tối ưu nhất (yêu cầu khoảng ${a}W).</p></div><div class="ai-result-body">${o}</div><div class="ai-result-footer"><span>TỔNG CỘNG:</span><span>${formatPrice(t)}</span></div></div>`;appendMessage('ai',"Tôi đã hoàn tất cấu hình cho bạn!",n)}
function addBuildToCart(){appendMessage('ai',"Tuyệt vời! Tôi đang thêm các linh kiện vào giỏ hàng..."),"function"==typeof addBuildToCartFromAI&&addBuildToCartFromAI(currentBuild),setTimeout(()=>{appendMessage('ai',"Đã thêm thành công! Bạn có thể nhấn vào biểu tượng giỏ hàng để xem lại và gửi yêu cầu."),showOptions([{text:"Bắt đầu lại",action:"restart"}])},1e3)}
function promptForComponentChange(e){const t={cpu:"Vi xử lý (CPU)",mainboard:"Bo mạch chủ",ram:"RAM",gpu:"Card đồ họa (VGA)",storage:"Ổ cứng",psu:"Nguồn (PSU)",case:"Vỏ case",cooler:"Tản nhiệt"},a=currentBuild.find(t=>t.type===e),s=currentBuild.find(e=>"cpu"===e.type),o=currentBuild.find(e=>"mainboard"===e.type);let n=()=>!0;"mainboard"===e?n=e=>e.socket===s?.socket:"cpu"===e?n=e=>e.socket===o?.socket:"ram"===e&&(n=e=>e.ram_type===o?.ram_type);const i=findComponents(e,n),l=i.map(e=>`<div class="build-item-row ${e.id===a.id?"current":""}"><img src="${e.image}" alt="${e.name}" class="build-item-image"><div class="build-item-info"><span class="build-item-name">${e.name}</span></div><span class="build-item-price">${formatPrice(e.price)}</span><button class="ai-option-btn select-btn" ${e.id===a.id?"disabled":""} data-action="selectNewComponent" data-data='${JSON.stringify({newComponent:e})}'>Chọn</button></div>`).join(""),r=`<div class="ai-result-card"><div class="ai-result-header"><h3>Chọn ${t[e]} thay thế</h3><p>Các lựa chọn dưới đây đều tương thích.</p></div><div class="ai-result-body">${l}</div></div>`;appendMessage('ai',`Đây là các lựa chọn cho ${t[e]}:`,r),showOptions([{text:"Quay lại",action:"redisplayBuild"}])}
function updateComponent(e){const t=currentBuild.findIndex(t=>t.type===e.type);if(-1!==t){currentBuild[t]=e;const a=currentBuild.find(e=>"cpu"===e.type),s=currentBuild.find(e=>"mainboard"===e.type);"cpu"===e.type&&e.socket!==s.socket&&(currentBuild[currentBuild.findIndex(e=>"mainboard"===e.type)]=findCheapestComponent("mainboard",t=>t.socket===e.socket)),"mainboard"===e.type&&(e.socket!==a.socket&&(currentBuild[currentBuild.findIndex(t=>"cpu"===t.type)]=findCheapestComponent("cpu",t=>t.socket===e.socket)),currentBuild[currentBuild.findIndex(e=>"ram"===e.type)].ram_type!==e.ram_type&&(currentBuild[currentBuild.findIndex(e=>"ram"===e.type)]=findCheapestComponent("ram",t=>t.ram_type===e.ram_type))),redisplayCurrentBuild()}}
function redisplayCurrentBuild() {
    const result = calculatePsuAndFinalize(currentBuild, null);
    if (result && result.build) {
        currentBuild = result.build;
        displayBuildResult(result.build, result.totalPrice, result.wattage);
        showOptionsAfterBuild();
    } else {
        appendMessage('ai', "Đã có lỗi xảy ra khi hiển thị lại cấu hình. Có thể do một số linh kiện không tương thích.");
    }
}

// --- NÂNG CẤP: LOGIC TẠO VÀ CHIA SẺ ẢNH ---

/**
 * Hàm tiện ích để chuyển đổi URL của hình ảnh thành chuỗi Base64.
 * Giải quyết vấn đề CORS 'Tainted Canvas'.
 * @param {string} url - URL của hình ảnh.
 * @returns {Promise<string>} - Chuỗi Base64 của hình ảnh.
 */
async function urlToBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Không thể chuyển đổi URL thành Base64: ${url}`, error);
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiMwZDBkMWYiIHN0cm9rZT0iIzAwZmZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNUlM MTQgOGwtNyA3Ij48L3BhdGg+PGNpcmNsZSBjeD0iNi41IiBjeT0iNi41IiByPSIyLjUiLz48cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIyIiByeT0iMiIgc3Ryb2tlPSIjMDBmZmZmIiBmaWxsPSJub25lIi8+PC9zdmc+";
    }
}

/**
 * Chức năng chính để tạo và hiển thị ảnh cấu hình.
 */
async function generateAndShareImage() {
    appendMessage('ai', "Đang chuẩn bị dữ liệu hình ảnh, quá trình này có thể mất vài giây...");
    showOptions([]);

    try {
        // 1. Tải trước và chuyển đổi tất cả hình ảnh sang Base64
        const logoBase64 = await urlToBase64('img/logo.jpg');
        
        const buildWithBase64 = await Promise.all(currentBuild.map(async (item) => {
            let imageUrl = item.image;
            if (imageUrl && imageUrl.includes("google.com/search?q=")) {
                try {
                    const urlParams = new URLSearchParams(new URL(imageUrl).search);
                    imageUrl = urlParams.get('q');
                } catch (e) {
                    console.warn("URL không hợp lệ:", item.image);
                    imageUrl = null;
                }
            }
            if (!imageUrl || imageUrl.trim() === "") {
                imageUrl = `https://placehold.co/100x100/1a1a2e/00ffff?text=${encodeURIComponent(item.type)}`;
            }
            
            const imageBase64 = await urlToBase64(imageUrl);
            return { ...item, imageBase64 };
        }));

        appendMessage('ai', "Đang 'vẽ' ảnh cấu hình của bạn...");

        // 2. Đổ dữ liệu Base64 vào template
        const templateContainer = document.getElementById('image-template-container');
        const logoEl = document.getElementById('template-logo');
        const componentListEl = document.getElementById('template-component-list');
        const totalPriceEl = document.getElementById('template-total-price');

        logoEl.src = logoBase64;
        
        componentListEl.innerHTML = buildWithBase64.map(item => `
            <div style="display: flex; align-items: center; padding: 10px 5px; border-bottom: 1px dashed #3a3a5a;">
                <img src="${item.imageBase64}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 15px;" />
                <div style="flex-grow: 1; padding-right: 15px;">
                  <div style="font-size: 0.8em; color: #999; text-transform: uppercase;">${item.type}</div>
                  <div style="color: #E0E0E0;">${item.name}</div>
                </div>
                <span style="font-weight: 700; color: white; font-family: 'Exo 2', sans-serif;">${formatPrice(item.price)}</span>
            </div>
        `).join('');

        const total = currentBuild.reduce((sum, item) => sum + item.price, 0);
        totalPriceEl.textContent = formatPrice(total);

        // 3. "Chụp ảnh" div template (giờ đã an toàn)
        const canvas = await html2canvas(templateContainer, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#0d0d1f'
        });
        
        // 4. Chuyển canvas thành file và hiển thị tùy chọn
        canvas.toBlob(async (blob) => {
            const imageUrl = URL.createObjectURL(blob);
            const imageHtml = `<img src="${imageUrl}" alt="Xem trước cấu hình" style="max-width: 100%; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color);">`;
            
            // Luôn hiển thị ảnh trong khung chat
            appendMessage('ai', "Ảnh cấu hình của bạn đã sẵn sàng!", imageHtml);

            // Chuẩn bị dữ liệu để chia sẻ (nếu có thể)
            const file = new File([blob], "cau-hinh-pc-minhdang.png", { type: "image/png" });
            const total = currentBuild.reduce((sum, item) => sum + item.price, 0);
            const shareData = {
                title: "Cấu hình PC từ Vi Tính Minh Đăng",
                text: `Cấu hình PC trị giá ${formatPrice(total)} được tư vấn bởi AI.`,
                files: [file],
            };

            // Tạo các nút lựa chọn cơ bản
            const finalOptions = [
                { text: 'Lưu ảnh về máy', action: 'downloadImage', imageUrl: imageUrl },
                { text: 'Thêm vào Yêu Cầu', action: 'addToCart' },
                { text: 'Làm lại từ đầu', action: 'restart' }
            ];

            // Nếu trình duyệt hỗ trợ chia sẻ, thêm nút chia sẻ
            if (navigator.share && navigator.canShare(shareData)) {
                const optionsContainer = document.getElementById('ai-options-container');
                showOptions(finalOptions); 
                
                const shareButton = document.createElement('button');
                shareButton.className = 'ai-option-btn';
                shareButton.textContent = 'Chia sẻ ngay';
                shareButton.onclick = async () => {
                    try {
                        await navigator.share(shareData);
                    } catch (err) {
                        console.log("Người dùng đã hủy chia sẻ.", err);
                    }
                };
                optionsContainer.insertBefore(shareButton, optionsContainer.firstChild);

            } else {
                 showOptions(finalOptions);
            }
        }, 'image/png');

    } catch (error) {
        console.error("Lỗi khi tạo ảnh:", error);
        appendMessage('ai', `Rất tiếc, có lỗi xảy ra khi tạo ảnh: ${error.message}`);
        showOptionsAfterBuild();
    }
}

/**
 * Hàm kích hoạt việc tải file về máy người dùng.
 * @param {string} url - URL của đối tượng (từ URL.createObjectURL).
 * @param {string} filename - Tên file mặc định khi tải về.
 */
function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

