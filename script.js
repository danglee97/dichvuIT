// ===================================================================
//  SCRIPT.JS - PHIÊN BẢN TỔNG HỢP HOÀN CHỈNH
//  Tái cấu trúc và sửa lỗi để đảm bảo tính ổn định.
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Sửa đổi: Lấy observer trả về và truyền đi để theo dõi các phần tử động
    const observer = initCoreEffects();
    initServiceAndCart(observer);
});

// ===================================================================
//  MODULE 1: CÁC HIỆU ỨNG GỐC VÀ GIAO DIỆN
// ===================================================================
function init3DTiltEffect() {
    // Tối ưu: Tắt hiệu ứng tilt trên mobile để tránh xung đột và cải thiện hiệu năng
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

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
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
        if (scrollToTopBtn) {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        }
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

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

    // Sửa đổi: Tạo và trả về observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    // Quan sát các phần tử fade-in tĩnh có sẵn trong HTML
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    
    init3DTiltEffect();
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            document.body.classList.toggle('menu-open', isOpen);
            menuIconOpen.classList.toggle('hidden', isOpen);
            menuIconClose.classList.toggle('hidden', !isOpen);
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                document.body.classList.remove('menu-open');
                menuIconOpen.classList.remove('hidden');
                menuIconClose.classList.add('hidden');
            });
        });
    }

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

    return observer; // Trả về observer để sử dụng cho các phần tử động
}

// ===================================================================
//  MODULE 2: DỊCH VỤ, GIỎ HÀNG VÀ FORM
// ===================================================================
// Sửa đổi: Nhận observer làm tham số
async function initServiceAndCart(observer) {
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyIremqvgCwYcVxsf09X-LbR1JRHZipuUr3xq9z-ZrGzaeXqgjxogkd3QyqKx_fYmQv/exec';
    let servicesData = [], cart = JSON.parse(localStorage.getItem('minhdangCart')) || [];

    // Lấy các element trên trang
    const serviceList = document.getElementById('service-list');
    const serviceLoader = document.getElementById('service-loader');
    const projectGallery = document.getElementById('project-gallery');
    
    // Modal elements
    const modal = document.getElementById('service-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalMainImg = document.getElementById('modal-main-img');
    const modalThumbnailContainer = document.getElementById('modal-thumbnail-container');
    const modalTitle = document.getElementById('modal-title');
    const modalSubservicesList = document.getElementById('modal-subservices-list');
    const modalLoader = document.getElementById('modal-loader');
    const modalData = document.getElementById('modal-data');
    const modalPrevBtn = document.getElementById('modal-prev-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    const modalZoomBtn = document.getElementById('modal-zoom-btn');
    
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    // Cart elements
    const cartIconContainer = document.getElementById('cart-icon-container');
    const cartPanel = document.getElementById('cart-panel-container');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');

    // Order Form elements
    const orderForm = document.getElementById('order-form');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const formContainer = document.getElementById('customer-form-container');
    const formMessage = document.getElementById('form-message');
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    
    // Contact Form elements
    const contactForm = document.getElementById('contact-form');
    const submitContactBtn = document.getElementById('submit-contact-btn');
    const contactFormMessage = document.getElementById('contact-form-message');
    
    let modalSlideshowInterval;
    let currentImageIndex = 0;
    let currentSubServiceImages = [];
    
    try {
        const response = await fetch(appsScriptUrl);
        if (!response.ok) throw new Error('Network error');
        servicesData = await response.json();
        
        serviceLoader.style.display = 'none';
        renderServiceCards();
        renderProjectGallery();
        
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        serviceLoader.innerHTML = `<p class="text-center text-red-400 col-span-full">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>`;
    }

    function renderServiceCards() {
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
        
        // Sửa lỗi: Sau khi render, yêu cầu observer quan sát các thẻ mới
        serviceList.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        init3DTiltEffect();
    }

    function renderProjectGallery() {
        if (!projectGallery) return;
        const allImages = servicesData.flatMap(s => s.subServices.flatMap(sub => sub.images));
        const shuffledImages = allImages.sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, 9);

        projectGallery.innerHTML = selectedImages.map((imgUrl, index) => {
            const sizeClasses = ['project-item-wide', 'project-item-tall', 'project-item-large', ''];
            const randomSize = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];
            return `
                <div class="project-item fade-in ${randomSize}" style="transition-delay: ${index * 100}ms">
                    <img src="${imgUrl}" alt="Ảnh dự án ${index + 1}" loading="lazy">
                </div>
            `;
        }).join('');
        
        // Sửa lỗi: Quan sát các ảnh mới trong gallery
        projectGallery.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-400 text-center p-8">Giỏ hàng của bạn đang trống.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.images[0] || 'img/placeholder.png'}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
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
        document.body.classList.toggle('cart-is-visible', totalItems > 0);
    }
    
    function startSlideshow() {
        clearInterval(modalSlideshowInterval);
        if (currentSubServiceImages.length <= 1) return; // Không chạy slideshow nếu chỉ có 1 ảnh
        modalSlideshowInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % currentSubServiceImages.length;
            updateModalGallery(true);
        }, 3000);
    }

    function updateModalGallery(isAuto = false) {
        if (currentSubServiceImages.length === 0) return;
        
        modalMainImg.style.opacity = '0';

        setTimeout(() => {
            modalMainImg.src = currentSubServiceImages[currentImageIndex];
             modalMainImg.style.opacity = '1';
        }, 300);

        modalThumbnailContainer.querySelectorAll('.modal-thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentImageIndex);
        });
        
        const hasMultipleImages = currentSubServiceImages.length > 1;
        modalPrevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        modalNextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
    }
    
    function updateModalContent(subService) {
        currentSubServiceImages = subService.images || [];
        currentImageIndex = 0;
        
        if (currentSubServiceImages.length > 0) {
            updateModalGallery();
            startSlideshow();
        } else {
            modalMainImg.src = 'img/placeholder.png';
            clearInterval(modalSlideshowInterval);
            updateModalGallery(); // Cập nhật để ẩn nút
        }
        
        modalThumbnailContainer.innerHTML = currentSubServiceImages.map((img, index) =>
            `<img src="${img}" alt="Thumbnail ${index+1}" class="modal-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`
        ).join('');
    }

    function openModal(serviceId) {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return;
        
        modalTitle.textContent = service.name;
        modalSubservicesList.innerHTML = service.subServices.map((sub, index) => `
            <div class="subservice-item" data-sub-id="${sub.subId}">
                <div class="subservice-info">
                    <h4 class="font-bold text-white">${sub.name}</h4>
                    <p class="text-sm text-gray-400">${sub.details}</p>
                </div>
                <div class="subservice-action">
                    <span class="font-tech text-lg text-primary">${isNaN(sub.price) ? sub.price : new Intl.NumberFormat('vi-VN').format(sub.price) + ' VNĐ'}</span>
                    <button class="add-to-cart-btn" data-sub-id="${sub.subId}">Thêm +</button>
                </div>
            </div>`).join('');
        
        if (service.subServices.length > 0) {
            updateModalContent(service.subServices[0]);
            modalSubservicesList.querySelector('.subservice-item').classList.add('highlighted');
        }
        
        modalLoader.style.display = 'none';
        modalData.classList.remove('hidden');
        modal.classList.add('visible');
    }

    function closeModal() {
        modal.classList.remove('visible');
        clearInterval(modalSlideshowInterval);
        setTimeout(() => {
            modalData.classList.add('hidden');
            modalLoader.style.display = 'block';
        }, 300);
    }
    
    function showLightbox(imageIndex) {
        currentImageIndex = imageIndex;
        lightboxImg.src = currentSubServiceImages[currentImageIndex];
        lightbox.classList.add('visible');
        
        const hasMultipleImages = currentSubServiceImages.length > 1;
        lightboxPrev.style.display = hasMultipleImages ? 'flex' : 'none';
        lightboxNext.style.display = hasMultipleImages ? 'flex' : 'none';
    }

    function closeLightbox() {
        lightbox.classList.remove('visible');
    }
    
    function navigateLightbox(direction) {
        const newIndex = currentImageIndex + direction;
        const totalImages = currentSubServiceImages.length;
        currentImageIndex = (newIndex + totalImages) % totalImages;
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = currentSubServiceImages[currentImageIndex];
            lightboxImg.style.opacity = '1';
        }, 150);
    }


    function addToCart(subId, buttonElement) {
        let service;
        for (const s of servicesData) {
            const foundSub = s.subServices.find(sub => sub.subId === subId);
            if (foundSub) {
                service = foundSub;
                break;
            }
        }
        
        if (!service) return;
        const existingItem = cart.find(item => item.subId === subId);
        if (existingItem) existingItem.quantity++;
        else cart.push({ ...service, quantity: 1 });
        saveCartAndRender();
        if (service.images && service.images.length > 0) {
            flyToCart(service.images[0], buttonElement);
        }
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
    
    function validateForm() {
        const nameValue = customerNameInput.value.trim();
        const phoneValue = customerPhoneInput.value.trim();
        
        const isNameValid = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(nameValue);
        const isPhoneValid = /^0\d{9}$/.test(phoneValue);

        if (nameValue && !isNameValid) {
            nameError.textContent = 'Họ tên không hợp lệ.';
            customerNameInput.classList.add('invalid');
        } else {
            nameError.textContent = '';
            customerNameInput.classList.remove('invalid');
        }

        if (phoneValue && !isPhoneValid) {
            phoneError.textContent = 'SĐT phải là 10 số, bắt đầu từ 0.';
            customerPhoneInput.classList.add('invalid');
        } else {
            phoneError.textContent = '';
            customerPhoneInput.classList.remove('invalid');
        }
        
        const isFormValid = nameValue !== '' && phoneValue !== '' && isNameValid && isPhoneValid;
        submitOrderBtn.disabled = !isFormValid;
        submitOrderBtn.classList.toggle('is-hidden', !isFormValid || cart.length === 0);
        
        return isFormValid;
    }


    async function handleOrderSubmit(event) {
        event.preventDefault();
        if (!validateForm()) return;
        
        submitOrderBtn.disabled = true; submitOrderBtn.textContent = 'ĐANG GỬI...'; formMessage.textContent = '';
        try {
            await fetch(appsScriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: { 
                        name: customerNameInput.value, 
                        phone: customerPhoneInput.value, 
                        notes: orderForm.customerNotes.value 
                    },
                    cart: cart, 
                    total: cartTotalEl.textContent
                })
            });
            formMessage.textContent = 'Yêu cầu đã gửi thành công!'; formMessage.className = 'text-green-400 text-center mt-4';
            cart = []; saveCartAndRender(); orderForm.reset();
            setTimeout(() => {
                toggleCartPanel();
                formMessage.textContent = '';
            }, 2500);
        } catch (error) {
            formMessage.textContent = 'Có lỗi xảy ra, vui lòng thử lại.'; formMessage.className = 'text-red-400 text-center mt-4';
        } finally {
            submitOrderBtn.disabled = false; submitOrderBtn.textContent = 'Gửi Yêu Cầu';
        }
    }
    
    async function handleContactFormSubmit(event) {
        event.preventDefault();
        submitContactBtn.disabled = true;
        submitContactBtn.textContent = 'ĐANG GỬI...';
        contactFormMessage.textContent = '';
        
        const formData = {
            customer: {
                name: contactForm.contactName.value,
                email: contactForm.contactEmail.value,
                notes: contactForm.contactMessage.value
            },
            cart: [],
            total: 'Tin nhắn từ Form Liên Hệ'
        };

        try {
            await fetch(appsScriptUrl, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            contactFormMessage.textContent = 'Đã gửi tin nhắn thành công!';
            contactFormMessage.className = 'text-green-400 text-center mt-4';
            contactForm.reset();
        } catch (error) {
            contactFormMessage.textContent = 'Có lỗi xảy ra, vui lòng thử lại.';
            contactFormMessage.className = 'text-red-400 text-center mt-4';
        } finally {
            submitContactBtn.disabled = false;
            submitContactBtn.textContent = 'Gửi Tin Nhắn';
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

    // Gán các sự kiện
    serviceList.addEventListener('click', e => {
        const card = e.target.closest('.service-card');
        if (card) openModal(card.dataset.serviceId);
    });
    
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    
    modalPrevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentSubServiceImages.length) % currentSubServiceImages.length;
        updateModalGallery();
        startSlideshow();
    });
    modalNextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentSubServiceImages.length;
        updateModalGallery();
        startSlideshow();
    });
     modalThumbnailContainer.addEventListener('click', e => {
        const thumb = e.target.closest('.modal-thumbnail');
        if (thumb) {
            currentImageIndex = parseInt(thumb.dataset.index);
            updateModalGallery();
            startSlideshow();
        }
    });
    document.getElementById('modal-image-container').addEventListener('mouseenter', () => clearInterval(modalSlideshowInterval));
    document.getElementById('modal-image-container').addEventListener('mouseleave', () => startSlideshow());
    
    modalZoomBtn.addEventListener('click', () => showLightbox(currentImageIndex));
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext.addEventListener('click', () => navigateLightbox(1));
    
    modalSubservicesList.addEventListener('click', e => {
        const subItem = e.target.closest('.subservice-item');
        if (!subItem) return;
        
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            addToCart(btn.dataset.subId, btn);
            return;
        }

        const subId = subItem.dataset.subId;
        let subService;
        for (const s of servicesData) {
            const found = s.subServices.find(sub => sub.subId === subId);
            if (found) { subService = found; break; }
        }

        if (subService) {
            updateModalContent(subService);
            modalSubservicesList.querySelectorAll('.subservice-item').forEach(item => item.classList.remove('highlighted'));
            subItem.classList.add('highlighted');
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
    contactForm.addEventListener('submit', handleContactFormSubmit);
    
    customerNameInput.addEventListener('input', validateForm);
    customerPhoneInput.addEventListener('input', validateForm);

    renderCart();
}

