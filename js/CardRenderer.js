export class RenderNode {
    static sharedObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            if (entry.target._renderNode) entry.target._renderNode.updateRect();
        });
    });

    constructor(el, globalState, weights) {
        this.el = el;
        this.globalState = globalState;
        this.weights = weights;

        this.rect = null;
        this.cx = 0; this.cy = 0;
        this.localMouse = { x: 0, y: 0, active: false };
        this.current = { rx: 0, ry: 0, sc: 1 };
        this.velocity = { rx: 0, ry: 0, sc: 0 };
        this.dirty = true;

        this.el._renderNode = this;
        RenderNode.sharedObserver.observe(this.el);
        this.initEvents();
    }

    updateRect() {
        this.rect = this.el.getBoundingClientRect();
        this.cx = this.rect.left + this.rect.width / 2;
        this.cy = this.rect.top + this.rect.height / 2;
        this.dirty = true;
    }

    initEvents() {
        const updateMousePos = (clientX, clientY) => {
            if (!this.rect) this.updateRect();
            this.localMouse.x = ((clientX - this.rect.left) / this.rect.width) * 2 - 1;
            this.localMouse.y = ((clientY - this.rect.top) / this.rect.height) * 2 - 1;
            this.dirty = true;
        };

        this.el.addEventListener("mouseenter", () => { this.localMouse.active = true; this.dirty = true; });
        this.el.addEventListener("mouseleave", () => { this.localMouse.active = false; this.dirty = true; });
        this.el.addEventListener("mousemove", e => updateMousePos(e.clientX, e.clientY));
    }

    update() {
        const isSettled = Math.abs(this.velocity.rx) < 0.01 && Math.abs(this.velocity.ry) < 0.01;
        if (!this.dirty && isSettled && !this.globalState.dirty) return;

        let tx = 0, ty = 0;

        if (this.localMouse.active) {
            tx = -this.localMouse.y * this.weights.local;
            ty = this.localMouse.x * this.weights.local;

            const lx = (this.localMouse.x + 1) * 50;
            const ly = (this.localMouse.y + 1) * 50;
            this.el.style.setProperty("--light-x", `${lx}%`);
            this.el.style.setProperty("--light-y", `${ly}%`);
        } else if (this.globalState.mouse.active) {
            tx = -this.globalState.mouse.y * this.weights.global;
            ty = this.globalState.mouse.x * this.weights.global;
        }

        if (this.localMouse.active) {
            tx += this.globalState.mouse.vy * 0.02;
            ty += this.globalState.mouse.vx * 0.02;
        }

        const targetScale = this.localMouse.active ? 1.03 : 1;
        const spring = 0.08, friction = 0.85;

        this.velocity.rx += (tx - this.current.rx) * spring;
        this.velocity.ry += (ty - this.current.ry) * spring;
        this.velocity.sc += (targetScale - this.current.sc) * spring;

        this.velocity.rx *= friction;
        this.velocity.ry *= friction;
        this.velocity.sc *= friction;

        this.current.rx += this.velocity.rx;
        this.current.ry += this.velocity.ry;
        this.current.sc += this.velocity.sc;

        this.el.style.setProperty('--rx', `${this.current.rx.toFixed(2)}deg`);
        this.el.style.setProperty('--ry', `${this.current.ry.toFixed(2)}deg`);
        this.el.style.setProperty('--scale', this.current.sc.toFixed(3));

        if (isSettled && !this.localMouse.active) this.dirty = false;
    }
}