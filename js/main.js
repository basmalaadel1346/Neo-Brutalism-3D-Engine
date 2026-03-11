import { cardsData } from './data.js';
import { initInputListeners, toggleGyro } from './InputManager.js';
import { initEngine } from './engine.js';

const grid = document.getElementById("grid");

/**
 * Generate HTML for card images with responsive format support
 * @param {Object} card - Card data object
 * @returns {string} HTML for image with picture element
 */
function generateResponsiveImageHTML(card) {
    const imageFormats = card.imageFormats || {};
    const avifUrl = imageFormats.avif || card.image;
    const webpUrl = imageFormats.webp || card.image;
    const jpegUrl = imageFormats.jpeg || card.image;

    return `
        <div class="img-container" aria-hidden="true">
            <picture class="responsive-image">
                ${imageFormats.avif ? `<source type="image/avif" srcset="${avifUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                ${imageFormats.webp ? `<source type="image/webp" srcset="${webpUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">` : ''}
                <source type="image/jpeg" srcset="${jpegUrl}" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px">
                <img 
                    src="${card.image}" 
                    alt="${card.title}" 
                    class="main-img"
                    loading="lazy"
                    decoding="async"
                    width="800"
                    height="500"
                >
            </picture>
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

initInputListeners();
initEngine();

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
