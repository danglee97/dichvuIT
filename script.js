// ===================================================================
//  SCRIPT.JS - PHIÊN BẢN 6.0 (Tích hợp Bác Sĩ AI)
// ===================================================================

// --- KHỞI CHẠY KHI TÀI LIỆU SẴN SÀNG ---
document.addEventListener('DOMContentLoaded', initializeApp);

// --- BIẾN TOÀN CỤC ---
let servicesData = [];
let pcComponentsData = [];
let cart = JSON.parse(localStorage.getItem('minhdangCart')) || [];
const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyIremqvgCwYcVxsf09X-LbR1JRHZipuUr3xq9z-ZrGzaeXqgjxogkd3QyqKx_fYmQv/exec';

/**
 * Hàm khởi tạo chính, điều phối toàn bộ ứng dụng
 */
async function initializeApp() {
    const observer = initCoreEffects();
    initInteractiveModules();

    try {
        const [services, components] = await Promise.all([
            fetch(appsScriptUrl + '?action=getServices').then(res => res.json()),
            fetch(appsScriptUrl + '?action=getComponents').then(res => res.json())
        ]);

        if (services.error) throw new Error(`Lỗi tải dịch vụ: ${services.error}`);
        if (components.error) throw new Error(`Lỗi tải linh kiện: ${components.error}`);

        servicesData = services;
        pcComponentsData = components;
        
        renderServiceCards();
        renderProjectGallery();
        initFloatingImages();

        if (typeof initializeAIAssistant === 'function') {
            // NÂNG CẤP: Cung cấp cả dữ liệu dịch vụ cho AI
            initializeAIAssistant(pcComponentsData, servicesData);
        } else {
            console.error("Lỗi: Không tìm thấy hàm initializeAIAssistant từ ai_engine.js");
            disableAIButton("Trợ lý AI đang bảo trì");
        }
        
        document.getElementById('service-loader').style.display = 'none';

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi khởi tạo ứng dụng:", error);
        const serviceLoader = document.getElementById('service-loader');
        serviceLoader.innerHTML = `<p class="text-center text-red-400 col-span-full">Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.</p>`;
        disableAIButton("Trợ lý AI không sẵn sàng");
    }
}

function disableAIButton(message) {
    const aiBtn = document.getElementById('ai-assistant-btn');
    if (aiBtn) {
        aiBtn.textContent = message;
        aiBtn.disabled = true;
        aiBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// ===================================================================
//  MODULE 1: HIỆU ỨNG GIAO DIỆN CỐT LÕI (Không thay đổi)
// ===================================================================
function initCoreEffects() {
    const header = document.getElementById('header');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
        scrollToTopBtn?.classList.toggle('visible', window.scrollY > 300);
    });
    scrollToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
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
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    if (!window.matchMedia("(max-width: 768px)").matches) {
        document.querySelectorAll('[data-tilt-card]').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const { left, top, width, height } = card.getBoundingClientRect();
                const x = (e.clientX - left) / width - 0.5;
                const y = (e.clientY - top) / height - 0.5;
                card.style.transform = `perspective(1000px) rotateX(${y * -10}deg) rotateY(${x * 10}deg) scale(1.02)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            });
        });
    }
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');
    if (mobileMenuBtn && mobileMenu) {
        const toggleMenu = () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            document.body.classList.toggle('menu-open', isOpen);
            menuIconOpen.classList.toggle('hidden', isOpen);
            menuIconClose.classList.toggle('hidden', !isOpen);
        };
        mobileMenuBtn.addEventListener('click', toggleMenu);
        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', toggleMenu));
    }
    const container = document.getElementById('hero-canvas');
    if (container && window.THREE) {
        let scene, camera, renderer, particles, mouseX = 0, mouseY = 0;
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
        pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeom.velocities = velocities;
        particles = new THREE.Points(pGeom, new THREE.PointsMaterial({ color: 0x00ffff, size: 1.5, blending: THREE.AdditiveBlending, transparent: true }));
        scene.add(particles);
        function animate() {
            requestAnimationFrame(animate);
            const pArray = particles.geometry.attributes.position.array, vArray = particles.geometry.velocities;
            for (let i = 0; i < pCount; i++) {
                const i3 = i * 3;
                pArray[i3] += vArray[i].x; pArray[i3 + 1] += vArray[i].y; pArray[i3 + 2] += vArray[i].z;
                if (pArray[i3] < -200 || pArray[i3] > 200) vArray[i].x *= -1;
                if (pArray[i3 + 1] < -200 || pArray[i3 + 1] > 200) vArray[i].y *= -1;
                if (pArray[i3 + 2] < -200 || pArray[i3 + 2] > 200) vArray[i].z *= -1;
            }
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
    return observer;
}

// ===================================================================
//  MODULE 2: CÁC MODULE TƯƠNG TÁC (GIỎ HÀNG, MODAL, FORM)
// ===================================================================
function initInteractiveModules() {
    const serviceList = document.getElementById('service-list');
    const modal = document.getElementById('service-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cartIconContainer = document.getElementById('cart-icon-container');
    const cartPanel = document.getElementById('cart-panel-container');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const orderForm = document.getElementById('order-form');
    const contactForm = document.getElementById('contact-form');
    let modalSlideshowInterval, currentImageIndex = 0, currentSubServiceImages = [];
    const modalMainImg = document.getElementById('modal-main-img');
    const modalThumbnailContainer = document.getElementById('modal-thumbnail-container');
    const modalTitle = document.getElementById('modal-title');
    const modalSubservicesList = document.getElementById('modal-subservices-list');
    const modalLoader = document.getElementById('modal-loader');
    const modalData = document.getElementById('modal-data');
    const openModal = (serviceId) => {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return;
        modalLoader.style.display = 'block';
        modalData.classList.add('hidden');
        modal.classList.add('visible');
        modalTitle.textContent = service.name;
        modalSubservicesList.innerHTML = service.subServices.map(sub => `
            <div class="subservice-item" data-sub-id="${sub.subId}">
                <div class="subservice-info"><h4>${sub.name}</h4><p>${sub.details}</p></div>
                <div class="subservice-action"><span>${isNaN(sub.price) ? sub.price : new Intl.NumberFormat('vi-VN').format(sub.price) + ' VNĐ'}</span><button class="add-to-cart-btn" data-sub-id="${sub.subId}">Thêm +</button></div>
            </div>`).join('');
        if (service.subServices.length > 0) {
            updateModalContent(service.subServices[0]);
            modalSubservicesList.querySelector('.subservice-item').classList.add('highlighted');
        } else {
            updateModalContent({ images: [] });
        }
        modalLoader.style.display = 'none';
        modalData.classList.remove('hidden');
    };
    const updateModalContent = (subService) => {
        currentSubServiceImages = subService.images || [];
        currentImageIndex = 0;
        modalThumbnailContainer.innerHTML = currentSubServiceImages.map((img, i) => `<img src="${img}" class="modal-thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}">`).join('');
        updateModalGallery();
        startSlideshow();
    };
    const updateModalGallery = () => {
        if (currentSubServiceImages.length === 0) {
            modalMainImg.src = 'https://placehold.co/600x400/0a0a1a/00ffff?text=Minh+Dang+IT';
            return;
        };
        modalMainImg.src = currentSubServiceImages[currentImageIndex];
        modalThumbnailContainer.querySelectorAll('.modal-thumbnail').forEach((thumb, i) => thumb.classList.toggle('active', i === currentImageIndex));
    };
    const startSlideshow = () => {
        clearInterval(modalSlideshowInterval);
        if (currentSubServiceImages.length <= 1) return;
        modalSlideshowInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % currentSubServiceImages.length;
            updateModalGallery();
        }, 3000);
    };
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const showLightbox = (index) => {
        currentImageIndex = index;
        if (currentSubServiceImages.length > 0) {
            lightboxImg.src = currentSubServiceImages[currentImageIndex];
            lightbox.classList.add('visible');
        }
    };
    const navigateLightbox = (direction) => {
        currentImageIndex = (currentImageIndex + direction + currentSubServiceImages.length) % currentSubServiceImages.length;
        lightboxImg.src = currentSubServiceImages[currentImageIndex];
    };
    const toggleCartPanel = () => {
        cartPanel.classList.toggle('visible');
        cartOverlay.classList.toggle('opacity-0');
        cartOverlay.classList.toggle('pointer-events-none');
    };
    const handleQuantityChange = (subId, change) => {
        const item = cart.find(i => i.subId === subId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) cart = cart.filter(i => i.subId !== subId);
        }
        saveCartAndRender();
    };
    serviceList.addEventListener('click', e => {
        const card = e.target.closest('.service-card');
        if (card) openModal(card.dataset.serviceId);
    });
    closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    modalSubservicesList.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) return addToCart(btn.dataset.subId, btn);
        const subItem = e.target.closest('.subservice-item');
        if(subItem) {
             const subService = servicesData.flatMap(s => s.subServices).find(sub => sub.subId === subItem.dataset.subId);
             if (subService) {
                updateModalContent(subService);
                modalSubservicesList.querySelectorAll('.subservice-item').forEach(item => item.classList.remove('highlighted'));
                subItem.classList.add('highlighted');
             }
        }
    });
    document.getElementById('modal-zoom-btn')?.addEventListener('click', () => showLightbox(currentImageIndex));
    document.getElementById('lightbox-close')?.addEventListener('click', () => lightbox.classList.remove('visible'));
    document.getElementById('lightbox-prev')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => navigateLightbox(1));
    cartIconContainer.addEventListener('click', toggleCartPanel);
    closeCartBtn.addEventListener('click', toggleCartPanel);
    cartOverlay.addEventListener('click', toggleCartPanel);
    document.getElementById('cart-items-container').addEventListener('click', e => {
        const btn = e.target.closest('.quantity-btn');
        if (btn) handleQuantityChange(btn.dataset.subId, parseInt(btn.dataset.change));
    });
    orderForm.addEventListener('submit', handleFormSubmit);
    orderForm.addEventListener('input', validateOrderForm);
    contactForm.addEventListener('submit', handleFormSubmit);
    renderCart();
}

// ===================================================================
//  MODULE 3: CÁC HÀM RENDER & TIỆN ÍCH (Giữ nguyên)
// ===================================================================
function renderServiceCards() {
    const serviceList = document.getElementById('service-list');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    serviceList.innerHTML = servicesData.map(service => `
        <div class="service-card group fade-in" data-tilt-card data-service-id="${service.id}">
            <div class="relative overflow-hidden rounded-t-lg">
                <img src="${service.image}" alt="${service.name}" class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110">
            </div>
            <div class="p-6">
                <h3 class="font-tech text-xl font-bold text-white mb-2">${service.name}</h3>
                <p class="text-gray-400 text-sm mb-4 h-12 overflow-hidden">${service.description}</p>
                <button class="font-semibold text-primary text-sm hover:text-secondary transition-colors">Xem Chi Tiết &rarr;</button>
            </div>
        </div>`).join('');
    serviceList.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
function renderProjectGallery() {
    const projectGallery = document.getElementById('project-gallery');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    const allImages = servicesData.flatMap(s => s.subServices.flatMap(sub => sub.images));
    const shuffledImages = allImages.sort(() => 0.5 - Math.random());
    projectGallery.innerHTML = shuffledImages.slice(0, 9).map((imgUrl, index) => `
        <div class="project-item fade-in" style="transition-delay: ${index * 100}ms">
            <img src="${imgUrl}" alt="Ảnh dự án ${index + 1}" loading="lazy">
        </div>
    `).join('');
    projectGallery.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
function initFloatingImages() {
    const container = document.getElementById('floating-images-container');
    const allImages = servicesData.flatMap(s => s.subServices.flatMap(sub => sub.images));
    const uniqueImages = [...new Set(allImages)].filter(img => img);
    for (let i = 0; i < Math.min(uniqueImages.length, 7); i++) {
        const img = document.createElement('img');
        img.src = uniqueImages[i % uniqueImages.length];
        img.className = 'floating-image';
        img.style.width = `${Math.random() * (120 - 60) + 60}px`;
        img.style.top = `${Math.random() * 80 + 10}%`;
        img.style.left = `${Math.random() * 80 + 10}%`;
        img.style.animationDuration = `${Math.random() * 10 + 10}s`;
        img.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(img);
    }
}
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');
    const formContainer = document.getElementById('customer-form-container');
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-400 text-center p-8">Giỏ hàng của bạn đang trống.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.images && item.images.length > 0 ? item.images[0] : 'img/placeholder.png'}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                <div class="cart-item-info"><p class="font-bold">${item.name}</p><p class="text-primary text-xs">${isNaN(item.price) ? item.price : new Intl.NumberFormat('vi-VN').format(item.price) + ' VNĐ'}</p></div>
                <div class="cart-item-quantity"><button class="quantity-btn" data-sub-id="${item.subId}" data-change="-1">-</button><span>${item.quantity}</span><button class="quantity-btn" data-sub-id="${item.subId}" data-change="1">+</button></div>
            </div>`).join('');
    }
    const total = cart.reduce((sum, item) => sum + (isNaN(item.price) ? 0 : Number(item.price) * item.quantity), 0);
    cartTotalEl.textContent = new Intl.NumberFormat('vi-VN').format(total) + ' VNĐ';
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    document.getElementById('cart-icon-container').classList.toggle('is-hidden', totalItems === 0);
    document.body.classList.toggle('cart-is-visible', totalItems > 0);
    formContainer.classList.toggle('is-hidden', cart.length === 0);
    validateOrderForm();
}
function saveCartAndRender() {
    localStorage.setItem('minhdangCart', JSON.stringify(cart));
    renderCart();
}
function addToCart(subId, buttonElement) {
    const service = servicesData.flatMap(s => s.subServices).find(sub => sub.subId === subId);
    if (!service) return;
    const existingItem = cart.find(item => item.subId === subId);
    if (existingItem) existingItem.quantity++;
    else cart.push({ ...service, quantity: 1 });
    saveCartAndRender();
    const flyImgSrc = service.images && service.images.length > 0 ? service.images[0] : 'https://placehold.co/100x100/0a0a1a/00ffff?text=ITEM';
    flyToCart(flyImgSrc, buttonElement);
}

// --- HÀM MỚI: Thêm nhiều dịch vụ vào giỏ hàng từ AI ---
function addServicesToCartFromAI(servicesToAdd) {
    servicesToAdd.forEach(service => {
        const existingItem = cart.find(item => item.subId === service.subId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...service, quantity: 1 });
        }
    });
    saveCartAndRender();
    // Tự động mở giỏ hàng
    const cartPanel = document.getElementById('cart-panel-container');
    if (!cartPanel.classList.contains('visible')) {
        cartPanel.classList.add('visible');
        document.getElementById('cart-overlay').classList.remove('opacity-0', 'pointer-events-none');
    }
}

// --- HÀM MỚI: Thêm cấu hình PC vào giỏ hàng từ AI ---
function addBuildToCartFromAI(build) {
    build.forEach(component => {
        const itemInCart = {
            subId: component.id, name: component.name, price: component.price,
            images: [component.image], quantity: 1
        };
        const existingItem = cart.find(item => item.subId === itemInCart.subId);
        if (existingItem) existingItem.quantity++;
        else cart.push(itemInCart);
    });
    saveCartAndRender();
    const cartPanel = document.getElementById('cart-panel-container');
    if (!cartPanel.classList.contains('visible')) {
        cartPanel.classList.add('visible');
        document.getElementById('cart-overlay').classList.remove('opacity-0', 'pointer-events-none');
    }
}
function flyToCart(imgSrc, buttonElement) {
    const cartIcon = document.getElementById('cart-icon');
    const flyingImg = document.createElement('img');
    flyingImg.src = imgSrc;
    flyingImg.className = 'flying-img';
    document.body.appendChild(flyingImg);
    const startRect = buttonElement.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();
    flyingImg.style.left = `${startRect.left + startRect.width / 2}px`;
    flyingImg.style.top = `${startRect.top + startRect.height / 2}px`;
    requestAnimationFrame(() => {
        flyingImg.style.left = `${endRect.left + endRect.width / 2}px`;
        flyingImg.style.top = `${endRect.top + endRect.height / 2}px`;
        flyingImg.style.transform = 'scale(0.1)';
        flyingImg.style.opacity = '0';
    });
    flyingImg.addEventListener('transitionend', () => {
        flyingImg.remove();
        document.getElementById('cart-icon-container').classList.add('shake');
        setTimeout(() => document.getElementById('cart-icon-container').classList.remove('shake'), 400);
    });
}
function validateOrderForm() {
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    const submitBtn = document.getElementById('submit-order-btn');
    const isNameValid = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(nameInput.value.trim());
    const isPhoneValid = /^0\d{9}$/.test(phoneInput.value.trim());
    nameError.textContent = (nameInput.value && !isNameValid) ? 'Họ tên không hợp lệ.' : '';
    phoneError.textContent = (phoneInput.value && !isPhoneValid) ? 'SĐT phải là 10 số, bắt đầu từ 0.' : '';
    const isFormValid = nameInput.value.trim() && phoneInput.value.trim() && isNameValid && isPhoneValid;
    submitBtn.disabled = !isFormValid;
    submitBtn.classList.toggle('is-hidden', !isFormValid || cart.length === 0);
    return isFormValid;
}
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const isOrderForm = form.id === 'order-form';
    const btn = isOrderForm ? document.getElementById('submit-order-btn') : document.getElementById('submit-contact-btn');
    const msgEl = isOrderForm ? document.getElementById('form-message') : document.getElementById('contact-form-message');
    if (isOrderForm && !validateOrderForm()) return;
    btn.disabled = true;
    btn.textContent = 'ĐANG GỬI...';
    msgEl.textContent = '';
    let payload;
    if (isOrderForm) {
        payload = {
            customer: { name: form.customerName.value, phone: form.customerPhone.value, notes: form.customerNotes.value },
            cart: cart, total: document.getElementById('cart-total').textContent
        };
    } else {
        payload = {
            customer: { name: form.contactName.value, email: form.contactEmail.value, notes: form.contactMessage.value },
            cart: [], total: 'Tin nhắn từ Form Liên Hệ'
        };
    }
    try {
        await fetch(appsScriptUrl, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        msgEl.textContent = 'Gửi yêu cầu thành công!';
        msgEl.className = 'text-green-400 text-center mt-4';
        form.reset();
        if (isOrderForm) {
            cart = [];
            saveCartAndRender();
            setTimeout(() => document.getElementById('cart-panel-container').classList.remove('visible'), 2500);
        }
    } catch (error) {
        msgEl.textContent = 'Có lỗi xảy ra, vui lòng thử lại.';
        msgEl.className = 'text-red-400 text-center mt-4';
    } finally {
        btn.disabled = false;
        btn.textContent = isOrderForm ? 'Gửi Yêu Cầu' : 'Gửi Tin Nhắn';
    }
}

