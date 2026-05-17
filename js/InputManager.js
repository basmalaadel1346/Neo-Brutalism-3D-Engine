export const GlobalState = {
    mouse: { x: 0, y: 0, vx: 0, vy: 0, active: false },
    scroll: { depth: 0, velocity: 0, lastY: typeof window !== 'undefined' ? window.scrollY : 0 },
    gyro: { beta: 0, gamma: 0, active: false },
    dirty: true,
    lastInteraction: typeof performance !== 'undefined' ? performance.now() : 0,
};

export const Weights = { local: 15, global: 3, gyro: 20, scroll: 0.1 };

const MAX_GYRO_TILT_DEG = 30;

const normalizeTilt = (value, limit) =>
    Math.max(-limit, Math.min(limit, value ?? 0)) / limit;

let _gyroChangeCallback = null;

export const onGyroChange = (callback) => {
    _gyroChangeCallback = callback;
};

let _scrollChangeCallback = null;

export const onScrollChange = (callback) => {
    _scrollChangeCallback = callback;
};

const gyroHandler = (e) => {
    GlobalState.gyro.beta  = normalizeTilt(e.beta,  MAX_GYRO_TILT_DEG);
    GlobalState.gyro.gamma = normalizeTilt(e.gamma, MAX_GYRO_TILT_DEG);
    GlobalState.dirty = true;
    GlobalState.lastInteraction = performance.now();
};

export function toggleGyro() {
    if (GlobalState.gyro.active) {
        window.removeEventListener('deviceorientation', gyroHandler);
        GlobalState.gyro.active = false;
        GlobalState.gyro.beta   = 0;
        GlobalState.gyro.gamma  = 0;
        GlobalState.dirty       = true;
        _gyroChangeCallback?.(false);
        return;
    }

    const enable = () => {
        window.addEventListener('deviceorientation', gyroHandler, { passive: true });
        GlobalState.gyro.active = true;
        GlobalState.dirty       = true;
        _gyroChangeCallback?.(true);
    };

    if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
        DeviceOrientationEvent.requestPermission()
            .then(s => { if (s === 'granted') enable(); })
            .catch(console.error);
    } else {
        enable();
    }
}

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

        const depth       = GlobalState.scroll.depth;
        const isDark      = document.body.classList.contains('dark');
        const hue         = (isDark ? 220 : 45) + depth * 100;
        const pulseSpread = Math.min(Math.abs(GlobalState.scroll.velocity) * 0.5, 30);

        _scrollChangeCallback?.({ hue, pulseSpread, isDark });
        wakeUp();
    }, { passive: true });

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