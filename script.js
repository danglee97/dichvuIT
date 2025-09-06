// ===================================================================
//  SCRIPT.JS - PHIÊN BẢN TỔNG HỢP HOÀN CHỈNH
//  Tái cấu trúc và sửa lỗi để đảm bảo tính ổn định.
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    initCoreEffects();
    initServiceAndCart();
});

// ===================================================================
//  MODULE 1: CÁC HIỆU ỨNG GỐC VÀ GIAO DIỆN
// ===================================================================
function init3DTiltEffect() {
    document.querySelectorAll('[data-tilt-card]').forEach(card => {
        if (card.dataset.tiltInitialized) return;
        card.dataset.tiltInitialized = 'true';
        card.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = card.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;
            card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) scale(1.02)`;
            card.style.transition = 'transform 0.1s ease-out';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        });
    });
}

function initCoreEffects() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    const mainTitle = document.getElementById('main-title');
    const subTitle = document.getElementById('sub-title');
    if (mainTitle && subTitle) {
        const mainText = "VI TÍNH MINH ĐĂNG";
        const subText = "GIẢI PHÁP CÔNG NGHỆ TƯƠNG LAI";
        let i = 0, j = 0;
        mainTitle.textContent = ''; subTitle.textContent = '';
        function typeMain() {
            if (i < mainText.length) { mainTitle.textContent += mainText.charAt(i++); setTimeout(typeMain, 75); } 
            else { setTimeout(typeSub, 300); }
        }
        function typeSub() {
            if (j < subText.length) { subTitle.textContent += subText.charAt(j++); setTimeout(typeSub, 75); }
        }
        typeMain();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    init3DTiltEffect();

    const container = document.getElementById('hero-canvas');
    if (container && window.THREE) {
        let scene, camera, renderer, particles, lines, mouseX = 0, mouseY = 0;
        let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 150;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        const pCount = 200, positions = new Float32Array(pCount * 3), velocities = [];
        for (let i = 0; i < pCount; i++) {
            positions[i * 3] = (Math.random() * 2 - 1) * 200;
            positions[i * 3 + 1] = (Math.random() * 2 - 1) * 200;
            positions[i * 3 + 2] = (Math.random() * 2 - 1) * 200;
            velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2));
        }
        const pGeom = new THREE.BufferGeometry();
        pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        pGeom.velocities = velocities;
        particles = new THREE.Points(pGeom, new THREE.PointsMaterial({ color: 0x00ffff, size: 1.5, blending: THREE.AdditiveBlending, transparent: true }));
        scene.add(particles);
        const lGeom = new THREE.BufferGeometry();
        lGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pCount * pCount * 3), 3).setUsage(THREE.DynamicDrawUsage));
        lines = new THREE.LineSegments(lGeom, new THREE.LineBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.1 }));
        scene.add(lines);
        function animate() {
            requestAnimationFrame(animate);
            const pArray = particles.geometry.attributes.position.array, vArray = particles.geometry.velocities, lArray = lines.geometry.attributes.position.array;
            let lVtxIdx = 0;
            for (let i = 0; i < pCount; i++) {
                const i3 = i * 3;
                pArray[i3] += vArray[i].x; pArray[i3 + 1] += vArray[i].y; pArray[i3 + 2] += vArray[i].z;
                if (pArray[i3] < -200 || pArray[i3] > 200) vArray[i].x *= -1;
                if (pArray[i3 + 1] < -200 || pArray[i3 + 1] > 200) vArray[i].y *= -1;
                if (pArray[i3 + 2] < -200 || pArray[i3 + 2] > 200) vArray[i].z *= -1;
                for (let j = i + 1; j < pCount; j++) {
                    const j3 = j * 3;
                    const dist = Math.sqrt(Math.pow(pArray[i3] - pArray[j3], 2) + Math.pow(pArray[i3 + 1] - pArray[j3 + 1], 2) + Math.pow(pArray[i3 + 2] - pArray[j3 + 2], 2));
                    if (dist < 40) {
                        lArray[lVtxIdx++] = pArray[i3]; lArray[lVtxIdx++] = pArray[i3 + 1]; lArray[lVtxIdx++] = pArray[i3 + 2];
                        lArray[lVtxIdx++] = pArray[j3]; lArray[lVtxIdx++] = pArray[j3 + 1]; lArray[lVtxIdx++] = pArray[j3 + 2];
                    }
                }
            }
            lines.geometry.setDrawRange(0, lVtxIdx / 3);
            lines.geometry.attributes.position.needsUpdate = true;
            particles.geometry.attributes.position.needsUpdate = true;
            camera.position.x += (mouseX - camera.position.x) * 0.05;
            camera.position.y += (-mouseY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        }
        document.addEventListener('mousemove', (e) => { mouseX = (e.clientX - windowHalfX) / 4; mouseY = (e.clientY - windowHalfY) / 4; });
        window.addEventListener('resize', () => {
            windowHalfX = window.innerWidth / 2; windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        animate();
    }
}

// ===================================================================
//  MODULE 2: DỊCH VỤ, GIỎ HÀNG VÀ FORM
// ===================================================================
async function initServiceAndCart() {
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyIremqvgCwYcVxsf09X-LbR1JRHZipuUr3xq9z-ZrGzaeXqgjxogkd3QyqKx_fYmQv/exec'; // THAY URL APPS SCRIPT CỦA BẠN
    let servicesData = [], cart = JSON.parse(localStorage.getItem('minhdangCart')) || [];

    const serviceList = document.getElementById('service-list');
    const modal = document.getElementById('service-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cartIconContainer = document.getElementById('cart-icon-container');
    const cartPanel = document.getElementById('cart-panel-container');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');
    const orderForm = document.getElementById('order-form');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const formContainer = document.getElementById('customer-form-container');
    const formMessage = document.getElementById('form-message');
    // === BỔ SUNG: Lấy phần tử input ===
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');

    try {
        const response = await fetch(appsScriptUrl);
        if (!response.ok) throw new Error('Network error');
        servicesData = await response.json();
        renderServiceCards();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        serviceList.innerHTML = `<p class="text-center text-red-400 col-span-full">Không thể tải dữ liệu.</p>`;
    }

    // === BỔ SUNG: Hàm kiểm tra form và ẩn/hiện nút ===
    function checkFormAndToggleButton() {
        const isNameValid = customerNameInput.value.trim() !== '';
        const isPhoneValid = customerPhoneInput.value.trim() !== '';
        const isCartNotEmpty = cart.length > 0;
        
        // Chỉ hiển thị nút khi giỏ hàng có đồ VÀ cả 2 trường đã được điền
        if (isCartNotEmpty && isNameValid && isPhoneValid) {
            submitOrderBtn.classList.remove('is-hidden');
        } else {
            submitOrderBtn.classList.add('is-hidden');
        }
    }

    function renderServiceCards() {
        serviceList.innerHTML = servicesData.map(service => `
            <div class="service-card group" data-tilt-card data-service-id="${service.id}">
                <div class="relative overflow-hidden rounded-t-lg">
                    <img src="${service.image}" alt="${service.name}" class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110">
                </div>
                <div class="p-6">
                    <h3 class="font-tech text-xl font-bold text-white mb-2">${service.name}</h3>
                    <p class="text-gray-400 text-sm mb-4 h-10 overflow-hidden">${service.description}</p>
                    <button class="font-semibold text-primary text-sm hover:text-secondary transition-colors">Xem Chi Tiết &rarr;</button>
                </div>
            </div>`).join('');
        init3DTiltEffect();
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-400 text-center p-8">Giỏ hàng của bạn đang trống.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
                    <div class="cart-item-info">
                        <p class="font-bold text-white text-sm">${item.name}</p>
                        <p class="font-tech text-primary text-xs">${isNaN(item.price) ? item.price : new Intl.NumberFormat('vi-VN').format(item.price) + ' VNĐ'}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-sub-id="${item.subId}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-sub-id="${item.subId}" data-change="1">+</button>
                    </div>
                </div>`).join('');
        }
        updateCartTotal();
        updateCartIcon();
        formContainer.classList.toggle('is-hidden', cart.length === 0);
        // === THAY ĐỔI: Luôn gọi hàm kiểm tra để quyết định hiển thị nút ===
        checkFormAndToggleButton();
    }

    function updateCartTotal() {
        const total = cart.reduce((sum, item) => sum + (isNaN(item.price) ? 0 : Number(item.price) * item.quantity), 0);
        cartTotalEl.textContent = new Intl.NumberFormat('vi-VN').format(total) + ' VNĐ';
    }

    function updateCartIcon() {
        const cartCount = document.getElementById('cart-count');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartIconContainer.classList.toggle('is-hidden', totalItems === 0);
    }

    function openModal(serviceId) {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return;
        document.getElementById('modal-main-img').src = service.image;
        document.getElementById('modal-thumbnail-container').innerHTML = service.subServices.map((sub, index) =>
            sub.image ? `<img src="${sub.image}" alt="${sub.name}" class="modal-thumbnail ${index === 0 ? 'active' : ''}" data-full-src="${sub.image}">` : ''
        ).join('');
        document.getElementById('modal-title').textContent = service.name;
        document.getElementById('modal-subservices-list').innerHTML = service.subServices.map(sub => `
            <div class="subservice-item">
                <div class="subservice-info">
                    <h4 class="font-bold text-white">${sub.name}</h4>
                    <p class="text-sm text-gray-400">${sub.details}</p>
                </div>
                <div class="subservice-action">
                    <span class="font-tech text-lg text-primary">${isNaN(sub.price) ? sub.price : new Intl.NumberFormat('vi-VN').format(sub.price) + ' VNĐ'}</span>
                    <button class="add-to-cart-btn" data-sub-id="${sub.subId}">Thêm +</button>
                </div>
            </div>`).join('');
        document.getElementById('modal-loader').style.display = 'none';
        document.getElementById('modal-data').classList.remove('hidden');
        modal.classList.add('visible');
    }

    function closeModal() {
        modal.classList.remove('visible');
        setTimeout(() => {
            document.getElementById('modal-data').classList.add('hidden');
            document.getElementById('modal-loader').style.display = 'block';
        }, 300);
    }

    function addToCart(subId, buttonElement) {
        const service = servicesData.flatMap(s => s.subServices).find(sub => sub.subId === subId);
        if (!service) return;
        const existingItem = cart.find(item => item.subId === subId);
        if (existingItem) existingItem.quantity++;
        else cart.push({ ...service, quantity: 1 });
        saveCartAndRender();
        if (service.image) flyToCart(service.image, buttonElement);
    }

    function handleQuantityChange(subId, change) {
        const item = cart.find(i => i.subId === subId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) cart = cart.filter(i => i.subId !== subId);
        }
        saveCartAndRender();
    }

    function saveCartAndRender() {
        localStorage.setItem('minhdangCart', JSON.stringify(cart));
        renderCart();
    }

    function toggleCartPanel() {
        cartPanel.classList.toggle('visible');
        cartOverlay.classList.toggle('opacity-0');
        cartOverlay.classList.toggle('pointer-events-none');
    }

    async function handleOrderSubmit(event) {
        event.preventDefault();
        submitOrderBtn.disabled = true; submitOrderBtn.textContent = 'ĐANG GỬI...'; formMessage.textContent = '';
        try {
            await fetch(appsScriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { name: orderForm.customerName.value, phone: orderForm.customerPhone.value, notes: orderForm.customerNotes.value },
                    cart: cart, total: cartTotalEl.textContent
                })
            });
            formMessage.textContent = 'Yêu cầu đã gửi thành công!'; formMessage.className = 'text-green-400 text-center mt-4';
            cart = []; saveCartAndRender(); orderForm.reset();
            setTimeout(toggleCartPanel, 2000);
        } catch (error) {
            formMessage.textContent = 'Có lỗi xảy ra, vui lòng thử lại.'; formMessage.className = 'text-red-400 text-center mt-4';
        } finally {
            submitOrderBtn.disabled = false; submitOrderBtn.textContent = 'Gửi Yêu Cầu';
        }
    }

    function flyToCart(imgSrc, buttonElement) {
        const cartIcon = document.getElementById('cart-icon');
        const flyingImg = document.createElement('img');
        flyingImg.src = imgSrc; flyingImg.className = 'flying-img';
        document.body.appendChild(flyingImg);
        const startRect = buttonElement.getBoundingClientRect();
        const endRect = cartIcon.getBoundingClientRect();
        flyingImg.style.left = `${startRect.left + startRect.width / 2}px`;
        flyingImg.style.top = `${startRect.top + startRect.height / 2}px`;
        requestAnimationFrame(() => {
            flyingImg.style.left = `${endRect.left + endRect.width / 2}px`;
            flyingImg.style.top = `${endRect.top + endRect.height / 2}px`;
            flyingImg.style.transform = 'scale(0.1)'; flyingImg.style.opacity = '0';
        });
        flyingImg.addEventListener('transitionend', () => {
            flyingImg.remove();
            cartIconContainer.classList.add('shake');
            setTimeout(() => cartIconContainer.classList.remove('shake'), 400);
        });
    }

    serviceList.addEventListener('click', e => {
        const card = e.target.closest('.service-card');
        if (card) openModal(card.dataset.serviceId);
    });
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('modal-subservices-list').addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) addToCart(btn.dataset.subId, btn);
    });
    document.getElementById('modal-thumbnail-container').addEventListener('click', e => {
        if (e.target.classList.contains('modal-thumbnail')) {
            document.getElementById('modal-main-img').src = e.target.dataset.fullSrc;
            document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
    cartIconContainer.addEventListener('click', toggleCartPanel);
    closeCartBtn.addEventListener('click', toggleCartPanel);
    cartOverlay.addEventListener('click', toggleCartPanel);
    cartItemsContainer.addEventListener('click', e => {
        const btn = e.target.closest('.quantity-btn');
        if (btn) handleQuantityChange(btn.dataset.subId, parseInt(btn.dataset.change));
    });
    orderForm.addEventListener('submit', handleOrderSubmit);
    
    // === BỔ SUNG: Gán sự kiện 'input' để kiểm tra form mỗi khi người dùng gõ chữ ===
    customerNameInput.addEventListener('input', checkFormAndToggleButton);
    customerPhoneInput.addEventListener('input', checkFormAndToggleButton);

    renderCart();
}
