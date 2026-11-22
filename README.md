<div align="center">
  <img src="https://raw.githubusercontent.com/quiql/lazy/main/logo.png" alt="Quiql Logo" width="84" />
  <h1>Quiql Lazy</h1>
  <p><em>Quick eQuals Quality</em></p>
  <p>
    <a href="https://github.com/quiql/lazy/blob/main/LICENSE">
      <img src="https://shields.io/badge/license-MIT-00cc66?style=flat-square" alt="License: MIT" />
    </a>
  </p>
</div>

**Quiql Lazy** is an ultra-lightweight, zero-dependency JavaScript library for lazy loading media (`<img>`, background images) and dynamically loading external resources (`<script>`, `<link>`, etc.) with built-in **request deduplication**, **DOM caching**, and `IntersectionObserver` support — engineered for **Core Web Vitals** and **Green IT**.

## Features

* **Media Lazy Loading (`LazyLoad`)**: Out-of-the-box support for `<img>` (`src`, `srcset`, `sizes`) and background images (`data-bg`) with automatic state CSS classes (`lazy`, `loading`, `loaded`, `error`).
* **Custom Viewport Triggers (`CustomLoad`)**: Execute any custom logic (analytics, animations, third-party widgets) when elements enter the viewport.
* **Resource Loader (`loadScript`, `loadStyle`, `loadResource`)**: Dynamically inject scripts, stylesheets, or any HTML tags into the DOM with Promise support.
* **Request Deduplication & Caching**: Prevents duplicate network requests if the same resource is requested multiple times simultaneously or sequentially.
* **Existing DOM Scanner**: Optionally scans already loaded `<script>` and `<link>` tags on the page to avoid reloading them.
* **SSR Safe & Fallback Ready**: Safely runs in Node.js/SSR environments and gracefully falls back in legacy browsers without `IntersectionObserver`.

## Green IT & Performance Impact (Honest Benchmark)

Pure lazy loading does not eliminate data transfer if a user scrolls through the entire page — in that case, network and CPU usage are simply shifted over time to keep the initial load fast and responsive.

**Real energy and traffic savings come from two sources:**
1. **Partial Scrolls & Early Bounces:** Web analytics consistently show that a large share of visitors bounce early, navigate away from the top viewport, or scroll only halfway down. Every image or interactive widget (such as a slider, map, or video embed) below the fold that never enters the viewport is **never downloaded, never decoded, and never parsed by the browser's Main Thread**.
2. **Eliminating Duplicate Resource Fetches:** Even when a user scrolls 100% of the page, independent components (such as multiple forms loading reCAPTCHA, map embeds, or slider libraries) often trigger redundant script requests. Built-in Promise caching and DOM scanning guarantee each external asset is downloaded **strictly once**.

### 📊 Conservative Case Study (1,000,000 Page Views / Day)
Consider a modern, optimized website (using WebP images and Brotli/Gzip compression) with ~600 KB of below-the-fold assets. If incomplete scrolls, early navigations, and request deduplication prevent fetching just **300 KB per visit on average** (e.g., 5 unviewed WebP images at ~45 KB each + 1 deferred or deduplicated gzipped script at ~75 KB):

* **109.5 Terabytes** of unnecessary network traffic saved per year.
* **17,558 kWh of electricity** saved (enough to power an average residential apartment for **~7.5 years**).
* **7,741 kg of CO₂ emissions** prevented (equivalent to the annual carbon offset of **~350 mature trees**).
* **Lower Main Thread Execution Cost:** Deferring or deduplicating a single 75 KB gzipped script avoids parsing and compiling ~250–300 KB of raw JavaScript in V8, preserving mobile battery life and **INP** responsiveness.

## Installation

### Via NPM / Yarn

```bash
npm install @quiql/lazy
```

```javascript
// ES Modules
import QuiqlLazy from '@quiql/lazy';

// CommonJS
const QuiqlLazy = require('@quiql/lazy');
```

### Via `<script>` tag (or CDN)
```html
<!-- Local file -->
<script src="path/to/quiql-lazy.min.js"></script>

<!-- Or via jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/@quiql/lazy@1.0.0/dist/quiql-lazy.min.js"></script>

<script>
    // Available globally as window.QuiqlLazy
</script>
```

## Demo

Check out the [`demo/`](https://github.com/quiql/lazy/tree/main/demo) directory for complete working examples:
* [`demo/index.html`](https://github.com/quiql/lazy/blob/main/demo/index.html) — HTML markup examples for lazy images, responsive `srcset`, background images, and custom trigger blocks.
* [`demo/style.css`](https://github.com/quiql/lazy/blob/main/demo/style.css) — CSS transitions and visual state styles (`.lazy`, `.loading`, `.loaded`, `.error`).
* [`demo/script.js`](https://github.com/quiql/lazy/blob/main/demo/script.js) — JavaScript initialization examples for `LazyLoad`, `CustomLoad`, and dynamic resource loading.

## Quick Start

### 1. Lazy Loading Media (`QuiqlLazy.LazyLoad`)

Add the `lazy` class and `data-src` (or `data-bg`) attribute to your elements:

```html
<!-- Standard image -->
<img class="lazy" data-src="image.jpg" alt="Lazy image" />

<!-- With inline placeholder (optional, for strict W3C validation & search bots;
     avoids extra HTTP requests) -->
<img 
    class="lazy" 
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
    data-src="image.jpg" 
    width="800" 
    height="600" 
    alt="Lazy image" 
/>

<!-- Responsive image -->
<img 
    class="lazy" 
    data-src="image-800.jpg" 
    data-srcset="image-400.jpg 400w, image-800.jpg 800w" 
    sizes="(max-width: 600px) 400px, 800px" 
    alt="Responsive lazy image" 
/>

<!-- Background image -->
<div class="lazy" data-bg="hero-background.jpg"></div>
```

Initialize `LazyLoad` in your JavaScript:

```javascript
const lazyMedia = new QuiqlLazy.LazyLoad({
    options: {
        rootMargin: '200px 0px',
        threshold: 0
    },
    onLoad: (target) => {
        console.log('Loaded:', target);
    },
    onError: (target) => {
        console.error('Failed to load:', target);
    }
});
```

### 2. Custom Viewport Triggers (`QuiqlLazy.CustomLoad`)

Trigger any custom JavaScript function when specific elements appear in the viewport. For UI widgets like sliders, loading CSS before JS ensures styles are applied before layout calculations run:

```javascript
const sliders = document.querySelectorAll('.swiper');

if (sliders.length) {
    const loadSwiper = async () => {
        // Load CSS first so layout styles are ready before JS initializes
        await QuiqlLazy.loadStyle('/css/swiper-bundle.min.css', () => {
            console.log('Swiper CSS loaded!');
        });

        await QuiqlLazy.loadScript('/js/swiper-bundle.min.js', () => {
            console.log('Swiper JS loaded!');
        });

        new Swiper('.swiper', {
            loop: true,
            pagination: { el: '.swiper-pagination' }
        });
    };

    new QuiqlLazy.CustomLoad({
        targets: sliders,
        options: {
            rootMargin: '30%',
            threshold: 0
        },
        load: loadSwiper
    });
}
```

### 3. Dynamic Resource Loading

Load scripts, stylesheets, or custom HTML elements on demand:

```javascript
// Load a script (async by default)
await QuiqlLazy.loadScript('/js/analytics.js', (event) => {
    console.log('Analytics script loaded');
});

// Load a stylesheet
await QuiqlLazy.loadStyle('/css/theme.css');

// Load any custom tag with attributes
await QuiqlLazy.loadResource('script', {
    src: '/js/app.js',
    type: 'module',
    defer: true,
    'data-user-id': '12345'
});
```

## API Reference & Parameters

### Global Configuration (`QuiqlLazy.config`)

You can modify global behavior before calling resource loading methods:

```javascript
QuiqlLazy.config = {
    shouldRunIfLoaded: true,
    scanExistingResources: false,
    ignoreOnScan: [],
    debug: false
};
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `shouldRunIfLoaded` | `boolean` | `true` | If `true`, executes the `onload` callback even if the resource was already cached/loaded earlier. |
| `scanExistingResources` | `boolean` | `false` | Scans existing `<script[src]>` and `<link[rel="stylesheet"]>` in the DOM on the first load call to prevent duplicate loading. |
| `ignoreOnScan` | `string[]` | `[]` | Array of URL substrings to exclude when `scanExistingResources` is enabled (e.g., `['gtm.js', 'analytics']`). |
| `debug` | `boolean` | `false` | Enables console warnings and logs for debugging. |

---

### `QuiqlLazy.LazyLoad` Options

Pass a settings object to `new QuiqlLazy.LazyLoad(settings)`:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `targets` | `Element \| NodeList \| Array \| Iterable` | `null` | Specific elements to observe. If omitted, automatically queries `.lazy[data-src], .lazy[data-bg]`. |
| `options` | `IntersectionObserverInit` | `{ root: null, rootMargin: '200px 0px', threshold: 0 }` | Native `IntersectionObserver` options. |
| `attributes` | `object` | `{ src: 'data-src', srcset: 'data-srcset', bg: 'data-bg' }` | Custom data attributes used to store source URLs. |
| `classes` | `object` | `{ lazy: 'lazy', loading: 'loading', loaded: 'loaded', error: 'error' }` | CSS classes applied during element lifecycle states. |
| `onLoad` | `(target: Element) => void` | `undefined` | Callback fired when an image or background finishes loading. |
| `onError` | `(target: Element) => void` | `undefined` | Callback fired when an image or background fails to load. |
| `callback` | `(entries, observer) => void` | `undefined` | Overrides the default internal intersection handler completely. |

---

### `QuiqlLazy.CustomLoad` Options

Pass a settings object to `new QuiqlLazy.CustomLoad(settings)`:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `targets` | `Element \| NodeList \| Array \| Iterable` | `null` | **Required.** Elements that trigger the `load` function upon entering the viewport. |
| `load` | `() => void` | `null` | Function executed once when any of the `targets` intersects the viewport. |
| `options` | `IntersectionObserverInit` | `{ root: null, rootMargin: '200px 0px', threshold: 0 }` | Native `IntersectionObserver` options. |
| `callback` | `(entries, observer) => void` | `undefined` | Overrides the default `onAny` intersection handler. |

---

### Observer Instance Methods

Both `LazyLoad` and `CustomLoad` inherit from `QuiqlLazy.Observer` and share these methods:

* **`instance.add(targets)`**: Starts observing new elements (useful after dynamically adding content via AJAX/fetch). If called without arguments on `LazyLoad`, re-scans the DOM for `.lazy` elements.
* **`instance.remove(targets)`**: Stops observing specific elements.
* **`instance.clear()`**: Disconnects the observer and stops watching all elements.

---

### Static Methods & Helpers

* **`QuiqlLazy.loadResource(tag, attrs, options)`**: Core method for creating and injecting a DOM resource. Returns a `Promise<HTMLElement | null>`. `options` accepts temporary overrides for `QuiqlLazy.config`.
* **`QuiqlLazy.loadScript(url, onload, options)`**: Shortcut for `loadResource('script', { src: url, async: true, onload }, options)`.
* **`QuiqlLazy.loadStyle(url, onload, options)`**: Shortcut for `loadResource('link', { href: url, rel: 'stylesheet', onload }, options)`.
* **`QuiqlLazy.normalizeUrl(url)`**: Resolves a relative URL against `window.location.href` into a full normalized URL.
* **`QuiqlLazy.onEach(action, shouldUnobserve = true)`**: Helper for custom `IntersectionObserver` callbacks. Runs `action(entry, observer, entries)` for every intersecting element and unobserves it by default.
* **`QuiqlLazy.onAny(action, shouldDisconnect = true)`**: Helper for custom `IntersectionObserver` callbacks. Runs `action(entry, observer, entries)` on the first intersecting element and disconnects the observer by default.

## Advanced Recipes

### Loading Resources with Automatic Retries

To keep the core library minimal and lightweight, automatic network retry logic is not built in. Because `QuiqlLazy` automatically removes failed resources from its cache, you can easily wrap `loadScript` or `loadResource` in a retry helper:

```javascript
async function loadWithRetry(url, retries = 3, delay = 1000) {
    try {
        return await QuiqlLazy.loadScript(url);
    } catch (error) {
        if (retries <= 0) {
            throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));

        return loadWithRetry(url, retries - 1, delay);
    }
}

// Usage example:
(async () => {
    try {
        const script = await loadWithRetry('https://example.com/widget.js', 3, 1000);
        console.log('Script loaded successfully:', script);
    } catch (error) {
        console.error('Failed to load script after multiple attempts:', error);
    }
})();
```

### Native Browser `loading="lazy"` with Fallback

To keep the core focused on `IntersectionObserver` and resource loading, native `loading="lazy"` handling is not included by default. If you prefer native browser lazy loading for `<img>` elements with an automatic fallback to `QuiqlLazy.LazyLoad` for older browsers, you can add this helper:

```javascript
function initNativeLazy(targets = '.lazy[data-src]') {
    if (typeof window === 'undefined') return;

    const elements = typeof targets === 'string'
        ? document.querySelectorAll(targets)
        : targets instanceof Element ? [targets] : Array.from(targets || []);

    // Fallback to QuiqlLazy.LazyLoad if native lazy loading is not supported
    if (!('loading' in HTMLImageElement.prototype)) {
        return new QuiqlLazy.LazyLoad({ targets: elements });
    }

    const { classes, attributes } = QuiqlLazy.Observer.lazyDefaults;

    const onFinish = (event) => {
        const el = event.currentTarget;

        el.removeEventListener('load', onFinish);
        el.removeEventListener('error', onFinish);
        el.classList.replace(
            classes.loading,
            event.type === 'load' ? classes.loaded : classes.error
        );
    };

    for (const el of elements) {
        if (!(el instanceof HTMLImageElement)) continue;

        el.classList.replace(classes.lazy, classes.loading);

        el.addEventListener('load', onFinish);
        el.addEventListener('error', onFinish);

        el.loading = 'lazy';

        const srcset = el.getAttribute(attributes.srcset);
        if (srcset) {
            el.srcset = srcset;
            el.removeAttribute(attributes.srcset);
        }

        const src = el.getAttribute(attributes.src);
        if (src) {
            el.src = src;
            el.removeAttribute(attributes.src);
        }
    }
}

// Usage example:
initNativeLazy('.lazy[data-src]');
```

---

🧬 **Quiql Ecosystem 2026** — *Quick eQuals Quality*
