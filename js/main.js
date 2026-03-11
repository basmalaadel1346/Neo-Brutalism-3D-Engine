import { cardsData } from './data.js';
import { initInputListeners, toggleGyro } from './InputManager.js';
import { initEngine } from './engine.js';

const grid = document.getElementById("grid");

const ImageLoader = (() => {
    const state = {
        loadingImages: new Set(),
        pendingImages: new Map(),
        loadedImages: new Set(),
        scrollVelocity: 0,
        lastScrollY: 0,
        lastScrollTime: 0,
        mouseX: 0,
        mouseY: 0,
        preloadRadius: 600,
        highPriorityQueue: [],
        normalPriorityQueue: [],
        idleCallbackId: null
    };

    const getImagePriority = (rect, scrollVelocity) => {
        const viewportHeight = window.innerHeight;
        const distanceToViewport = Math.max(
            0,
            rect.top > viewportHeight ? rect.top - viewportHeight : Math.abs(rect.bottom)
        );

        if (distanceToViewport < 200) return 'high';
        if (distanceToViewport < 600 && scrollVelocity > 2) return 'high';
        if (distanceToViewport < 1000) return 'normal';
        return 'low';
    };

    const calculateScrollVelocity = () => {
        const now = performance.now();
        const timeDelta = now - state.lastScrollTime;
        const distanceDelta = Math.abs(window.scrollY - state.lastScrollY);

        state.scrollVelocity = timeDelta > 0 ? distanceDelta / timeDelta : 0;
        state.lastScrollY = window.scrollY;
        state.lastScrollTime = now;
    };

    const getMouseDistance = (rect) => {
        const elemCenterX = rect.left + rect.width / 2;
        const elemCenterY = rect.top + rect.height / 2;
        return Math.hypot(state.mouseX - elemCenterX, state.mouseY - elemCenterY);
    };

    const loadImage = (img) => {
        if (state.loadingImages.has(img) || state.loadedImages.has(img)) return;

        state.loadingImages.add(img);
        const dataSrc = img.closest('.img-container')?.querySelector('[data-src]')?.dataset.src;

        if (!dataSrc) return;

        const picture = img.closest('picture');
        if (picture) {
            const sources = picture.querySelectorAll('source');
            sources.forEach(source => {
                const dataSrcset = source.dataset.srcset;
                if (dataSrcset) source.srcset = dataSrcset;
            });
        }

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = dataSrc;
            img.style.opacity = '1';
            state.loadingImages.delete(img);
            state.loadedImages.add(img);
            img.closest('.img-container')?.classList.remove('skeleton-img-container');
        };

        tempImg.onerror = () => {
            state.loadingImages.delete(img);
            img.style.opacity = '1';
        };

        tempImg.src = dataSrc;
    };

    const processQueue = () => {
        if (state.highPriorityQueue.length > 0) {
            const img = state.highPriorityQueue.shift();
            loadImage(img);
        }

        if (state.normalPriorityQueue.length > 0 && state.loadingImages.size < 3) {
            const img = state.normalPriorityQueue.shift();
            loadImage(img);
        }

        state.idleCallbackId = requestIdleCallback(
            () => {
                if (state.normalPriorityQueue.length > 0) {
                    const img = state.normalPriorityQueue.shift();
                    loadImage(img);
                    processQueue();
                }
            },
            { timeout: 3000 }
        );
    };

    const scheduleImageLoad = (img, priority) => {
        if (priority === 'high') {
            if (!state.highPriorityQueue.includes(img)) {
                state.highPriorityQueue.push(img);
            }
        } else {
            if (!state.normalPriorityQueue.includes(img)) {
                state.normalPriorityQueue.push(img);
            }
        }
        processQueue();
    };

    const observeImages = () => {
        const observerOptions = {
            rootMargin: '400px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;

                if (entry.isIntersecting) {
                    calculateScrollVelocity();
                    const rect = entry.boundingClientRect;
                    const mouseProximity = getMouseDistance(rect);
                    const nearMouse = mouseProximity < state.preloadRadius;
                    const priority = getImagePriority(rect, state.scrollVelocity);
                    const finalPriority = (priority === 'high' || nearMouse) ? 'high' : 'normal';

                    scheduleImageLoad(img, finalPriority);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.main-img[data-src]').forEach(img => {
            observer.observe(img);
        });
    };

    const loadViewportImages = () => {
        const viewportImages = [];
        const allImages = document.querySelectorAll('.main-img[data-src]');

        allImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                viewportImages.push(img);
            }
        });

        viewportImages.forEach(img => scheduleImageLoad(img, 'high'));
    };

    const init = () => {
        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
        });

        window.addEventListener('scroll', calculateScrollVelocity, { passive: true });
        loadViewportImages();
        observeImages();
    };

    return { init };
})();

function generateResponsiveImageHTML(card) {
    const imageFormats = card.imageFormats || {};
    const avifUrl = imageFormats.avif || card.image;
    const webpUrl = imageFormats.webp || card.image;
    const jpegUrl = imageFormats.jpeg || card.image;

    return `
        <div class="img-container skeleton-img-container" aria-hidden="true">
            <picture class="responsive-image">
                ${imageFormats.avif ? `<source data-srcset="${avifUrl}" type="image/avif" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                ${imageFormats.webp ? `<source data-srcset="${webpUrl}" type="image/webp" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                <source type="image/jpeg" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">
                <img 
                    class="main-img"
                    alt="${card.title}" 
                    data-src="${jpegUrl}"
                    width="800"
                    height="500"
                    decoding="async"
                    style="opacity: 0; transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
                >
            </picture>
            <div class="skeleton-placeholder" aria-hidden="true"></div>
        </div>
    `;
}

grid.innerHTML = cardsData.map(c => `
<article class="card render-node" role="group" aria-label="${c.title}">
    <a href="#" class="card-link" tabindex="0">
        ${generateResponsiveImageHTML(c)}
        <span class="category" aria-label="Category">${c.badge}</span>
        <h2 class="title">${c.title}</h2>
        <p class="description">${c.description}</p>
    </a>
</article>`).join('');

document.addEventListener('DOMContentLoaded', () => {
    ImageLoader.init();
    initInputListeners();
    initEngine();
});

const gyroBtn = document.getElementById('gyro-btn');

if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    if (gyroBtn) gyroBtn.style.display = 'none';
}
document.getElementById('gyro-btn').onclick = function () { toggleGyro(this); };

document.getElementById('toggle-panel').onclick = () => {
    const isHidden = document.body.classList.toggle('panel-hidden');
    document.getElementById('toggle-panel').setAttribute('aria-pressed', !isHidden);
};

document.getElementById('theme-btn').onclick = () => {
    document.body.classList.toggle('dark');
    window.dispatchEvent(new Event('scroll'));
};
