export class ImageOptimizer {
    static generateSrcSet(baseUrl, format) {
        const sizes = [400, 600, 800, 1200, 1600];
        return sizes.map(size => `${baseUrl}-${size}w.${format} ${size}w`).join(', ');
    }

    static checkFormatSupport() {
        const canvas = document.createElement('canvas');
        return {
            webp: this.canvasSupports(canvas, 'image/webp'),
            avif: this.canvasSupports(canvas, 'image/avif'),
            jpeg: true,
        };
    }

    static canvasSupports(canvas, mimeType) {
        try {
            return canvas.toDataURL(mimeType).indexOf(mimeType.split('/')[1]) === 5;
        } catch (e) {
            return false;
        }
    }

    static getOptimizedImageUrl(baseUrl) {
        const support = this.checkFormatSupport();
        if (support.avif) return `${baseUrl}.avif`;
        if (support.webp) return `${baseUrl}.webp`;
        return `${baseUrl}.jpg`;
    }

    static initializeAllImages() {
        document.querySelectorAll('picture').forEach(picture => {
            const img = picture.querySelector('img');
            if (img) {
                img.addEventListener('error', () => {
                    ImageOptimizer.handleImageError(img);
                });
            }
        });
    }

    static handleImageError(img) {
        const fallbackUrl = img.dataset.fallback || '/images/placeholder.jpg';
        if (img.src !== fallbackUrl) {
            img.src = fallbackUrl;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImageOptimizer.initializeAllImages();
    });
} else {
    ImageOptimizer.initializeAllImages();
}
