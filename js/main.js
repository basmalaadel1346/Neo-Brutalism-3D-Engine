import { cardsData } from './data.js';
import { initInputListeners, toggleGyro } from './InputManager.js';
import { initEngine } from './engine.js';

const grid = document.getElementById("grid");

grid.innerHTML = cardsData.map(c => `
<article class="card render-node" role="group" aria-label="${c.title}">
    <a href="#" class="card-link">
        <div class="img-container" aria-hidden="true">
            <img src="${c.image}" alt="${c.title}" loading="lazy">
        </div>
        <span class="category">${c.badge}</span>
        <h2 class="title">${c.title}</h2>
        <p class="description">${c.description}</p>
    </a>
</article>`).join('');

initInputListeners();
initEngine();


const gyroBtn = document.getElementById('gyro-btn');

if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    if (gyroBtn) gyroBtn.style.display = 'none';
}
document.getElementById('gyro-btn').onclick = function () { toggleGyro(this); };

document.getElementById('toggle-panel').onclick = () => {
    document.body.classList.toggle('panel-hidden');
};

document.getElementById('theme-btn').onclick = () => {
    document.body.classList.toggle('dark');
    window.dispatchEvent(new Event('scroll'));
};