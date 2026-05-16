/**
 * main.js
 * -------
 * Application entry point.
 *
 * Architecture rules enforced here:
 *  1. ALL DOM reads/writes and event bindings happen inside init().
 *  2. init() is the ONLY entry point — no module-level side effects.
 *  3. Image loading: progressive format fallback (AVIF → WebP → JPEG) is
 *     handled inside ImageLoader, eliminating the need for imageOptimizer.js
 *     (which has been deleted).
 */

import { cardsData }                          from './data.js';
import { initInputListeners, toggleGyro }     from './InputManager.js';
import { initEngine }                         from './engine.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMG_SIZES           = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px';
const SHIMMER_STAGGER_MS  = 200;
const SHIMMER_STAGGER_CYCLE = 4;

// ---------------------------------------------------------------------------
// Shimmer observer — pauses off-screen CSS animations to save GPU
// ---------------------------------------------------------------------------

function initShimmerObserver() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(entry =>
            entry.target.classList.toggle('shimmer-paused', !entry.isIntersecting)
        ),
        { rootMargin: '50px', threshold: 0 }
    );
    document.querySelectorAll('.skeleton-img-container, .skeleton-text')
        .forEach(el => observer.observe(el));
}

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
// ImageLoader — custom lazy loader with priority queue and format fallback
// ---------------------------------------------------------------------------

const ImageLoader = (() => {
    const state = {
        loadingImages:      new Set(),
        loadedImages:       new Set(),
        scrollVelocity:     0,
        lastScrollY:        window.scrollY,
        lastScrollTime:     performance.now(),
        mouseX:             0,
        mouseY:             0,
        preloadRadius:      600,
        highPriorityQueue:  [],
        normalPriorityQueue: [],
        idleCallbackId:     null,
        pendingScrollRead:  false,
    };

    let shimmerObserverRef = null;

    const calculateScrollVelocity = () => {
        if (state.pendingScrollRead) return;
        state.pendingScrollRead = true;
        requestAnimationFrame(() => {
            const now          = performance.now();
            const currentScrollY = window.scrollY;
            const timeDelta    = now - state.lastScrollTime;
            const distanceDelta = Math.abs(currentScrollY - state.lastScrollY);
            state.scrollVelocity = timeDelta > 0 ? distanceDelta / timeDelta : 0;
            state.lastScrollY    = currentScrollY;
            state.lastScrollTime = now;
            state.pendingScrollRead = false;
        });
    };

    const getImagePriority = (rect) => {
        const vh = window.innerHeight;
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

    /**
     * Progressive format fallback: tries the next format in the fallback chain
     * if the previous attempt fails. Eliminates the need for imageOptimizer.js.
     *
     * @param {HTMLImageElement} img
     * @param {string[]}         fallbackUrls - Ordered [preferred, …, last-resort]
     * @param {number}           [attempt=0]
     */
    const loadImageWithFallback = (img, fallbackUrls, attempt = 0) => {
        if (attempt >= fallbackUrls.length) {
            // All formats exhausted — surface the broken state gracefully.
            img.style.opacity = '1';
            state.loadingImages.delete(img);
            return;
        }

        const url = fallbackUrls[attempt];
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = url;
            img.style.opacity = '1';
            state.loadingImages.delete(img);
            state.loadedImages.add(img);

            const container = img.closest('.img-container');
            if (container) {
                container.classList.remove('skeleton-img-container');
                shimmerObserverRef?.unobserve(container);
            }
        };

        tempImg.onerror = () => {
            // Try next format in chain
            loadImageWithFallback(img, fallbackUrls, attempt + 1);
        };

        tempImg.src = url;
    };

    const loadImage = img => {
        if (state.loadingImages.has(img) || state.loadedImages.has(img)) return;
        state.loadingImages.add(img);

        // Build the format fallback chain from data attributes set during card creation.
        // Order: AVIF → WebP → JPEG (most efficient to least).
        const fallbackChain = [
            img.dataset.srcAvif,
            img.dataset.srcWebp,
            img.dataset.src,      // JPEG / final fallback
        ].filter(Boolean);

        if (!fallbackChain.length) {
            state.loadingImages.delete(img);
            return;
        }

        // Also activate <source> elements for native <picture> negotiation.
        const picture = img.closest('picture');
        if (picture) {
            picture.querySelectorAll('source').forEach(source => {
                if (source.dataset.srcset) source.srcset = source.dataset.srcset;
            });
        }

        loadImageWithFallback(img, fallbackChain);
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
        const queue = priority === 'high' ? state.highPriorityQueue : state.normalPriorityQueue;
        if (!queue.includes(img)) queue.push(img);
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
                reads.forEach(({ img, isIntersecting, rect }) => {
                    if (!isIntersecting) return;
                    const nearMouse    = getMouseDistance(rect) < state.preloadRadius;
                    const priority     = getImagePriority(rect);
                    const finalPriority = (priority === 'high' || nearMouse) ? 'high' : 'normal';
                    scheduleImageLoad(img, finalPriority);
                });
            });
        }, { rootMargin: '400px', threshold: 0 });

        document.querySelectorAll('.main-img[data-src]').forEach(img => observer.observe(img));
    };

    const loadViewportImages = () => {
        const imgs  = Array.from(document.querySelectorAll('.main-img[data-src]'));
        const rects = imgs.map(img => img.getBoundingClientRect()); // batch read
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

/**
 * Build the <picture> + <img> inside an .img-container.
 * For the first card (LCP), load eagerly. All others use lazy + skeleton.
 *
 * @param {import('./data.js').CardData} card
 * @param {boolean}                     isFirstCard
 */
function createImageContainer(card, isFirstCard) {
    const { avif, webp, jpeg } = card.imageFormats;

    const container = document.createElement('div');
    container.className  = isFirstCard
        ? 'img-container'
        : 'img-container skeleton-img-container';
    container.setAttribute('aria-hidden', 'true');

    const picture = document.createElement('picture');
    picture.className = 'responsive-image';

    // <source> elements — browser picks best supported format natively.
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
    // Inline style consolidated — avoids repeated CSSOM property updates
    img.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' +
        'transition:opacity 0.4s cubic-bezier(0.23,1,0.32,1);';

    if (isFirstCard) {
        img.src = jpeg;
        img.setAttribute('fetchpriority', 'high');
        img.loading     = 'eager';
        img.decoding    = 'sync';
        img.style.opacity = '1';
    } else {
        // Store all format URLs as data attributes for the fallback chain.
        if (avif) img.dataset.srcAvif = avif;
        if (webp) img.dataset.srcWebp = webp;
        img.dataset.src   = jpeg;
        img.loading        = 'lazy';
        img.decoding       = 'async';
        img.style.opacity  = '0';
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

/**
 * Build a complete card <article> element.
 *
 * Accessibility fixes applied:
 *  - aria-labelledby instead of aria-label (avoids duplicating visible text).
 *  - <h2 id> used as the labelling element.
 *  - Removed redundant tabindex="0" on <a> (natively focusable).
 *  - Removed aria-label="Category" from badge <span>.
 *  - href uses a semantic slug URL, not '#'.
 *
 * @param {import('./data.js').CardData} card
 * @param {number}                       index
 */
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
    link.href      = `/gallery/${card.id}`;  // semantic placeholder; replace with real route
    link.className = 'card-link';
    link.setAttribute('rel', 'noopener noreferrer');

    const category = document.createElement('span');
    category.className   = 'category';
    category.textContent = card.badge;
    // No aria-label — the visible text IS the label.

    const title = document.createElement('h2');
    title.id        = titleId;
    title.className = 'title';
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
// UI wiring helpers (pure functions — no side effects until called)
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
    // Hide HUD gyro button on non-touch desktop devices
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
        // Re-trigger scroll handler so --bg-hue / --sh-color update immediately.
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
// Single deterministic entry point
// ---------------------------------------------------------------------------

function init() {
    const grid = document.getElementById('grid');

    // 1. Render all cards into the DOM in one DocumentFragment write.
    const fragment = document.createDocumentFragment();
    cardsData.forEach((card, i) => fragment.appendChild(createCardElement(card, i)));
    grid.appendChild(fragment);

    // 2. Initialise engine subsystems (after cards exist in the DOM).
    initInputListeners();
    initEngine();

    const shimmerObserver = (() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e =>
                e.target.classList.toggle('shimmer-paused', !e.isIntersecting)
            ),
            { rootMargin: '50px', threshold: 0 }
        );
        document.querySelectorAll('.skeleton-img-container, .skeleton-text')
            .forEach(el => obs.observe(el));
        return obs;
    })();

    ImageLoader.init(shimmerObserver);

    document.querySelectorAll('.card').forEach(initCardWillChange);

    // 3. Wire all UI controls.
    wireTogglePanel();
    wireGyroBtnVisibility();
    wireEnableMotionBtn();
    wireThemeButton();
}

// Guard against edge cases where the module loads after DOMContentLoaded fires.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
