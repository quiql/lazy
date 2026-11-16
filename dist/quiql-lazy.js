(() => {
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    const isFunction = (val) => typeof val === 'function';
    const executeCallback = (callback, argument) => {
        if (isFunction(callback)) {
            try {
                callback(argument);
            } catch(error) {
                console.error(error);
            }
        }
    }
    const normalizeTargets = (targets) => {
        if (!targets) {
            return [];
        }

        if (targets instanceof Element) {
            return [targets];
        }
        
        if (typeof targets !== 'string' && typeof targets[Symbol.iterator] === 'function') {
            return Array.from(targets);
        }

        return [];
    }

    class QuiqlLazy {
        static config = {
            shouldRunIfLoaded: true,
            scanExistingResources: false,
            ignoreOnScan: [],
            debug: false
        };

        static #areResourcesScanned = false;

        static #loadedResources = new Map();

        static normalizeUrl(url) {
            try {
                return new URL(url, window.location.href).href;
            } catch(error) {
                if (this.config?.debug) {
                    console.warn(`QuiqlLazy: Failed to normalize URL "${url}"`, error);
                }

                return url;
            }
        }

        static #createRecord(element, status = 'loaded') {
            return {
                element,
                status,
                loadEvent: null,
                errorEvent: null,
                onloads: new Set(),
                onerrors: new Set()
            };
        }

        static #checkExistingResources() {
            const ignoreList = Array.isArray(this.config?.ignoreOnScan) ? this.config.ignoreOnScan : [];
            const isIgnored = (url) => ignoreList.some(pattern => url.includes(pattern));

            const selectors = [
                { sel: 'script[src]', attr: 'src' },
                { sel: 'link[rel="stylesheet"][href]', attr: 'href' }
            ];

            selectors.forEach(({ sel, attr }) => {
                document.querySelectorAll(sel).forEach(element => {
                    const rawUrl = element[attr];

                    if (!rawUrl) return;

                    const url = this.normalizeUrl(rawUrl);

                    if (!isIgnored(url) && !this.#loadedResources.has(url)) {
                        this.#loadedResources.set(url, this.#createRecord(element));
                    }
                });
            });

            if (this.config.debug) {
                console.log(`QuiqlLazy: Scanned existing resources. Total in cache: ${this.#loadedResources.size}`);
            }
        }

        static #handleResourceResult(record, element, url, status, recordProp, callbackKey, event) {
            record.status = status;
            record[recordProp] = event;

            record[callbackKey].forEach(callback => {
                try {
                    callback(event);
                } catch(error) {
                    console.error('QuiqlLazy: Error in user callback', error);
                }
            });
            
            record.onloads.clear();
            record.onerrors.clear();
            
            element.onload = null;
            element.onerror = null;
            
            if (status === 'error') {
                this.#loadedResources.delete(url);
            }
        }

        static async loadResource(tag, attrs, options = {}) {
            if (!isBrowser) return null;

            const currentConfig = { ...this.config, ...options };
            const { src, href, onload, onerror, ...restAttrs } = attrs;
            const urlAttr = src ? 'src' : 'href';
            let url = src || href;

            if (currentConfig.scanExistingResources && !this.#areResourcesScanned) {
                this.#areResourcesScanned = true;
                this.#checkExistingResources();
            }

            if (!url || typeof url !== 'string') {
                if (currentConfig.debug) {
                    console.warn('QuiqlLazy: url is not passed!');
                }

                return null;
            }

            url = this.normalizeUrl(url);

            if (this.#loadedResources.has(url)) {
                const record = this.#loadedResources.get(url);

                if (record.status === 'loaded') {
                    if (currentConfig.shouldRunIfLoaded) {
                        executeCallback(onload, record.loadEvent);
                    }

                    return record.element;
                }
                
                if (record.status === 'error') {
                    executeCallback(onerror, record.errorEvent);

                    throw record.errorEvent || new Error(`QuiqlLazy: Failed to load resource: ${url}`);
                }

                // record.status === 'pending'
                return new Promise((resolve, reject) => {
                    record.onloads.add((event) => {
                        executeCallback(onload, event);

                        resolve(record.element);
                    });

                    record.onerrors.add((event) => {
                        executeCallback(onerror, event);

                        reject(event);
                    });
                });
            }

            return new Promise((resolve, reject) => {
                const element = document.createElement(tag);
                const record = this.#createRecord(element, 'pending');

                if (isFunction(onload)) {
                    record.onloads.add(onload);
                }

                if (isFunction(onerror)) {
                    record.onerrors.add(onerror);
                }

                this.#loadedResources.set(url, record);

                element.onload = (event) => {
                    this.#handleResourceResult(record, element, url, 'loaded', 'loadEvent', 'onloads', event);

                    resolve(element);
                };

                element.onerror = (event) => {
                    if (currentConfig.debug) {
                        console.error(`QuiqlLazy: Failed to load resource "${url}"`);
                    }

                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }

                    this.#handleResourceResult(record, element, url, 'error', 'errorEvent', 'onerrors', event);

                    reject(event);
                };

                for (const key in restAttrs) {
                    const val = restAttrs[key];

                    if (val != null && val !== false) {
                        element.setAttribute(key, val === true ? '' : String(val));
                    }
                }

                element[urlAttr] = url;

                const target = tag === 'link' ? document.head : document.body;
                target.appendChild(element);
            });
        }

        static loadScript(url, onload = undefined, options = {}) {
            return this.loadResource('script', {
                src: url,
                async: true,
                onload
            }, options);
        }

        static loadStyle(url, onload = undefined, options = {}) {
            return this.loadResource('link', {
                href: url,
                rel: 'stylesheet',
                onload
            }, options);
        }
        
        static Observer = class {
            #instance = null;
            #isRealObserver = true;
            #config = {};
            
            static defaults = {
                options: {
                    root: null,
                    rootMargin: '200px 0px',
                    threshold: 0,
                }
            };

            static lazyDefaults = {
                attributes: {
                    src: 'data-src',
                    srcset: 'data-srcset',
                    bg: 'data-bg',
                },
                classes: {
                    lazy: 'lazy',
                    loading: 'loading',
                    loaded: 'loaded',
                    error: 'error',
                }
            };

            constructor(settings = {}) {
                if (!isBrowser) {
                    console.warn('QuiqlLazy: Work is only possible in a browser');

                    return;
                }

                const core = QuiqlLazy;

                const defaults = this.constructor.defaults;
                const lazyDefaults = this.constructor.lazyDefaults;

                this.#config = {
                    ...defaults,
                    ...settings,
                    options: { ...defaults.options, ...settings.options },
                    debug: core.config.debug
                };

                const config = this.#config;

                if (config.type === 'media') {
                    for (const key of ['attributes', 'classes']) {
                        config[key] = { ...lazyDefaults[key], ...settings[key] };
                    }
                }

                if (!isFunction(config.callback)) {
                    if (config.type === 'media') {
                        config.callback = core.onEach(core.mediaCallback(config));
                    } else {
                        config.callback = core.onAny(core.customCallback(config.load));
                    }
                }

                this.#init();
            }

            #init() {
                const { options, debug, type, targets, callback } = this.#config;

                const isSupportedIntersectionObserver = isBrowser &&
                    'IntersectionObserver' in window && 
                    'IntersectionObserverEntry' in window && 
                    'isIntersecting' in window.IntersectionObserverEntry.prototype;

                if (isSupportedIntersectionObserver) {
                    this.#instance = new IntersectionObserver(callback, options);
                } else {
                    this.#isRealObserver = false;
                    this.#instance = {
                        observe: (target) => {
                            setTimeout(() => {
                                callback([{ target, isIntersecting: true }], this.#instance);
                            }, 0);
                        },
                        unobserve: () => {},
                        disconnect: () => {}
                    };
                }

                if (!targets && type !== 'media' && debug) {
                    console.warn('QuiqlLazy (CustomLoad): "targets" parameter is missing.');
                }

                this.add(targets);
            }

            add(targets) {
                const { type, classes, attributes, callback } = this.#config;

                if (!targets) {
                    if (type === 'media') {
                        targets = document.querySelectorAll(
                            `.${classes.lazy}[${attributes.src}], .${classes.lazy}[${attributes.bg}]`
                        );
                    } else {
                        return;
                    }
                }

                const elements = normalizeTargets(targets);
            
                if (this.#isRealObserver) {
                    for (const element of elements) {
                        if (element instanceof Element) {
                            this.#instance.observe(element);
                        }
                    }
                } else {
                    const fakeEntries = [];

                    for (const element of elements) {
                        if (element instanceof Element) {
                            fakeEntries.push({ target: element, isIntersecting: true });
                        }
                    }

                    if (fakeEntries.length) {
                        setTimeout(() => {
                            callback(fakeEntries, this.#instance);
                        }, 0);
                    }
                }
            }

            remove(targets) {
                if (!targets) {
                    return;
                }

                const elements = normalizeTargets(targets);

                for (const element of elements) {
                    if (element instanceof Element) {
                        this.#instance.unobserve(element);
                    }
                }
            }

            clear() {
                this.#instance.disconnect();
                
                if (this.#config.debug) {
                    console.log('QuiqlLazy: Instance destroyed and disconnected.');
                }
            }
        };
        
        static LazyLoad = class extends QuiqlLazy.Observer {
            constructor(settings = {}) {
                super({ ...settings, type: 'media' });
            }
        };

        static CustomLoad = class extends QuiqlLazy.Observer {
            constructor(settings = {}) {
                super({ ...settings, type: 'custom' });
            }
        };
        
        static mediaCallback = (config) => {
            const { attributes, classes, debug, onLoad, onError } = config;

            const loadImage = (url, srcset, sizes) => new Promise((resolve, reject) => {
                const img = new Image();

                if (sizes) {
                    img.sizes = sizes;
                }

                if (srcset) {
                    img.srcset = srcset;
                }

                img.src = url;
                img.onload = resolve;
                img.onerror = reject;
            });

            return async (entry) => {
                const target = entry.target;

                target.classList.replace(classes.lazy, classes.loading);

                const isImg = target instanceof HTMLImageElement;
                const srcset = target.getAttribute(attributes.srcset);
                const src = isImg ? target.getAttribute(attributes.src) : target.getAttribute(attributes.bg);

                if (!src) {
                    if (debug) {
                        console.warn('QuiqlLazy: Missing source attribute on:', target);
                    }

                    target.classList.replace(classes.loading, classes.error);

                    executeCallback(onError, target);

                    return;
                }

                const sizes = isImg ? target.getAttribute('sizes') : null;

                try {
                    await loadImage(src, srcset, sizes);

                    if (isImg) {
                        if (srcset) {
                            target.removeAttribute(attributes.srcset);
                            target.srcset = srcset;
                        }

                        target.removeAttribute(attributes.src);
                        target.src = src;
                    } else {
                        target.removeAttribute(attributes.bg);
                        target.style.backgroundImage = `url("${src}")`;
                    }

                    target.classList.replace(classes.loading, classes.loaded);
                    
                    executeCallback(onLoad, target);
                } catch(error) {
                    if (debug) {
                        console.error('QuiqlLazy: Error loading image:', src, error);
                    }

                    target.classList.replace(classes.loading, classes.error);
                    
                    executeCallback(onError, target);
                }
            };
        };

        static customCallback = (load = null) => {
            return () => {
                if (isFunction(load)) {
                    load();
                }
            };
        };

        static processIntersection(action, { shouldUnobserve = false, shouldDisconnect = false } = {}) {
            const isActionFunc = isFunction(action);

            return (entries, observer) => {
                for (let i = 0; i < entries.length; i++) {
                    const current = entries[i];

                    if (current.isIntersecting) {
                        if (shouldUnobserve) {
                            observer.unobserve(current.target);
                        }

                        if (shouldDisconnect) {
                            observer.disconnect();
                        }

                        if (isActionFunc) {
                            action(current, observer, entries);
                        }

                        if (shouldDisconnect) {
                            break;
                        }
                    }
                }
            };
        }
        
        static onEach = (action, shouldUnobserve = true) => {
            return QuiqlLazy.processIntersection(action, { shouldUnobserve });
        }
        
        static onAny = (action, shouldDisconnect = true) => {
            return QuiqlLazy.processIntersection(action, { shouldDisconnect });
        }
    }

    // Вместо export default QuiqlLazy и if (isBrowser) в конце файла:
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = QuiqlLazy;
    } else if (isBrowser) {
        window.QuiqlLazy = QuiqlLazy;
    }
})();