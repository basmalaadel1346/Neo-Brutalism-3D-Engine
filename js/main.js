import { cardsData }                                   from './data.js';
import { initInputListeners, toggleGyro, onGyroChange, onScrollChange } from './InputManager.js';
import { initEngine }                                   from './engine.js';

const IMG_SIZES            = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px';
const SHIMMER_STAGGER_MS   = 200;
const SHIMMER_STAGGER_CYCLE = 4;

// ---------------------------------------------------------------------------
// will-change — applied on hover, cleaned up on transitionend
// ---------------------------------------------------------------------------

const willChangeCleanupMap = new WeakMap();

function applyWillChange(el, properties) {
    if (willChangeCleanupMap.has(el)) willChangeCleanupMap.get(el)();
    el.style.willChange = properties;
    const cleanup = () => {
        el.style.willChange = 'auto';
        willChangeCleanupMap.delete(el);
    };
    el.addEventListener('transitionend', cleanup, { once: true });
    willChangeCleanupMap.set(el, cleanup);
}

function initCardWillChange(card) {
    card.addEventListener('pointerenter', () => applyWillChange(card, 'transform'), { passive: true });
}

// ---------------------------------------------------------------------------
// Shimmer observer
// ---------------------------------------------------------------------------

function createShimmerObserver() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(e =>
            e.target.classList.toggle('shimmer-paused', !e.isIntersecting)
        ),
        { rootMargin: '50px', threshold: 0 }
    );
    document.querySelectorAll('.skeleton-img-container, .skeleton-text')
        .forEach(el => observer.observe(el));
    return observer;
}

// ---------------------------------------------------------------------------
// ImageLoader
// ---------------------------------------------------------------------------

const ImageLoader = (() => {
    const state = {
        loadingImages:       new Set(),
        loadedImages:        new Set(),
        scrollVelocity:      0,
        lastScrollY:         window.scrollY,
        lastScrollTime:      performance.now(),
        mouseX:              0,
        mouseY:              0,
        preloadRadius:       600,
        highPriorityQueue:   new Set(),
        normalPriorityQueue: new Set(),
        idleCallbackId:      null,
        pendingScrollRead:   false,
    };

    let shimmerObserverRef = null;

    // Pull the first item from a Set (insertion-order FIFO).
    const shiftSet = (set) => {
        const first = set.values().next().value;
        set.delete(first);
        return first;
    };

    const calculateScrollVelocity = () => {
        if (state.pendingScrollRead) return;
        state.pendingScrollRead = true;
        requestAnimationFrame(() => {
            const now            = performance.now();
            const currentScrollY = window.scrollY;
            const timeDelta      = now - state.lastScrollTime;
            const distanceDelta  = Math.abs(currentScrollY - state.lastScrollY);
            state.scrollVelocity    = timeDelta > 0 ? distanceDelta / timeDelta : 0;
            state.lastScrollY       = currentScrollY;
            state.lastScrollTime    = now;
            state.pendingScrollRead = false;
        });
    };

    const getImagePriority = (rect, vh) => {
        const distanceToViewport = Math.max(
            0,
            rect.top > vh ? rect.top - vh : Math.abs(rect.bottom)
        );
        if (distanceToViewport < 200) return 'high';
        if (distanceToViewport < 600 && state.scrollVelocity > 2) return 'high';
        if (distanceToViewport < 1000) return 'normal';
        return 'low';
    };

    const getMouseDistance = rect => {
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        return Math.hypot(state.mouseX - cx, state.mouseY - cy);
    };

    const loadImageWithFallback = (img, fallbackUrls, attempt = 0) => {
        if (attempt >= fallbackUrls.length) {
            img.style.opacity = '1';
            state.loadingImages.delete(img);
            return;
        }

        const url     = fallbackUrls[attempt];
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src           = url;
            img.style.opacity = '1';
            state.loadingImages.delete(img);
            state.loadedImages.add(img);
            const container = img.closest('.img-container');
            if (container) {
                container.classList.remove('skeleton-img-container');
                shimmerObserverRef?.unobserve(container);
            }
        };

        tempImg.onerror = () => loadImageWithFallback(img, fallbackUrls, attempt + 1);
        tempImg.src     = url;
    };

    const loadImage = img => {
        if (state.loadingImages.has(img) || state.loadedImages.has(img)) return;
        state.loadingImages.add(img);

        const fallbackChain = [
            img.dataset.srcAvif,
            img.dataset.srcWebp,
            img.dataset.src,
        ].filter(Boolean);

        if (!fallbackChain.length) {
            state.loadingImages.delete(img);
            return;
        }

        const picture = img.closest('picture');
        if (picture) {
            picture.querySelectorAll('source').forEach(source => {
                if (source.dataset.srcset) source.srcset = source.dataset.srcset;
            });
        }

        loadImageWithFallback(img, fallbackChain);
    };

    const processQueue = () => {
        if (state.highPriorityQueue.size > 0) {
            loadImage(shiftSet(state.highPriorityQueue));
        }
        if (state.normalPriorityQueue.size > 0 && state.loadingImages.size < 3) {
            loadImage(shiftSet(state.normalPriorityQueue));
        }
        state.idleCallbackId = requestIdleCallback(
            () => {
                if (state.normalPriorityQueue.size > 0) {
                    loadImage(shiftSet(state.normalPriorityQueue));
                    processQueue();
                }
            },
            { timeout: 3000 }
        );
    };

    const scheduleImageLoad = (img, priority) => {
        if (priority === 'high') {
            state.highPriorityQueue.add(img);
        } else {
            state.normalPriorityQueue.add(img);
        }
        processQueue();
    };

    const observeImages = () => {
        const observer = new IntersectionObserver(entries => {
            const reads = entries.map(e => ({
                img:            e.target,
                isIntersecting: e.isIntersecting,
                rect:           e.boundingClientRect,
            }));
            requestAnimationFrame(() => {
                const vh = window.innerHeight;
                reads.forEach(({ img, isIntersecting, rect }) => {
                    if (!isIntersecting) return;
                    const nearMouse     = getMouseDistance(rect) < state.preloadRadius;
                    const priority      = getImagePriority(rect, vh);
                    const finalPriority = (priority === 'high' || nearMouse) ? 'high' : 'normal';
                    scheduleImageLoad(img, finalPriority);
                });
            });
        }, { rootMargin: '400px', threshold: 0 });

        document.querySelectorAll('.main-img[data-src]').forEach(img => observer.observe(img));
    };

    const loadViewportImages = () => {
        const imgs  = Array.from(document.querySelectorAll('.main-img[data-src]'));
        const rects = imgs.map(img => img.getBoundingClientRect());
        requestAnimationFrame(() => {
            const vh = window.innerHeight;
            imgs.forEach((img, i) => {
                const rect = rects[i];
                if (rect.top < vh && rect.bottom > 0) scheduleImageLoad(img, 'high');
            });
        });
    };

    const init = (shimmerObserver) => {
        shimmerObserverRef = shimmerObserver;
        document.addEventListener('mousemove', e => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
        }, { passive: true });
        window.addEventListener('scroll', calculateScrollVelocity, { passive: true });
        loadViewportImages();
        observeImages();
    };

    return { init };
})();

// ---------------------------------------------------------------------------
// Card DOM factory
// ---------------------------------------------------------------------------

function createImageContainer(card, isFirstCard) {
    const { avif, webp, jpeg } = card.imageFormats;

    const container = document.createElement('div');
    container.className = isFirstCard
        ? 'img-container'
        : 'img-container skeleton-img-container';
    container.setAttribute('aria-hidden', 'true');

    const picture = document.createElement('picture');
    picture.className = 'responsive-image';

    if (avif) {
        const src = document.createElement('source');
        src.type  = 'image/avif';
        src.sizes = IMG_SIZES;
        if (isFirstCard) src.srcset = avif; else src.dataset.srcset = avif;
        picture.appendChild(src);
    }

    if (webp) {
        const src = document.createElement('source');
        src.type  = 'image/webp';
        src.sizes = IMG_SIZES;
        if (isFirstCard) src.srcset = webp; else src.dataset.srcset = webp;
        picture.appendChild(src);
    }

    const jpegSrc = document.createElement('source');
    jpegSrc.type  = 'image/jpeg';
    jpegSrc.sizes = IMG_SIZES;
    if (isFirstCard) jpegSrc.srcset = jpeg; else jpegSrc.dataset.srcset = jpeg;
    picture.appendChild(jpegSrc);

    const img = document.createElement('img');
    img.className = 'main-img';
    img.alt       = card.title;
    img.width     = 800;
    img.height    = 500;

    Object.assign(img.style, {
        position:   'absolute',
        inset:      '0',
        width:      '100%',
        height:     '100%',
        objectFit:  'cover',
        transition: 'opacity 0.4s cubic-bezier(0.23,1,0.32,1)',
    });

    if (isFirstCard) {
        img.src = jpeg;
        img.setAttribute('fetchpriority', 'high');
        img.loading       = 'eager';
        img.decoding      = 'sync';
        img.style.opacity = '1';
    } else {
        if (avif) img.dataset.srcAvif = avif;
        if (webp) img.dataset.srcWebp = webp;
        img.dataset.src   = jpeg;
        img.loading       = 'lazy';
        img.decoding      = 'async';
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
    const isFirstCard  = index === 0;
    const titleId      = `card-title-${index}`;

    const article = document.createElement('article');
    article.className = 'card render-node';
    article.setAttribute('aria-labelledby', titleId);
    article.style.setProperty('--shimmer-delay', `${shimmerDelay}ms`);

    const pulse = document.createElement('div');
    pulse.className = 'card-pulse';
    pulse.setAttribute('aria-hidden', 'true');

    const link = document.createElement('a');
    link.href      = `/gallery/${card.id}`;
    link.className = 'card-link';

    const category = document.createElement('span');
    category.className   = 'category';
    category.textContent = card.badge;

    const title = document.createElement('h2');
    title.id          = titleId;
    title.className   = 'title';
    title.textContent = card.title;

    const description = document.createElement('p');
    description.className   = 'description';
    description.textContent = card.description;

    link.appendChild(createImageContainer(card, isFirstCard));
    link.appendChild(category);
    link.appendChild(title);
    link.appendChild(description);

    article.appendChild(pulse);
    article.appendChild(link);

    return article;
}

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------

function wireTogglePanel() {
    const panel         = document.getElementById('controls');
    const togglePanelBtn = document.getElementById('toggle-panel');
    if (!panel || !togglePanelBtn) return;
    togglePanelBtn.addEventListener('click', () => {
        applyWillChange(panel, 'transform, opacity');
        const isHidden = document.body.classList.toggle('panel-hidden');
        togglePanelBtn.setAttribute('aria-pressed', String(!isHidden));
    });
}

function wireGyroBtnVisibility() {
    const gyroBtn = document.getElementById('gyro-btn');
    if (!gyroBtn) return;
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
        gyroBtn.style.display = 'none';
    }
    gyroBtn.addEventListener('click', toggleGyro);
}

function wireEnableMotionBtn() {
    const btn = document.getElementById('enable-motion');
    if (btn) btn.addEventListener('click', toggleGyro);
}

function wireThemeButton() {
    const themeBtn = document.getElementById('theme-btn');
    if (!themeBtn) return;
    const applyTheme = () => {
        document.body.classList.toggle('dark');
        window.dispatchEvent(new Event('scroll'));
    };
    themeBtn.addEventListener('click', () => {
        if ('startViewTransition' in document) {
            try { document.startViewTransition(applyTheme); } catch { applyTheme(); }
        } else {
            applyTheme();
        }
    });
}

// ---------------------------------------------------------------------------
// Gyro UI — owned by main.js, triggered via InputManager subscription
// ---------------------------------------------------------------------------

function wireGyroUI() {
    onGyroChange(isActive => {
        const gyroBtn         = document.getElementById('gyro-btn');
        const enableMotionBtn = document.getElementById('enable-motion');
        if (gyroBtn) {
            gyroBtn.textContent = isActive ? '📴 Motion: ON' : '📱 Motion: OFF';
            gyroBtn.setAttribute('aria-pressed', String(isActive));
        }
        if (enableMotionBtn) {
            enableMotionBtn.textContent = isActive ? '✅ الحساسات تعمل' : '📱 تفعيل حساسات الحركة';
            enableMotionBtn.disabled    = isActive;
        }
    });
}

function wireScrollVFX() {
    onScrollChange(({ hue, pulseSpread, isDark }) => {
        document.documentElement.style.setProperty('--bg-hue', hue);
        document.documentElement.style.setProperty('--pulse-spread', `${pulseSpread}px`);
        document.documentElement.style.setProperty('--sh-color', isDark ? `hsl(${hue}, 80%, 60%)` : 'black');
    });
}

// ---------------------------------------------------------------------------
// Single deterministic entry point
// ---------------------------------------------------------------------------

function init() {
    const grid     = document.getElementById('grid');
    const fragment = document.createDocumentFragment();
    cardsData.forEach((card, i) => fragment.appendChild(createCardElement(card, i)));
    grid.appendChild(fragment);

    initInputListeners();
    initEngine();

    const shimmerObserver = createShimmerObserver();
    ImageLoader.init(shimmerObserver);

    document.querySelectorAll('.card').forEach(initCardWillChange);

    wireTogglePanel();
    wireGyroBtnVisibility();
    wireEnableMotionBtn();
    wireThemeButton();
    wireGyroUI();
    wireScrollVFX();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
