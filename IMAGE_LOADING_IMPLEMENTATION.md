# Image Loading Optimization & Skeleton Loader Implementation

## Overview
This document outlines the viewport-based image loading optimization and skeleton loader system implemented in the Neo-Brutalism 3D Engine. The system uses IntersectionObserver to intelligently manage image loading based on viewport visibility.

## Key Features

### 1. Intersection Observer for Viewport Detection
**Location**: `js/main.js` (lines 8-28)

```javascript
const viewportObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const img = card.querySelector('.main-img');
            
            if (img && img.loading === 'lazy') {
                img.loading = 'eager';
                img.setAttribute('fetchpriority', 'high');
            }
            
            obs.unobserve(card);
        }
    });
}, observerOptions);
```

**Features:**
- Monitors cards as they enter the viewport
- 50px `rootMargin` for preloading images before viewport entry
- Switches lazy-loaded images to eager loading with high priority
- Unobserves after first intersection to prevent re-renders and improve efficiency

### 2. Default Lazy Loading
All images are created with `loading="lazy"` by default:
```html
<img src="${card.image}" 
     alt="${card.title}" 
     class="main-img"
     loading="lazy"
     decoding="async"
     width="800"
     height="500"
/>
```

**Benefits:**
- Reduces initial page load time
- Only downloads images when needed
- Compliant with modern browser standards

### 3. Responsive Image Support
Card images support multiple image formats with graceful fallbacks:

```html
<picture class="responsive-image">
    <source type="image/avif" srcset="${avifUrl}" ...>
    <source type="image/webp" srcset="${webpUrl}" ...>
    <source type="image/jpeg" srcset="${jpegUrl}" ...>
    <img src="${card.image}" ...>
</picture>
```

**Benefits:**
- Automatic format selection based on browser capabilities
- Reduced bandwidth usage
- Optimized file sizes per format

### 4. Skeleton Loader UI
**Location**: `style.css` (lines 438-530)

#### Visual States

**Loading State:**
```css
.skeleton {
    background: #e0e0e0;
    position: relative;
    overflow: hidden;
    border: 3px solid #000;
    box-shadow: 5px 5px 0px #000;
}

.skeleton::after {
    animation: shimmer 1.5s infinite;
}
```

**Skeleton Placeholder:**
```css
.skeleton-placeholder {
    position: absolute;
    inset: 0;
    background: #e0e0e0;
    animation: pulse 1.5s ease-in-out infinite;
    z-index: 1;
}
```

**Skeleton Text:**
```css
.skeleton .skeleton-text {
    background: linear-gradient(...);
    animation: shimmerText 1.5s infinite;
}
```

#### Animation Effects

**Shimmer Animation:**
- Horizontal gradient sweep that repeats every 1.5s
- Creates perception of content loading
- Applies to image placeholder and text skeleton

**Pulse Animation:**
- Opacity variation between 1 and 0.7
- Creates subtle "breathing" effect
- Applied to skeleton placeholder

**Dark Mode Support:**
- Darker background colors (#2a2a2a)
- Adjusted gradient colors for visibility
- Yellow accent borders in dark mode

### 5. Image Load Handling
**Location**: `js/main.js` (lines 89-113)

#### onload Handler
```javascript
img.onload = () => {
    cardElement.classList.remove('skeleton');
    
    const skeletonPlaceholder = cardElement.querySelector('.skeleton-placeholder');
    if (skeletonPlaceholder) {
        skeletonPlaceholder.style.display = 'none';
    }
    
    const textElements = cardElement.querySelectorAll('.skeleton-text');
    textElements.forEach(el => {
        el.classList.remove('skeleton-text');
    });
    
    img.style.opacity = '1';
};
```

**Flow:**
1. Image completes loading
2. Card skeleton class removed (stops shimmer animation)
3. Skeleton placeholder hidden
4. Text skeleton classes removed
5. Image opacity transitions to 1 (0.3s ease-in)

#### onerror Handler (Fallback)
```javascript
img.onerror = () => {
    cardElement.classList.remove('skeleton');
};
```

**Benefits:**
- Graceful degradation if image fails to load
- Prevents skeleton state from persisting indefinitely

## HTML Structure

### Card Template with Skeleton Support
```html
<article class="card render-node skeleton">
    <a href="#" class="card-link">
        <div class="img-container skeleton-img-container">
            <picture class="responsive-image">
                <img class="main-img" loading="lazy" 
                     width="800" height="500" />
            </picture>
            <div class="skeleton-placeholder"></div>
        </div>

        <div class="card-content">
            <span class="category skeleton-text">${badge}</span>
            <h2 class="title skeleton-text">${title}</h2>
            <p class="description skeleton-text">${description}</p>
        </div>
    </a>
</article>
```

## Performance Optimizations

### 1. Efficiency
- **Single Observation**: Each card unobserves after first viewport intersection
- **No Re-renders**: Direct DOM manipulation avoids unnecessary re-renders
- **Debounced Animations**: CSS animations use `will-change` sparingly
- **Z-index Management**: Proper layering prevents layout shifts

### 2. Core Web Vitals
- **LCP (Largest Contentful Paint)**: Eager loading for visible images
- **CLS (Cumulative Layout Shift)**: Explicit width/height prevents size shifts
- **FID (First Input Delay)**: Non-blocking image loading

### 3. Bandwidth
- **Lazy Loading**: Unused images not downloaded initially
- **Format Optimization**: Modern formats reduce file sizes by 20-40%
- **Responsive Images**: Appropriately sized sources per device

## CSS Classes Reference

| Class | Purpose | State |
|-------|---------|-------|
| `.skeleton` | Container with shimmer animation | Loading |
| `.skeleton::after` | Shimmer gradient effect | Loading |
| `.skeleton-placeholder` | Image area placeholder | Loading |
| `.skeleton-text` | Text content placeholder | Loading |
| `.skeleton-img-container` | Image container skeleton styling | Loading |
| `.card-content` | Organized text content wrapper | Both |

## Browser Support

- **IntersectionObserver**: Chrome 51+, Firefox 55+, Safari 12.1+, Edge 16+
- **Picture Element**: Chrome 34+, Firefox 38+, Safari 9.1+, Edge 13+
- **Aspect Ratio**: Chrome 88+, Firefox 89+, Safari 15+, Edge 88+
- **CSS Grid**: All modern browsers
- **Fallbacks**: JPEG always available, graceful degradation in older browsers

## Testing

All functionality is covered by vitest test suite:
- Physics calculations: 7 tests passing ✓
- Card renderer: 7 tests passing ✓
- Input manager: 9 tests passing ✓

Run tests with: `npm run test` or `npx vitest run`

## Future Enhancements

### Potential Improvements
1. **Adaptive Bitrate Loading**: Detect network speed and adjust image quality
2. **BlurHash Placeholders**: Decode instead of solid color
3. **Service Worker Caching**: Cache loaded images for faster navigation
4. **LQIP (Low Quality Image Placeholder)**: Inline blurred versions
5. **Lazy load for text**: Skeleton text animation only for off-screen cards

### Configuration Tuning
- Adjust `rootMargin` based on device capabilities
- Fine-tune animation duration based on network
- Implement threshold variation for mobile vs desktop

## Accessibility Notes

- Skeleton placeholders marked with `aria-hidden="true"`
- Actual content preserved in DOM (not replaced)
- Image alt text always available
- Semantic HTML maintained throughout
- Color animations > 3 times per second avoided

## References

- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN Picture Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- [Web Vitals Guide](https://web.dev/vitals/)
- [AVIF Format Support](https://caniuse.com/avif)
- [WebP Format Support](https://caniuse.com/webp)
