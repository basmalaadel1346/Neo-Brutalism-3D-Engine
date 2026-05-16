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
            loadImage(state.highPriorityQueue.shift());
        }
        if (state.normalPriorityQueue.length > 0 && state.loadingImages.size < 3) {
            loadImage(state.normalPriorityQueue.shift());
        }
        state.idleCallbackId = requestIdleCallback(
            () => {
                if (state.normalPriorityQueue.length > 0) {
                    loadImage(state.normalPriorityQueue.shift());
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

const SHIMMER_STAGGER_MS = 200;
const SHIMMER_STAGGER_CYCLE = 4;
const IMG_SIZES = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px';

function createImageContainer(card, isFirstCard) {
    const imageFormats = card.imageFormats || {};
    const avifUrl = imageFormats.avif || card.image;
    const webpUrl = imageFormats.webp || card.image;
    const jpegUrl = imageFormats.jpeg || card.image;

    const container = document.createElement('div');
    container.className = isFirstCard ? 'img-container' : 'img-container skeleton-img-container';
    container.setAttribute('aria-hidden', 'true');

    const picture = document.createElement('picture');
    picture.className = 'responsive-image';

    if (imageFormats.avif) {
        const src = document.createElement('source');
        if (isFirstCard) src.srcset = avifUrl; else src.dataset.srcset = avifUrl;
        src.type = 'image/avif';
        src.sizes = IMG_SIZES;
        picture.appendChild(src);
    }

    if (imageFormats.webp) {
        const src = document.createElement('source');
        if (isFirstCard) src.srcset = webpUrl; else src.dataset.srcset = webpUrl;
        src.type = 'image/webp';
        src.sizes = IMG_SIZES;
        picture.appendChild(src);
    }

    const jpegSrc = document.createElement('source');
    jpegSrc.type = 'image/jpeg';
    jpegSrc.sizes = IMG_SIZES;
    picture.appendChild(jpegSrc);

    const img = document.createElement('img');
    img.className = 'main-img';
    img.alt = card.title;
    img.width = 800;
    img.height = 500;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 0.4s cubic-bezier(0.23,1,0.32,1);';

    if (isFirstCard) {
        img.src = jpegUrl;
        img.setAttribute('fetchpriority', 'high');
        img.loading = 'eager';
        img.decoding = 'sync';
        img.style.opacity = '1';
    } else {
        img.dataset.src = jpegUrl;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.opacity = '0';
    }

    picture.appendChild(img);
    container.appendChild(picture);

    if (!isFirstCard) {
        const placeholder = document.createElement('div');
        placeholder.className = 'skeleton-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        container.appendChild(placeholder);
    }

    return container;
}

function createCardElement(card, index) {
    const shimmerDelay = (index % SHIMMER_STAGGER_CYCLE) * SHIMMER_STAGGER_MS;
    const isFirstCard = index === 0;

    const article = document.createElement('article');
    article.className = 'card render-node';
    article.setAttribute('aria-label', card.title);
    article.style.setProperty('--shimmer-delay', `${shimmerDelay}ms`);

    const pulse = document.createElement('div');
    pulse.className = 'card-pulse';
    pulse.setAttribute('aria-hidden', 'true');

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'card-link';
    link.setAttribute('tabindex', '0');
    link.setAttribute('rel', 'noopener noreferrer');

    const category = document.createElement('span');
    category.className = 'category';
    category.setAttribute('aria-label', 'Category');
    category.textContent = card.badge;

    const title = document.createElement('h2');
    title.className = 'title';
    title.textContent = card.title;

    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = card.description;

    link.appendChild(createImageContainer(card, isFirstCard));
    link.appendChild(category);
    link.appendChild(title);
    link.appendChild(description);

    article.appendChild(pulse);
    article.appendChild(link);

    return article;
}

const fragment = document.createDocumentFragment();
cardsData.forEach((c, index) => fragment.appendChild(createCardElement(c, index)));
grid.appendChild(fragment);

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
