import { cardsData } from './data.js';
import { initInputListeners, toggleGyro } from './InputManager.js';
import { initEngine } from './engine.js';

const grid = document.getElementById("grid");
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '50px'
};

const viewportObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const img = card.querySelector('.main-img');

            if (img && img.loading === 'lazy') {
                img.loading = 'eager';
                img.setAttribute('fetchpriority', 'high');
            }

            obs.unobserve(card);
        }
    });
}, observerOptions);

cardsData.forEach((card) => {
    const cardElement = document.createElement('article');
    cardElement.className = 'card render-node skeleton';
    cardElement.setAttribute('role', 'group');
    cardElement.setAttribute('aria-label', card.title);

    const imageFormats = card.imageFormats || {};
    const avifUrl = imageFormats.avif || card.image;
    const webpUrl = imageFormats.webp || card.image;
    const jpegUrl = imageFormats.jpeg || card.image;

    cardElement.innerHTML = `
        <a href="#" class="card-link" tabindex="0">
            <!-- Image Container with Skeleton Placeholder -->
            <div class="img-container skeleton-img-container" aria-hidden="true">
                <picture class="responsive-image" style="position: absolute; inset: 0; width: 100%; height: 100%; display: contents;">
                    ${imageFormats.avif ? `<source type="image/avif" srcset="${avifUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                    ${imageFormats.webp ? `<source type="image/webp" srcset="${webpUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                    <source type="image/jpeg" srcset="${jpegUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">
                    <img 
                        src="${card.image}" 
                        alt="${card.title}" 
                        class="main-img"
                        loading="lazy"
                        decoding="async"
                        width="800"
                        height="500"
                        style="opacity: 0; transition: opacity 0.3s ease-in; position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
                    >
                </picture>
                <!-- Skeleton Placeholder (visible while loading) -->
                <div class="skeleton-placeholder" aria-hidden="true"></div>
            </div>

            <!-- Text Content with Skeleton Placeholders -->
            <div class="card-content">
                <span class="category skeleton-text" aria-label="Category" style="width: 30%; height: 1.2em; display: block; margin-bottom: 0.5em;">
                    ${card.badge}
                </span>
                <h2 class="title skeleton-text" style="height: 1.5em; display: block; margin-bottom: 0.5em;">
                    ${card.title}
                </h2>
                <p class="description skeleton-text" style="width: 90%; height: 3em; display: block; line-height: 1.5em;">
                    ${card.description}
                </p>
            </div>
        </a>
    `;

    grid.appendChild(cardElement);

    viewportObserver.observe(cardElement);

    const img = cardElement.querySelector('.main-img');

    img.onload = () => {
        cardElement.classList.remove('skeleton');

        const skeletonPlaceholder = cardElement.querySelector('.skeleton-placeholder');
        if (skeletonPlaceholder) {
            skeletonPlaceholder.style.display = 'none';
        }

        const textElements = cardElement.querySelectorAll('.skeleton-text');
        textElements.forEach(el => {
            el.classList.remove('skeleton-text');
        });

        img.style.opacity = '1';
    };

    img.onerror = () => {
        cardElement.classList.remove('skeleton');
        const skeletonPlaceholder = cardElement.querySelector('.skeleton-placeholder');
        if (skeletonPlaceholder) {
            skeletonPlaceholder.style.display = 'none';
        }
        const textElements = cardElement.querySelectorAll('.skeleton-text');
        textElements.forEach(el => {
            el.classList.remove('skeleton-text');
        });
    };
});

initInputListeners();
initEngine();

const gyroBtn = document.getElementById('gyro-btn');
if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    if (gyroBtn) gyroBtn.style.display = 'none';
}

if (gyroBtn) {
    gyroBtn.onclick = function () { toggleGyro(this); };
}

document.getElementById('toggle-panel').onclick = () => {
    const isHidden = document.body.classList.toggle('panel-hidden');
    document.getElementById('toggle-panel').setAttribute('aria-pressed', !isHidden);
};

document.getElementById('theme-btn').onclick = () => {
    document.body.classList.toggle('dark');
    window.dispatchEvent(new Event('scroll'));
};