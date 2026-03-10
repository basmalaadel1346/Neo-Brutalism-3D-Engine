export const GlobalState = {
    mouse: { x: 0, y: 0, vx: 0, vy: 0, active: false },
    scroll: { depth: 0, velocity: 0, lastY: window.scrollY },
    gyro: { beta: 0, gamma: 0, active: false },
    dirty: true,
    lastInteraction: performance.now()
};

export const Weights = { local: 15, global: 3, gyro: 20, scroll: 0.1 };

export function initInputListeners() {
    let lastX = 0, lastY = 0;

    const wakeUp = () => {
        GlobalState.dirty = true;
        GlobalState.lastInteraction = performance.now();
    };

    window.addEventListener("mousemove", e => {
        GlobalState.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        GlobalState.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        GlobalState.mouse.vx = e.clientX - lastX;
        GlobalState.mouse.vy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        GlobalState.mouse.active = true;
        wakeUp();
    });

    window.addEventListener("scroll", () => {
        const curY = window.scrollY;
        GlobalState.scroll.velocity = curY - GlobalState.scroll.lastY;
        GlobalState.scroll.lastY = curY;
        const depth = curY / Math.max(1, document.body.scrollHeight - window.innerHeight);
        GlobalState.scroll.depth = depth;

        const isDark = document.body.classList.contains("dark");
        const hue = (isDark ? 220 : 45) + (depth * 100);
        document.documentElement.style.setProperty('--bg-hue', hue);
        document.documentElement.style.setProperty('--pulse-spread', `${Math.min(Math.abs(GlobalState.scroll.velocity) * 0.5, 30)}px`);
        document.documentElement.style.setProperty('--sh-color', isDark ? `hsl(${hue}, 80%, 60%)` : `black`);
        wakeUp();
    }, { passive: true });

    document.getElementById('w-local').oninput = e => { Weights.local = +e.target.value; wakeUp(); };
    document.getElementById('w-global').oninput = e => { Weights.global = +e.target.value; wakeUp(); };
    document.getElementById('w-gyro').oninput = e => { Weights.gyro = +e.target.value; wakeUp(); };
    document.getElementById('w-scroll').oninput = e => { Weights.scroll = +e.target.value; wakeUp(); };
}

const gyroHandler = (e) => {
    GlobalState.gyro.beta = (Math.max(-90, Math.min(90, e.beta)) / 90) - 0.5;
    GlobalState.gyro.gamma = Math.max(-90, Math.min(90, e.gamma)) / 90;
    GlobalState.dirty = true;
    GlobalState.lastInteraction = performance.now();
};

export function toggleGyro(btn) {
    if (GlobalState.gyro.active) {
        window.removeEventListener('deviceorientation', gyroHandler);
        GlobalState.gyro.active = false;

        GlobalState.gyro.beta = 0;
        GlobalState.gyro.gamma = 0;
        GlobalState.dirty = true;

        btn.textContent = "📱 Motion: OFF";
    } else {
        const enable = () => {
            window.addEventListener('deviceorientation', gyroHandler);
            GlobalState.gyro.active = true;
            btn.textContent = "📴 Motion: ON";
        };

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(s => {
                if (s === 'granted') enable();
            }).catch(console.error);
        } else {
            enable();
        }
    }
}