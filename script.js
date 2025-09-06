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
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
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
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyIremqvgCwYcVxsf09X-LbR1JRHZipuUr3xq9z-ZrGzaeXqgjxogkd3QyqKx_fYmQv/exec';
    let servicesData = [], cart = JSON.parse(localStorage.getItem('minhdangCart')) || [];
    let currentServiceInModal = null;

    let slideshowInterval = null;
    let currentImageIndex = 0;
    let currentImages = [];

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
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');
    const modalSubservicesList = document.getElementById('modal-subservices-list');
    
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');
    const zoomBtn = document.getElementById('zoom-image-btn');
    // === BỔ SUNG: Thêm hằng số cho nút điều khiển lightbox ===
    const prevLightboxBtn = document.getElementById('prev-lightbox-btn');
    const nextLightboxBtn = document.getElementById('next-lightbox-btn');
    // === KẾT THÚC BỔ SUNG ===

    try {
        const response = await fetch(appsScriptUrl);
        if (!response.ok) throw new Error('Network error');
        servicesData = await response.json();
        renderServiceCards();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        serviceList.innerHTML = `<p class="text-center text-red-400 col-span-full">Không thể tải dữ liệu.</p>`;
    }

    function validateForm() {
        const phoneRegex = /^0\d{9}$/;
        const nameRegex = /^[a-zA-ZàáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳýỵỷỹĐ\s]+$/;
        const nameValue = customerNameInput.value.trim();
        const phoneValue = customerPhoneInput.value.trim();
        let isNameValid = true;
        if (!nameRegex.test(nameValue) && nameValue !== '') {
            nameError.textContent = 'Họ tên không hợp lệ.';
            nameError.classList.remove('is-hidden');
            customerNameInput.classList.add('invalid');
            isNameValid = false;
        } else {
            nameError.classList.add('is-hidden');
            customerNameInput.classList.remove('invalid');
        }
        let isPhoneValid = true;
        if (!phoneRegex.test(phoneValue) && phoneValue !== '') {
            phoneError.textContent = 'SĐT phải có 10 số, bắt đầu bằng 0.';
            phoneError.classList.remove('is-hidden');
            customerPhoneInput.classList.add('invalid');
            isPhoneValid = false;
        } else {
            phoneError.classList.add('is-hidden');
            customerPhoneInput.classList.remove('invalid');
        }
        const isCartNotEmpty = cart.length > 0;
        const bothFieldsFilledAndValid = isNameValid && isPhoneValid && nameValue !== '' && phoneValue !== '';
        submitOrderBtn.classList.toggle('is-hidden', !(isCartNotEmpty && bothFieldsFilledAndValid));
        return bothFieldsFilledAndValid;
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
        cartItemsContainer.innerHTML = cart.length === 0 ? '<p class="text-gray-400 text-center p-8">Giỏ hàng của bạn đang trống.</p>' : cart.map(item => {
            const service = servicesData.flatMap(s => s.subServices).find(sub => sub.subId === item.subId);
            const image = service && service.images && service.images.length > 0 ? service.images[0] : 'https://placehold.co/100x100/0a0a1a/00ffff?text=IMG';
            return `
                <div class="cart-item">
                    <img src="${image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
                    <div class="cart-item-info">
                        <p class="font-bold text-white text-sm">${item.name}</p>
                        <p class="font-tech text-primary text-xs">${isNaN(item.price) ? item.price : new Intl.NumberFormat('vi-VN').format(item.price) + ' VNĐ'}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" data-sub-id="${item.subId}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-sub-id="${item.subId}" data-change="1">+</button>
                    </div>
                </div>`;
        }).join('');
        updateCartTotal();
        updateCartIcon();
        formContainer.classList.toggle('is-hidden', cart.length === 0);
        validateForm();
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
    
    function stopSlideshow() {
        if (slideshowInterval) {
            clearInterval(slideshowInterval);
            slideshowInterval = null;
        }
    }

    function startSlideshow() {
        stopSlideshow();
        if (currentImages.length > 1) {
            slideshowInterval = setInterval(nextImage, 3000);
        }
    }
    
    function showImage(index) {
        if (!currentImages || currentImages.length === 0) return;
        currentImageIndex = (index + currentImages.length) % currentImages.length;
    
        const mainImg = document.getElementById('modal-main-img');
        mainImg.style.opacity = 0;
        setTimeout(() => {
            mainImg.src = currentImages[currentImageIndex];
            mainImg.style.opacity = 1;
        }, 400);
    
        document.querySelectorAll('.modal-thumbnail').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentImageIndex);
        });
    }

    function nextImage() {
        showImage(currentImageIndex + 1);
    }

    function prevImage() {
        showImage(currentImageIndex - 1);
    }

    function openLightbox() {
        if (currentImages.length > 0) {
            lightboxImg.src = currentImages[currentImageIndex];
            lightbox.classList.add('visible');
            stopSlideshow();

            // Bổ sung: Hiển thị/ẩn nút điều khiển lightbox
            const showButtons = currentImages.length > 1;
            prevLightboxBtn.classList.toggle('is-hidden', !showButtons);
            nextLightboxBtn.classList.toggle('is-hidden', !showButtons);
        }
    }
    
    function closeLightbox() {
        lightbox.classList.remove('visible');
        startSlideshow();
    }

    function updateModalGallery(subId) {
        stopSlideshow();
        if (!currentServiceInModal) return;
        const subService = currentServiceInModal.subServices.find(sub => sub.subId === subId);
        
        const prevBtn = document.getElementById('prev-image-btn');
        const nextBtn = document.getElementById('next-image-btn');

        if (!subService || !subService.images || subService.images.length === 0) {
            currentImages = [currentServiceInModal.image];
            document.getElementById('modal-thumbnail-container').innerHTML = '';
            prevBtn.classList.add('is-hidden');
            nextBtn.classList.add('is-hidden');
        } else {
            currentImages = subService.images;
            document.getElementById('modal-thumbnail-container').innerHTML = currentImages.map((img, index) =>
                `<img src="${img}" alt="${subService.name}" class="modal-thumbnail" data-full-src="${img}">`
            ).join('');
            const showButtons = currentImages.length > 1;
            prevBtn.classList.toggle('is-hidden', !showButtons);
            nextBtn.classList.toggle('is-hidden', !showButtons);
        }
        
        showImage(0);
        startSlideshow();
        
        document.querySelectorAll('.subservice-item').forEach(item => {
            item.classList.toggle('highlighted', item.dataset.subId === subId);
        });
    }

    function openModal(serviceId) {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return;
        currentServiceInModal = service;

        document.getElementById('modal-title').textContent = service.name;
        modalSubservicesList.innerHTML = service.subServices.map(sub => `
            <div class="subservice-item" data-sub-id="${sub.subId}">
                <div class="subservice-info">
                    <h4 class="font-bold text-white">${sub.name}</h4>
                    <p class="text-sm text-gray-400">${sub.details}</p>
                </div>
                <div class="subservice-action">
                    <span class="font-tech text-lg text-primary">${isNaN(sub.price) ? sub.price : new Intl.NumberFormat('vi-VN').format(sub.price) + ' VNĐ'}</span>
                    <button class="add-to-cart-btn" data-sub-id="${sub.subId}" data-service-name="${sub.name}" data-price="${sub.price}">Thêm +</button>
                </div>
            </div>`).join('');
        
        if (service.subServices.length > 0) {
            updateModalGallery(service.subServices[0].subId);
        }

        document.getElementById('modal-loader').style.display = 'none';
        document.getElementById('modal-data').classList.remove('hidden');
        modal.classList.add('visible');
    }

    function closeModal() {
        closeLightbox();
        stopSlideshow();
        modal.classList.remove('visible');
        currentServiceInModal = null;
        setTimeout(() => {
            document.getElementById('modal-data').classList.add('hidden');
            document.getElementById('modal-loader').style.display = 'block';
        }, 300);
    }

    function addToCart(subId, buttonElement) {
        if (!currentServiceInModal) return;
        const subService = currentServiceInModal.subServices.find(sub => sub.subId === subId);
        if (!subService) return;

        const existingItem = cart.find(item => item.subId === subId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ subId: subService.subId, name: subService.name, price: subService.price, quantity: 1 });
        }
        
        saveCartAndRender();
        const imageToFly = subService.images && subService.images.length > 0 ? subService.images[0] : currentServiceInModal.image;
        flyToCart(imageToFly, buttonElement);
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
        if (!validateForm()) {
            formMessage.textContent = 'Vui lòng kiểm tra lại thông tin.';
            formMessage.className = 'text-red-400 text-center mt-4';
            return;
        }

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
    
    modalSubservicesList.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart-btn');
        const item = e.target.closest('.subservice-item');

        if (btn) {
            addToCart(btn.dataset.subId, btn);
        } else if (item) {
            updateModalGallery(item.dataset.subId);
        }
    });

    document.getElementById('modal-thumbnail-container').addEventListener('click', e => {
        if (e.target.classList.contains('modal-thumbnail')) {
            const index = Array.from(e.target.parentNode.children).indexOf(e.target);
            showImage(index);
            startSlideshow();
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
    
    customerNameInput.addEventListener('input', validateForm);
    customerPhoneInput.addEventListener('input', validateForm);

    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');
    const imageContainer = document.getElementById('modal-image-container');

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
        startSlideshow();
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
        startSlideshow();
    });

    imageContainer.addEventListener('mouseenter', stopSlideshow);
    imageContainer.addEventListener('mouseleave', startSlideshow);
    
    zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox();
    });

    closeLightboxBtn.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // === BỔ SUNG: Gán sự kiện cho nút điều khiển lightbox ===
    prevLightboxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage(); // Hàm này đã cập nhật index và ảnh trong modal
        lightboxImg.src = currentImages[currentImageIndex]; // Chỉ cần cập nhật ảnh lightbox theo index mới
    });

    nextLightboxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
        lightboxImg.src = currentImages[currentImageIndex];
    });
    // === KẾT THÚC BỔ SUNG ===

    renderCart();
}

