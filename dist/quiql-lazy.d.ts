export interface QuiqlLazyConfig {
    /** Execute the `onload` callback even if the resource was already cached/loaded earlier. @default true */
    shouldRunIfLoaded: boolean;
    /** Scan existing `<script[src]>` and `<link[rel="stylesheet"]>` in the DOM on the first load call to prevent duplicate loading. @default false */
    scanExistingResources: boolean;
    /** Array of URL substrings to exclude when `scanExistingResources` is enabled (e.g. `['gtm.js', 'analytics']`). @default [] */
    ignoreOnScan: string[];
    /** Enable console warnings and logs for debugging. @default false */
    debug: boolean;
}

export type QuiqlLazyLoadOptions = Partial<QuiqlLazyConfig>;

export interface QuiqlLazyResourceAttrs {
    src?: string;
    href?: string;
    onload?: (event: Event | null) => void;
    onerror?: (event: Event | Error | null) => void;
    [key: string]: string | number | boolean | ((event: any) => void) | undefined | null;
}

export type QuiqlLazyTargets =
    | Element
    | NodeListOf<Element>
    | HTMLCollectionOf<Element>
    | Iterable<Element>
    | Element[]
    | null
    | undefined;

export type QuiqlLazyIntersectionCallback = (
    entries: IntersectionObserverEntry[],
    observer: IntersectionObserver
) => void;

export type QuiqlLazyActionCallback = (
    entry: IntersectionObserverEntry,
    observer: IntersectionObserver,
    entries: IntersectionObserverEntry[]
) => void;

export interface QuiqlLazyProcessOptions {
    shouldUnobserve?: boolean;
    shouldDisconnect?: boolean;
}

export interface QuiqlLazyMediaAttributes {
    /** @default 'data-src' */
    src?: string;
    /** @default 'data-srcset' */
    srcset?: string;
    /** @default 'data-bg' */
    bg?: string;
}

export interface QuiqlLazyMediaClasses {
    /** @default 'lazy' */
    lazy?: string;
    /** @default 'loading' */
    loading?: string;
    /** @default 'loaded' */
    loaded?: string;
    /** @default 'error' */
    error?: string;
}

export interface QuiqlLazyObserverSettings {
    /** Native `IntersectionObserver` options. @default { root: null, rootMargin: '200px 0px', threshold: 0 } */
    options?: IntersectionObserverInit;
    /** Specific elements to observe. */
    targets?: QuiqlLazyTargets;
    /** Custom intersection handler that overrides the default internal callback. */
    callback?: QuiqlLazyIntersectionCallback;
}

export interface QuiqlLazyMediaSettings extends QuiqlLazyObserverSettings {
    /** Custom data attributes used to store source URLs. */
    attributes?: QuiqlLazyMediaAttributes;
    /** CSS classes applied during element lifecycle states. */
    classes?: QuiqlLazyMediaClasses;
    /** Callback fired when an image or background finishes loading. */
    onLoad?: (target: Element) => void;
    /** Callback fired when an image or background fails to load. */
    onError?: (target: Element) => void;
}

export interface QuiqlLazyCustomSettings extends QuiqlLazyObserverSettings {
    /** Function executed once when any of the `targets` intersects the viewport. */
    load?: () => void;
}

export interface QuiqlLazyMediaResolvedConfig {
    options: IntersectionObserverInit;
    attributes: Required<QuiqlLazyMediaAttributes>;
    classes: Required<QuiqlLazyMediaClasses>;
    debug: boolean;
    onLoad?: (target: Element) => void;
    onError?: (target: Element) => void;
    targets?: QuiqlLazyTargets;
    callback?: QuiqlLazyIntersectionCallback;
}

declare class QuiqlLazyObserver {
    static defaults: {
        options: IntersectionObserverInit;
    };

    static lazyDefaults: {
        attributes: Required<QuiqlLazyMediaAttributes>;
        classes: Required<QuiqlLazyMediaClasses>;
    };

    constructor(settings?: QuiqlLazyObserverSettings & Record<string, any>);

    /** Starts observing new elements. If called without arguments on `LazyLoad`, re-scans the DOM for `.lazy` elements. */
    add(targets?: QuiqlLazyTargets): void;
    /** Stops observing specific elements. */
    remove(targets: QuiqlLazyTargets): void;
    /** Disconnects the observer and stops watching all elements. */
    clear(): void;
}

declare class QuiqlLazyLoad extends QuiqlLazyObserver {
    constructor(settings?: QuiqlLazyMediaSettings);
}

declare class QuiqlLazyCustomLoad extends QuiqlLazyObserver {
    constructor(settings?: QuiqlLazyCustomSettings);
}

declare class QuiqlLazy {
    /** Global library configuration. */
    static config: QuiqlLazyConfig;

    /** Resolves a relative URL against `window.location.href` into a full normalized URL. */
    static normalizeUrl(url: string): string;

    /** Core method for creating, caching, and injecting a DOM resource. */
    static loadResource<T extends keyof HTMLElementTagNameMap>(
        tag: T,
        attrs: QuiqlLazyResourceAttrs,
        options?: QuiqlLazyLoadOptions
    ): Promise<HTMLElementTagNameMap[T] | null>;
    static loadResource(
        tag: string,
        attrs: QuiqlLazyResourceAttrs,
        options?: QuiqlLazyLoadOptions
    ): Promise<HTMLElement | null>;

    /** Dynamically loads an external `<script>` (async by default) with request deduplication. */
    static loadScript(
        url: string,
        onload?: (event: Event | null) => void,
        options?: QuiqlLazyLoadOptions
    ): Promise<HTMLScriptElement | null>;

    /** Dynamically loads an external stylesheet (`<link rel="stylesheet">`) with request deduplication. */
    static loadStyle(
        url: string,
        onload?: (event: Event | null) => void,
        options?: QuiqlLazyLoadOptions
    ): Promise<HTMLLinkElement | null>;

    static Observer: typeof QuiqlLazyObserver;
    /** Lazy loader for `<img>` (`src`, `srcset`, `sizes`) and background images (`data-bg`). */
    static LazyLoad: typeof QuiqlLazyLoad;
    /** Viewport trigger for executing custom logic (widgets, scripts, analytics) on intersection. */
    static CustomLoad: typeof QuiqlLazyCustomLoad;

    static mediaCallback(
        config: QuiqlLazyMediaResolvedConfig
    ): (entry: IntersectionObserverEntry) => Promise<void>;

    static customCallback(load?: (() => void) | null): () => void;

    static processIntersection(
        action: QuiqlLazyActionCallback,
        options?: QuiqlLazyProcessOptions
    ): QuiqlLazyIntersectionCallback;

    /** Helper for custom `IntersectionObserver` callbacks. Runs `action` for every intersecting element and unobserves it by default. */
    static onEach(
        action: QuiqlLazyActionCallback,
        shouldUnobserve?: boolean
    ): QuiqlLazyIntersectionCallback;

    /** Helper for custom `IntersectionObserver` callbacks. Runs `action` on the first intersecting element and disconnects by default. */
    static onAny(
        action: QuiqlLazyActionCallback,
        shouldDisconnect?: boolean
    ): QuiqlLazyIntersectionCallback;
}

declare global {
    interface Window {
        QuiqlLazy: typeof QuiqlLazy;
    }
}

export = QuiqlLazy;
