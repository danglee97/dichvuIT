document.addEventListener('DOMContentLoaded', function() {

    // --- Mobile Menu ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });

    // --- Header Style on Scroll ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('header-glass', window.scrollY > 10);
    });

    // --- Fade-in Animation on Scroll ---
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = { threshold: 0.2, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);
    faders.forEach(fader => appearOnScroll.observe(fader));
    
    // --- Hero Title Typing Effect ---
    const titleElement = document.querySelector('#hero-title .typing-text');
    const textToType = "Giải Pháp Công Nghệ Tương Lai";
    let charIndex = 0;
    function type() {
        if (charIndex < textToType.length) {
            titleElement.textContent += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(type, 100);
        }
    }
    type();

    // --- Service Card 3D Tilt Effect ---
    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -20; // Max rotation 10deg
            const rotateY = (x / width - 0.5) * 20;  // Max rotation 10deg
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // --- Three.js Interactive Particle Background ---
    let scene, camera, renderer, particles;
    let mouse = new THREE.Vector2(-100, -100); // Initialize off-screen
    
    function initThreeJS() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return; // Exit if canvas is not found
        scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 20;

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
        }
        
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.1,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        document.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onWindowResize);
    }

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    const clock = new THREE.Clock();
    function animate() {
        if (!renderer) return; // Exit if not initialized
        const elapsedTime = clock.getElapsedTime();
        
        // Animate particles
        particles.rotation.y = elapsedTime * 0.05;

        // Make particles react to mouse
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // This part is for mouse interaction, which can be complex.
        // For simplicity and performance, we'll keep the rotation animation.
        // A full implementation would involve updating particle positions based on intersections.
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    initThreeJS();
    if (renderer) {
      animate();
    }
});
