import { cardsData } from './data.js';
import { initInputListeners, toggleGyro } from './InputManager.js';
import { initEngine } from './engine.js';

const grid = document.getElementById("grid");

let shimmerObserver = null;

function initShimmerObserver() {
    shimmerObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('shimmer-paused', !entry.isIntersecting);
            });
        },
        { rootMargin: '50px', threshold: 0 }
    );

    document.querySelectorAll('.skeleton-img-container, .skeleton-text').forEach(el => {
        shimmerObserver.observe(el);
    });
}

const willChangeCleanupMap = new WeakMap();

function applyWillChange(el, properties) {
    if (willChangeCleanupMap.has(el)) {
        willChangeCleanupMap.get(el)();
    }

    el.style.willChange = properties;

    const cleanup = () => {
        el.style.willChange = 'auto';
        willChangeCleanupMap.delete(el);
    };

    el.addEventListener('transitionend', cleanup, { once: true });
    willChangeCleanupMap.set(el, cleanup);
}

function initCardWillChange(card) {
    card.addEventListener('pointerenter', () => {
        applyWillChange(card, 'transform');
    }, { passive: true });
}

const ImageLoader = (() => {
    const state = {
        loadingImages: new Set(),
        loadedImages: new Set(),
        scrollVelocity: 0,
        lastScrollY: window.scrollY,
        lastScrollTime: performance.now(),
        mouseX: 0,
        mouseY: 0,
        preloadRadius: 600,
        highPriorityQueue: [],
        normalPriorityQueue: [],
        idleCallbackId: null,
        pendingScrollRead: false,
        cachedScrollY: window.scrollY
    };

    const calculateScrollVelocity = () => {
        if (state.pendingScrollRead) return;
        state.pendingScrollRead = true;

        requestAnimationFrame(() => {
            const now = performance.now();
            const currentScrollY = window.scrollY;
            const timeDelta = now - state.lastScrollTime;
            const distanceDelta = Math.abs(currentScrollY - state.lastScrollY);
            state.scrollVelocity = timeDelta > 0 ? distanceDelta / timeDelta : 0;
            state.lastScrollY = currentScrollY;
            state.cachedScrollY = currentScrollY;
            state.lastScrollTime = now;
            state.pendingScrollRead = false;
        });
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

    const getMouseDistance = (rect) => {
        const elemCenterX = rect.left + rect.width / 2;
        const elemCenterY = rect.top + rect.height / 2;
        return Math.hypot(state.mouseX - elemCenterX, state.mouseY - elemCenterY);
    };

    const loadImage = (img) => {
        if (state.loadingImages.has(img) || state.loadedImages.has(img)) return;

        state.loadingImages.add(img);
        const dataSrc = img.dataset.src || img.closest('.img-container')?.querySelector('[data-src]')?.dataset.src;

        if (!dataSrc) return;

        const picture = img.closest('picture');
        if (picture) {
            picture.querySelectorAll('source').forEach(source => {
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

            const container = img.closest('.img-container');
            if (container) {
                container.classList.remove('skeleton-img-container');
                shimmerObserver?.unobserve(container);
            }
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
            if (!state.highPriorityQueue.includes(img)) state.highPriorityQueue.push(img);
        } else {
            if (!state.normalPriorityQueue.includes(img)) state.normalPriorityQueue.push(img);
        }
        processQueue();
    };

    const observeImages = () => {
        const observer = new IntersectionObserver((entries) => {
            const reads = entries.map(entry => ({
                img: entry.target,
                isIntersecting: entry.isIntersecting,
                rect: entry.boundingClientRect
            }));

            requestAnimationFrame(() => {
                reads.forEach(({ img, isIntersecting, rect }) => {
                    if (!isIntersecting) return;
                    const nearMouse = getMouseDistance(rect) < state.preloadRadius;
                    const priority = getImagePriority(rect, state.scrollVelocity);
                    const finalPriority = (priority === 'high' || nearMouse) ? 'high' : 'normal';
                    scheduleImageLoad(img, finalPriority);
                });
            });
        }, { rootMargin: '400px', threshold: 0 });

        document.querySelectorAll('.main-img[data-src]').forEach(img => observer.observe(img));
    };

    const loadViewportImages = () => {
        const imgs = Array.from(document.querySelectorAll('.main-img[data-src]'));

        const rects = imgs.map(img => img.getBoundingClientRect());

        requestAnimationFrame(() => {
            const viewportHeight = window.innerHeight;
            imgs.forEach((img, i) => {
                const rect = rects[i];
                if (rect.top < viewportHeight && rect.bottom > 0) {
                    scheduleImageLoad(img, 'high');
                }
            });
        });
    };

    const init = () => {
        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
        }, { passive: true });
        window.addEventListener('scroll', calculateScrollVelocity, { passive: true });
        loadViewportImages();
        observeImages();
    };

    return { init };
})();

function generateResponsiveImageHTML(card, isFirstCard) {
    const imageFormats = card.imageFormats || {};
    const avifUrl = imageFormats.avif || card.image;
    const webpUrl = imageFormats.webp || card.image;
    const jpegUrl = imageFormats.jpeg || card.image;

    const srcAttr = isFirstCard ? 'src' : 'data-src';
    const srcsetAttr = isFirstCard ? 'srcset' : 'data-srcset';
    const fetchPriority = isFirstCard ? 'fetchpriority="high"' : '';
    const loading = isFirstCard ? 'loading="eager"' : 'loading="lazy"';
    const decoding = isFirstCard ? 'decoding="sync"' : 'decoding="async"';
    const opacity = isFirstCard ? '1' : '0';
    const skeletonClass = isFirstCard ? '' : 'skeleton-img-container';

    const sizes = "(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px";

    return `
        <div class="img-container ${skeletonClass}" aria-hidden="true">
            <picture class="responsive-image">
                ${imageFormats.avif ? `<source ${srcsetAttr}="${avifUrl}" type="image/avif" sizes="${sizes}">` : ''}
                ${imageFormats.webp ? `<source ${srcsetAttr}="${webpUrl}" type="image/webp" sizes="${sizes}">` : ''}
                <source type="image/jpeg" sizes="${sizes}">
                <img
                    class="main-img"
                    alt="${card.title}"
                    ${srcAttr}="${jpegUrl}"
                    ${loading}
                    ${fetchPriority}
                    width="800"
                    height="500"
                    ${decoding}
                    style="opacity: ${opacity}; transition: opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1); position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
                >
            </picture>
            ${isFirstCard ? '' : '<div class="skeleton-placeholder" aria-hidden="true"></div>'}
        </div>
    `;
}

const SHIMMER_STAGGER_MS = 200;
const SHIMMER_STAGGER_CYCLE = 4;

grid.innerHTML = cardsData.map((c, index) => {
    const shimmerDelay = (index % SHIMMER_STAGGER_CYCLE) * SHIMMER_STAGGER_MS;

    return `
<article class="card render-node"
         aria-label="${c.title}"
         style="--shimmer-delay: ${shimmerDelay}ms">
    <div class="card-pulse" aria-hidden="true"></div>
    <a href="#" class="card-link" tabindex="0">
        ${generateResponsiveImageHTML(c, index === 0)}
        <span class="category" aria-label="Category">${c.badge}</span>
        <h2 class="title">${c.title}</h2>
        <p class="description">${c.description}</p>
    </a>
</article>`;
}).join('');

document.addEventListener('DOMContentLoaded', () => {
    ImageLoader.init();
    initInputListeners();
    initEngine();
    initShimmerObserver();

    document.querySelectorAll('.card').forEach(card => initCardWillChange(card));
});

const panel = document.getElementById('controls');
const togglePanelBtn = document.getElementById('toggle-panel');

togglePanelBtn.onclick = () => {
    applyWillChange(panel, 'transform, opacity');
    const isHidden = document.body.classList.toggle('panel-hidden');
    togglePanelBtn.setAttribute('aria-pressed', String(!isHidden));
};

const gyroBtn = document.getElementById('gyro-btn');

if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    if (gyroBtn) gyroBtn.style.display = 'none';
}
if (gyroBtn) {
    gyroBtn.onclick = function () { toggleGyro(this); };
}

document.getElementById('theme-btn').onclick = () => {
    const toggleTheme = () => {
        document.body.classList.toggle('dark');
        window.dispatchEvent(new Event('scroll'));
    };

    if ('startViewTransition' in document) {
        try {
            document.startViewTransition(toggleTheme);
        } catch {
            toggleTheme();
        }
    } else {
        toggleTheme();
    }
};
