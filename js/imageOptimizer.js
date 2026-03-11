/**
 * Image Optimizer - Handles responsive images with multiple format support
 * Supports WebP, AVIF, and JPEG fallback formats
 */

export class ImageOptimizer {
  /**
   * Generate responsive image HTML with multiple formats
   * @param {string} baseUrl - Base URL without extension
   * @param {string} altText - Alternative text for accessibility
   * @param {Object} options - Configuration options
   * @returns {string} HTML picture element
   */
  static generateResponsiveImage(baseUrl, altText, options = {}) {
    const {
      sizes = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px',
      className = 'responsive-image',
      loading = 'lazy'
    } = options;

    const srcsetWebP = this.generateSrcSet(baseUrl, 'webp');
    const srcsetAvif = this.generateSrcSet(baseUrl, 'avif');
    const srcsetJpeg = this.generateSrcSet(baseUrl, 'jpg');

    return `
      <picture class="${className}">
        <source type="image/avif" srcset="${srcsetAvif}" sizes="${sizes}">
        <source type="image/webp" srcset="${srcsetWebP}" sizes="${sizes}">
        <source type="image/jpeg" srcset="${srcsetJpeg}" sizes="${sizes}">
        <img 
          src="${baseUrl}.jpg" 
          alt="${altText}" 
          loading="${loading}"
          sizes="${sizes}"
          decoding="async"
          width="800"
          height="500"
        >
      </picture>
    `;
  }

  /**
   * Generate srcset string for specified format
   * @param {string} baseUrl - Base URL without extension
   * @param {string} format - Image format (jpg, webp, avif)
   * @returns {string} srcset string
   */
  static generateSrcSet(baseUrl, format) {
    const sizes = [400, 600, 800, 1200, 1600];
    return sizes
      .map(size => `${baseUrl}-${size}w.${format} ${size}w`)
      .join(', ');
  }

  /**
   * Check browser support for modern image formats
   * @returns {Object} Support status for each format
   */
  static checkFormatSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    return {
      webp: this.canvasSupports(canvas, 'image/webp'),
      avif: this.canvasSupports(canvas, 'image/avif'),
      jpeg: true, // JPEG is universally supported
    };
  }

  /**
   * Test if canvas supports specific image format
   * @private
   * @param {HTMLCanvasElement} canvas
   * @param {string} mimeType
   * @returns {boolean}
   */
  static canvasSupports(canvas, mimeType) {
    try {
      return canvas.toDataURL(mimeType).indexOf(mimeType.split('/')[1]) === 5;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get optimized image URL based on browser support
   * @param {string} baseUrl - Base URL without extension
   * @returns {string} Optimized image URL
   */
  static getOptimizedImageUrl(baseUrl) {
    const support = this.checkFormatSupport();
    
    if (support.avif) return `${baseUrl}.avif`;
    if (support.webp) return `${baseUrl}.webp`;
    return `${baseUrl}.jpg`;
  }

  /**
   * Initialize image optimization for all picture elements
   * Adds fallback support and logs format information
   */
  static initializeAllImages() {
    const support = this.checkFormatSupport();
    
    // Log format support for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Image Format Support:', {
        avif: support.avif ? '✓' : '✗',
        webp: support.webp ? '✓' : '✗',
        jpeg: support.jpeg ? '✓' : '✗'
      });
    }

    // Add error handling for picture elements
    document.querySelectorAll('picture').forEach(picture => {
      const img = picture.querySelector('img');
      if (img) {
        img.addEventListener('error', () => {
          ImageOptimizer.handleImageError(img);
        });
      }
    });
  }

  /**
   * Handle image loading errors with fallback
   * @private
   * @param {HTMLImageElement} img
   */
  static handleImageError(img) {
    const fallbackUrl = img.dataset.fallback || '/images/placeholder.jpg';
    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ImageOptimizer.initializeAllImages();
  });
} else {
  ImageOptimizer.initializeAllImages();
}
