document.addEventListener('DOMContentLoaded', () => {
    // --- BƯỚC 1: KHỞI TẠO CÁC THÀNH PHẦN CHUNG ---
    // Tự gọi các hàm cần thiết từ script.js để hiển thị giỏ hàng, menu, v.v.
    if (typeof initializeCommonComponents === 'function') {
        initializeCommonComponents();
    } else {
        console.error("Lỗi: Hàm initializeCommonComponents không tìm thấy. Hãy đảm bảo file script.js đã được tải trước file này.");
    }

    // --- BƯỚC 2: TẢI DỮ LIỆU BẢNG GIÁ ---
    const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyIremqvgCwYcVxsf09X-LbR1JRHZipuUr3xq9z-ZrGzaeXqgjxogkd3QyqKx_fYmQv/exec';
    let allProducts = [];

    const loader = document.getElementById('price-loader');
    const tableContainer = document.getElementById('price-table-container');
    const tableBody = document.getElementById('price-table-body');
    const searchInput = document.getElementById('searchInput');
    const categoryFiltersContainer = document.getElementById('categoryFilters');
    const noResults = document.getElementById('no-results');
    
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    
    const renderTable = (products) => {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            noResults.classList.remove('hidden');
            tableContainer.classList.add('hidden');
            return;
        }
        noResults.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        products.forEach(product => {
            const descriptionHtml = product.description.split(/<br>|\n/).map(line => line.trim()).filter(line => line).map(line => `<li>${line.replace(/^- /, '')}</li>`).join('');
            const row = `
                <tr>
                    <td>
                        <div class="product-info">
                            <img src="${product.image}" alt="${product.name}" class="product-image">
                            <div>
                                <p class="font-bold text-white">${product.name}</p>
                                <p class="text-sm text-gray-400">${product.category}</p>
                            </div>
                        </div>
                    </td>
                    <td class="text-sm text-gray-300 hidden md:table-cell description-cell">
                        <ul>${descriptionHtml}</ul>
                    </td>
                    <td>
                        <p class="font-bold text-primary text-lg">${formatPrice(product.price)}</p>
                        <p class="text-sm text-gray-400">/${product.unit}</p>
                    </td>
                    <td>
                        <button class="add-to-cart-btn-table text-sm font-bold py-2 px-4 rounded-full transition-colors bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black" data-id="${product.id}">
                            Thêm +
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    };

    // === BẮT ĐẦU PHẦN SỬA LỖI GIAO DIỆN SÁNG/TỐI ===
    const createCategoryFilters = (products) => {
        const categories = ['Tất cả', ...new Set(products.map(p => p.category))];
        // Sử dụng class chung .filter-btn và .active để CSS xử lý màu sắc
        categoryFiltersContainer.innerHTML = categories.map(category => 
            `<button class="filter-btn px-4 py-2 rounded-full text-sm font-medium ${category === 'Tất cả' ? 'active' : ''}" data-category="${category}">
                ${category}
            </button>`
        ).join('');

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Xóa class 'active' khỏi tất cả các nút
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Thêm class 'active' vào nút vừa được nhấn
                btn.classList.add('active');
                filterAndSearch();
            });
        });
    };
    
    const filterAndSearch = () => {
        const searchTerm = searchInput.value.toLowerCase();
        // Tìm nút đang được active bằng class '.active'
        const activeButton = document.querySelector('.filter-btn.active');
        const activeCategory = activeButton ? activeButton.dataset.category : 'Tất cả';

        const filteredProducts = allProducts.filter(product => {
            const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || product.category.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        renderTable(filteredProducts);
    };
    // === KẾT THÚC PHẦN SỬA LỖI ===

    async function fetchData() {
        try {
            const response = await fetch(`${appsScriptUrl}?action=getBaoGia`);
            if (!response.ok) throw new Error('Network response was not ok.');
            allProducts = await response.json();
            renderTable(allProducts);
            createCategoryFilters(allProducts);
            loader.classList.add('hidden');
            if (searchInput) searchInput.addEventListener('input', filterAndSearch);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu báo giá:', error);
            if(loader) loader.innerHTML = '<p class="text-lg text-red-500">Không thể tải được bảng giá. Vui lòng thử lại sau.</p>';
        }
    }

    tableBody.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart-btn-table');
        if (button) {
            const productId = button.dataset.id;
            const productToAdd = allProducts.find(p => p.id === productId);
            if (productToAdd && typeof addItemToCart === 'function') {
                const cartItem = { 
                    subId: productToAdd.id, 
                    name: productToAdd.name, 
                    price: productToAdd.price, 
                    images: [productToAdd.image] 
                };
                addItemToCart(cartItem, button);
            }
        }
    });
    
    fetchData();
});

