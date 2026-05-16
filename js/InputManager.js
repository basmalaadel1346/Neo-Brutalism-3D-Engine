/**
 * InputManager.js
 * ---------------
 * Single source of truth for ALL user input:
 *   - Global mouse position / velocity
 *   - Scroll depth / velocity
 *   - Device gyroscope (previously split across Gyroscope.js — now deleted)
 *   - Physics weight sliders
 *
 * Gyroscope.js has been deleted. All device-motion logic lives here.
 */

// ---------------------------------------------------------------------------
// Shared state — consumed by CardRenderer and engine loop
// ---------------------------------------------------------------------------

export const GlobalState = {
    mouse: { x: 0, y: 0, vx: 0, vy: 0, active: false },
    scroll: { depth: 0, velocity: 0, lastY: typeof window !== 'undefined' ? window.scrollY : 0 },
    /** beta/gamma normalized to [-1, 1] within ±30° of device tilt */
    gyro: { beta: 0, gamma: 0, active: false },
    dirty: true,
    lastInteraction: typeof performance !== 'undefined' ? performance.now() : 0,
};

export const Weights = { local: 15, global: 3, gyro: 20, scroll: 0.1 };

// ---------------------------------------------------------------------------
// Gyroscope — private handler, exported toggle
// ---------------------------------------------------------------------------

/** Maximum tilt angle (degrees) that maps to a normalized value of 1. */
const MAX_GYRO_TILT_DEG = 30;

/** Clamp `value` to [−limit, +limit] then normalize to [−1, 1]. */
const normalizeTilt = (value, limit) =>
    Math.max(-limit, Math.min(limit, value ?? 0)) / limit;

const gyroHandler = (e) => {
    GlobalState.gyro.beta  = normalizeTilt(e.beta,  MAX_GYRO_TILT_DEG);
    GlobalState.gyro.gamma = normalizeTilt(e.gamma, MAX_GYRO_TILT_DEG);
    GlobalState.dirty = true;
    GlobalState.lastInteraction = performance.now();
};

/**
 * Sync UI for both gyro buttons (#gyro-btn HUD and #enable-motion panel).
 * @param {boolean} isActive
 */
function syncGyroButtonUI(isActive) {
    const gyroBtn       = document.getElementById('gyro-btn');
    const enableMotionBtn = document.getElementById('enable-motion');

    if (gyroBtn) {
        gyroBtn.textContent = isActive ? '📴 Motion: ON' : '📱 Motion: OFF';
        gyroBtn.setAttribute('aria-pressed', String(isActive));
    }
    if (enableMotionBtn) {
        enableMotionBtn.textContent = isActive ? '✅ الحساسات تعمل' : '📱 تفعيل حساسات الحركة';
        enableMotionBtn.disabled = isActive;
    }
}

/**
 * Toggle device-orientation sensor on/off.
 * Called by both the HUD #gyro-btn and the panel #enable-motion button.
 */
export function toggleGyro() {
    if (GlobalState.gyro.active) {
        window.removeEventListener('deviceorientation', gyroHandler);
        GlobalState.gyro.active = false;
        GlobalState.gyro.beta   = 0;
        GlobalState.gyro.gamma  = 0;
        GlobalState.dirty       = true;
        syncGyroButtonUI(false);
        return;
    }

    const enable = () => {
        window.addEventListener('deviceorientation', gyroHandler, { passive: true });
        GlobalState.gyro.active = true;
        GlobalState.dirty       = true;
        syncGyroButtonUI(true);
    };

    // iOS 13+ requires an explicit permission request.
    if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
        DeviceOrientationEvent.requestPermission()
            .then(state => { if (state === 'granted') enable(); })
            .catch(console.error);
    } else {
        enable();
    }
}

// ---------------------------------------------------------------------------
// Mouse / Scroll listeners
// ---------------------------------------------------------------------------

export function initInputListeners() {
    let lastX = 0, lastY = 0;

    const wakeUp = () => {
        GlobalState.dirty = true;
        GlobalState.lastInteraction = performance.now();
    };

    window.addEventListener('mousemove', e => {
        GlobalState.mouse.x  = (e.clientX / window.innerWidth)  * 2 - 1;
        GlobalState.mouse.y  = (e.clientY / window.innerHeight) * 2 - 1;
        GlobalState.mouse.vx = e.clientX - lastX;
        GlobalState.mouse.vy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        GlobalState.mouse.active = true;
        wakeUp();
    }, { passive: true });

    window.addEventListener('scroll', () => {
        const curY = window.scrollY;
        GlobalState.scroll.velocity = curY - GlobalState.scroll.lastY;
        GlobalState.scroll.lastY    = curY;
        GlobalState.scroll.depth    = curY / Math.max(1, document.body.scrollHeight - window.innerHeight);

        const depth   = GlobalState.scroll.depth;
        const isDark  = document.body.classList.contains('dark');
        const hue     = (isDark ? 220 : 45) + depth * 100;

        document.documentElement.style.setProperty('--bg-hue', hue);
        document.documentElement.style.setProperty(
            '--pulse-spread',
            `${Math.min(Math.abs(GlobalState.scroll.velocity) * 0.5, 30)}px`
        );
        document.documentElement.style.setProperty(
            '--sh-color',
            isDark ? `hsl(${hue}, 80%, 60%)` : 'black'
        );
        wakeUp();
    }, { passive: true });

    // ---------------------------------------------------------------------------
    // Physics weight sliders
    // ---------------------------------------------------------------------------

    /**
     * @param {string} inputId
     * @param {string} outputId
     * @param {keyof typeof Weights} weightKey
     */
    const initRangeInput = (inputId, outputId, weightKey) => {
        const input  = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        if (!input) return;

        input.addEventListener('input', e => {
            const value = +e.target.value;
            Weights[weightKey] = value;
            if (output) output.textContent = value.toFixed(2);
            wakeUp();
        });

        if (output) output.textContent = input.value;
    };

    initRangeInput('w-local',  'w-local-value',  'local');
    initRangeInput('w-global', 'w-global-value', 'global');
    initRangeInput('w-gyro',   'w-gyro-value',   'gyro');
    initRangeInput('w-scroll', 'w-scroll-value', 'scroll');
}