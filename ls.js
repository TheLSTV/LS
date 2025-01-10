/*
    Author: Lukas (thelstv)
    Copyright: (c) https://lstv.space

    Last modified: 2025
    License: GPL-3.0
    Version: 5.0.0
    See: https://github.com/thelstv/LS
*/


(exports => {

    const global = typeof window !== 'undefined'? window : global || globalThis;
    const instance = exports();

    if(typeof module !== "undefined"){
        module.exports = instance
    } else {
        global.LS = instance
    }

    if(instance.isWeb){
        for (let key in instance.Tiny){
            global[key] = instance.Tiny[key]
        }

        LS._topLayer = LS.Create({id: "ls-top-layer", style: {
            position: "fixed"
        }});

        LS._topLayerInherit = function () { console.error("LS._topLayerInherit is deprecated, you can safely remove it from your code.") }

        function bodyAvailable(){
            LS.GlobalEvents.completed("body-available")
            document.body.add(LS._topLayer)
        }

        if(document.body) bodyAvailable(); else window.addEventListener("load", bodyAvailable);
    }

})(() => {

    const LS = {
        isWeb: typeof window !== 'undefined',
        version: "5.0.0",
        v: 5,

        components: new Map,

        EventHandler: class EventHandler {
            constructor(target){
                this.events = new Map;

                if(target){
                    target._events = this;

                    ["invoke", "on", "once", "off"].forEach(method => {
                        if (!target.hasOwnProperty(method)) target[method] = this[method].bind(this);
                    });

                    this.target = target;
                }
            }

            prepare(name, options){
                if(!this.events.has(name)){
                    this.events.set(name, { listeners: [], ...options, _isEvent: true })
                } else {
                    Object.assign(this.events.get(name), options)
                }

                return this.events.get(name)
            }

            on(name, callback, options){
                const event = this.events.get(name) || this.prepare(name);
                const index = event.listeners.length;

                if(event.completed) callback();

                event.listeners.push({ callback, index, ...options })
                return this
            }

            off(name, callback){
                const event = this.events.get(name);
                if(!event) return;

                for(let listener of event.listeners){
                    if(listener.callback === callback) listener._remove = true;
                }

                this.clean(event);
                return this
            }

            once(name, callback, options){
                return this.on(name, callback, Object.assign(options || {}, { once: true }))
            }

            invoke(name, ...data){
                const event = name._isEvent? name: this.events.get(name);

                if(!event) return [];

                const returnData = [];
                let removedEvents = false;

                for(let listener of event.listeners){
                    if(!listener || listener._remove || typeof listener.callback !== "function") continue;

                    if(listener.once) {
                        listener._remove = removedEvents = true
                    }

                    try {
                        returnData.push(listener.callback(...data));
                    } catch (error) {
                        console.error(`Error in listener for event '${name}':`, listener, error);
                    }
                }

                if(removedEvents){
                    this.clean(event)
                }

                return returnData
            }

            clean(event){
                event.listeners = event.listeners.filter(listener => !listener._remove)
            }

            flush() {
                this.events.clear();
            }

            completed(name){
                this.invoke(name)

                this.prepare(name, {
                    completed: true
                })
            }
        },

        WebSocket: class WebSocketWrapper {
            constructor(url, options = {}){
                if(!url) throw "No URL specified";
        
                if(!url.startsWith("ws://") || !url.startsWith("wss://")) url = (location.protocol === "https:"? "wss://": "ws://") + url;
        
                this.events = new LS.EventHandler(this);
        
                this.addEventListener = this.on;
                this.removeEventListener = this.off;
        
                if(Array.isArray(options) || typeof options === "string"){
                    options = {protocols: options}
                }
        
                if(typeof options !== "object" || options === null || typeof options === "undefined") options = {};
        
                this.options = LS.Util.defaults({
                    autoReconnect: true,
                    autoConnect: true,
                    delayMessages: true,
                    protocols: null
                }, options)
        
                this.waiting = [];
        
                Object.defineProperty(this, "readyState", {
                    get(){
                        return this.socket.readyState
                    }
                })
        
                Object.defineProperty(this, "bufferedAmount", {
                    get(){
                        return this.socket.bufferedAmount
                    }
                })
        
                Object.defineProperty(this, "protocol", {
                    get(){
                        return this.socket.protocol
                    }
                })
        
                this.url = url;
                if(this.options.autoConnect) this.connect();
            }
        
            connect(){
                if(this.socket && this.socket.readyState === 1) return;
        
                this.socket = new WebSocket(this.url, this.options.protocols || null);
        
                this.socket.addEventListener("open", event => {
                    if(this.waiting.length > 0){
                        for(let message of this.waiting) this.socket.send(message);
                        this.waiting = []
                    }
        
                    this.invoke("open", event)
                })
        
                this.socket.addEventListener("message", event => {
                    this.invoke("message", event)
                })
        
                this.socket.addEventListener("close", async event => {
                    let prevent = false;
        
                    this.invoke("close", event, () => {
                        prevent = true
                    })
        
                    if(!prevent && this.options.autoReconnect) this.connect();
                })
        
                this.socket.addEventListener("error", event => {
                    this.invoke("error", event)
                })
            }
        
            send(data){
                if(!this.socket || this.socket.readyState !== 1) {
                    if(this.options.delayMessages) this.waiting.push(data)
                    return false
                }
        
                this.socket.send(data)
                return true
            }
        
            close(code, message){
                this.socket.close(code, message)
            }
        },

        TinyWrap(elements){
            if(!elements) return null;
            
            // No need to wrap anything, prototypes are global
            if(LS.Tiny._prototyped) return elements;

            function wrap(element){
                return element._lsWrapped || (element._lsWrapped = new Proxy(element, {
                    get(target, key){
                        return LS.TinyFactory[key] || target[key]
                    },
    
                    set(target, key, value){
                        return target[key] = value
                    }
                }))
            }

            return Array.isArray(elements)? elements.map(wrap): wrap(elements);
        },

        Tiny: {
            /**
             * @description Element selector utility
             */
            Q(selector, subSelector, one = false) {
                if(!selector) return LS.TinyWrap(one? null: []);

                const isElement = selector instanceof HTMLElement;
                const target = (isElement? selector : document);

                if(isElement && !subSelector) return LS.TinyWrap(one? selector: [selector]);

                const actualSelector = isElement? subSelector || "*" : selector || '*';

                let elements = one? target.querySelector(actualSelector): target.querySelectorAll(actualSelector);
                
                return LS.TinyWrap(one? elements: [...elements]);
            },

            /**
             * @description Single element selector
             */
            O(selector, subSelector){
                if(!selector) return LS.TinyWrap(document.body);
                return LS.Tiny.Q(selector, subSelector, true)
            },

            /**
             * @description Element builder utility
             */
            N(tagName = "div", content){
                if(typeof tagName !== "string"){
                    content = tagName;
                    tagName = "div";
                }

                content =
                    typeof content === "string" 
                        ? { innerHTML: content } 
                        : Array.isArray(content) 
                            ? { inner: content } 
                            : content || {};


                const { class: className, tooltip, ns, accent, attr, style, inner, content: innerContent, ...rest } = content;

                const element = Object.assign(
                    ns ? document.createElementNS(ns, tagName) : document.createElement(tagName),
                    rest
                );

                // Handle attributes
                if (accent) LS.TinyFactory.add.call(element, { "ls-accent": accent });
                if (attr) LS.TinyFactory.add.call(element, attr);

                // Handle tooltips
                if (tooltip) {
                    if (!LS.Tooltips) {
                        element.attrAssign({ title: tooltip });
                    } else {
                        element.attrAssign({ "ls-tooltip": tooltip });
                        LS.Tooltips.addElements([{ target: element, attributeName: "ls-tooltip" }]);
                    }
                }

                if (className && element.class) LS.TinyFactory.class.call(element, className);
                if (typeof style === "object") LS.TinyFactory.applyStyle.call(element, style);

                // Append children or content
                const contentToAdd = inner || innerContent;
                if (contentToAdd) LS.TinyFactory.add.call(element, contentToAdd);

                return element;
            },

            /**
             * @description Color utilities
             */
            C(r, g, b, a = 1){

                if(typeof r == "string"){
                    let div = N({style: "display:none;color:" + r}), m;
                    O().add(div)
                    m = getComputedStyle(div).color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
                    div.remove()
            
                    if(m) return C(+m[1], +m[2], + m[3]); else throw new Error("Colour "+r+" could not be parsed.");
                }
            
                if(r === null || typeof r == "undefined") r = 255;
                if(g === null || typeof g == "undefined") g = 255;
                if(b === null || typeof b == "undefined") b = 255;
            
                r = Math.round(Math.min(255, Math.max(0, r)));
                g = Math.round(Math.min(255, Math.max(0, g)));
                b = Math.round(Math.min(255, Math.max(0, b)));
                a = Math.min(1, Math.max(0, a));
            
                let tools = {
                    get hex(){
                        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
                    },

                    get rgb(){
                        return `rgb(${r}, ${g}, ${b})`
                    },

                    get rgba(){
                        return `rgba(${r}, ${g}, ${b}, ${a})`
                    },

                    get hsl(){
                        let _r = r / 255;
                        let _g = g / 255;
                        let _b = b / 255;

                        // Find the minimum and maximum values of R, G and B
                        let max = Math.max(_r, _g, _b);
                        let min = Math.min(_r, _g, _b);

                        // Calculate the luminance
                        let l = (max + min) / 2;

                        let h, s;

                        if (max === min) {
                            // Achromatic case (gray)
                            h = s = 0;
                        } else {
                            let delta = max - min;

                            // Calculate the saturation
                            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

                            // Calculate the hue
                            switch (max) {
                                case _r:
                                    h = (_g - _b) / delta + (_g < _b ? 6 : 0);
                                    break;
                                case _g:
                                    h = (_b - _r) / delta + 2;
                                    break;
                                case _b:
                                    h = (_r - _g) / delta + 4;
                                    break;
                            }
                            h /= 6;
                        }

                        // Convert H, S, and L to percentages
                        h = Math.round(h * 360);
                        s = Math.round(s * 100);
                        l = Math.round(l * 100);

                        return [h, s, l]
                    },
            
                    fromHSL(h, s, l){
            
                        s /= 100;
                        l /= 100;
            
                        let k = n => (n + h / 30) % 12,
                            a = s * Math.min(l, 1 - l),
                            f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            
                        return C(255 * f(0), 255 * f(8), 255 * f(4));
                    },

                    get color(){
                        return[r, g, b, a]
                    },

                    get pixel(){
                        return[r, g, b, a * 255]
                    },

                    get brightness(){
                        return Math.sqrt(
                            0.299 * (r * r) +
                            0.587 * (g * g) +
                            0.114 * (b * b)
                        )
                    },

                    get isDark(){
                        return tools.brightness < 127.5
                    },

                    hue(hue){
                        let [h, s, l] = tools.hsl;

                        l = Math.max(Math.min(hue, 360), 0)

                        return C().fromHSL(h, s, l)
                    },

                    saturation(percent){
                        let [h, s, l] = tools.hsl;

                        s = Math.max(Math.min(percent, 100), 0)

                        return C().fromHSL(h, s, l)
                    },

                    lighten(percent){
                        let [h, s, l] = tools.hsl;

                        l = Math.max(Math.min(l + percent, 100), 0)

                        return C().fromHSL(h, s, l)
                    },

                    darken(percent){
                        let [h, s, l] = tools.hsl;

                        l = Math.max(Math.min(l - percent, 100), 0);

                        return C().fromHSL(h, s, l)
                    },

                    lighten(percent){
                        let [h, s, l] = tools.hsl;

                        l = Math.min(l + percent, 1);

                        return C().fromHSL(h, s, l)
                    },
                    
                    hueShift(deg){
                        let [h, s, l] = tools.hsl;
                        
                        h = (h + deg) % 360;
                        
                        return C().fromHSL(h, s, l)
                    },

                    multiply(r2, g2, b2, a2){
                        let color = C(r2, g2, b2, a2).color;

                        return C(r * color[0], g * color[1], b * color[2], a * color[3])
                    },

                    divide(r2, g2, b2, a2){
                        let color = C(r2, g2, b2, a2).color;

                        return C(r / color[0], g / color[1], b / color[2], a / color[3])
                    },

                    add(r2, g2, b2, a2){
                        let color = C(r2, g2, b2, a2).color;

                        return C(r + color[0], g + color[1], b + color[2], a + color[3])
                    },

                    substract(r2, g2, b2, a2){
                        let color = C(r2, g2, b2, a2).color;

                        return C(r - color[0], g - color[1], b - color[2], a - color[3])
                    },

                    alpha(v){
                        return C(r, g, b, v)
                    },

                    random(){
                        return C(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
                    }
                }
            
                return tools;
            },

            M: {
                _GlobalID: {
                    count: 0,
                    prefix: Math.round(Math.random() * 1e3).toString(36) + Math.round(Math.random() * 1e3).toString(36)
                },

                ShiftDown: false,
                ControlDown: false,
                lastKey: null,

                on(...events){
                    let fn = events.find(event => typeof event === "function");

                    for(const event of events){
                        if(typeof event !== "string") continue;
                        window.addEventListener(event, fn)
                    }
                    return LS.Tiny.M
                },

                get GlobalID(){
                    // return M.GlobalIndex.toString(36)

                    LS.Tiny.M._GlobalID.count++;

                    return `${Date.now().toString(36)}-${(LS.Tiny.M._GlobalID.count).toString(36)}-${LS.Tiny.M._GlobalID.prefix}`
                },

                uid(){
                    return M.GlobalID + "-" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
                },

                Style(url, callback) {
                    return new Promise((resolve, reject) => {
                        const linkElement = N("link", {
                            rel: "stylesheet",
                            href: url,
                            onload() {
                                if (callback) callback(null);
                                resolve();
                            },
                            onerror(error) {
                                const errorMsg = error.toString();
                                if (callback) callback(errorMsg);
                                reject(errorMsg);
                            }
                        });
                
                        O("head").add(linkElement);
                    });
                },

                Script(url, callback) {
                    return new Promise((resolve, reject) => {
                        const scriptElement = N("script", {
                            src: url,
                            onload() {
                                if (callback) callback(null);
                                resolve();
                            },
                            onerror(error) {
                                const errorMsg = error.toString();
                                if (callback) callback(errorMsg);
                                reject(errorMsg);
                            }
                        });
                
                        O("head").add(scriptElement);
                    });
                },

                async Document(url, callback) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
                        const text = await response.text();
                        const data = N("div", { innerHTML: text });

                        if (callback) callback(null, data);
                        return await data;
                    } catch (error) {
                        const errorMsg = error.toString();
                        if (callback) callback(errorMsg);
                        throw errorMsg;
                    }
                }
            },

            _prototyped: false
        },

        TinyFactory: {
            isElement: true,

            attr(get = false, set = false) {
                if (set) {
                    this.setAttribute(get, set);
                    return this;
                }
            
                if (get) {
                    return this.getAttribute(get);
                }
            
                const attributes = {};
                for (const { name, value } of this.attributes) {
                    attributes[name] = value;
                }
            
                return attributes;
            },

            attrAssign(attributes){
                if (typeof attributes === "string") {
                    attributes = { Array: [attributes] };
                } else if (Array.isArray(attributes)) {
                    attributes = { Array: attributes };
                }
            
                for (const [key, value] of Object.entries(attributes)) {
                    if (key === "Array") {
                        for (const attr of value) {
                            if (typeof attr === "object") {
                                this.attrAssign(attr);
                            } else if (attr) {
                                this.setAttribute(attr, "");
                            }
                        }
                    } else if (key) {
                        this.setAttribute(key, value || "");
                    }
                }
            
                return this;
            },

            delAttr(...attributes){
                attributes = attributes.flat(2);
                attributes.forEach(attribute => this.removeAttribute(attribute))

                return this
            },

            class(names, action = 1){
                if(typeof names == "undefined") return this;

                action = (action == "add" || (!!action && action !== "remove"))? (action == 2 || action == "toggle")? "toggle": "add": "remove";

                for(let className of typeof names === "string"? names.split(" "): names){
                    if(typeof className !== "string" || className.length < 1) continue;
                    this.classList[action](className)
                }

                return this
            },

            hasClass(...names){
                if(names.length === 0) return false;
                if(names.length === 1) return this.classList.contains(names[0]);

                let has = true;

                names = names.flatMap(className => {
                    if(!this.classList.contains(className)) has = false
                })

                return has
            },

            get(selector = '*'){
                return LS.Tiny.O(this, selector)
            },

            getAll(selector = '*'){
                return LS.Tiny.Q(this, selector)
            },

            add(...a){
                console.log(this);
                
                this.append(...LS.Util.resolveElements(...a));
                return this
            },

            addBefore(a){
                LS.Util.resolveElements(a).forEach(e=>this.parentNode.insertBefore(e,this))
                return this
            },

            addAfter(a){
                LS.Util.resolveElements(a).forEach(e=>this.parentNode.insertBefore(e,this.nextSibling))
                return this
            },

            addTo(a){
                O(a).add(this)
                return this
            },

            setTo(a){
                O(a).set(this)
                return this
            },

            wrapIn(e){
                this.addAfter(O(e));
                e.appendChild(this);
                return this
            },

            isInView(){
                var rect = this.getBoundingClientRect();
                return rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.bottom > 0 && rect.right > 0
            },

            isEntirelyInView(){
                var rect = this.getBoundingClientRect();

                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            },

            on(...events){
                let func = events.find(e => typeof e == "function");
                for (const evt of events) {
                    if (typeof evt != "string") continue;
                    this.addEventListener(evt, func);
                }

                return this
            },

            off(...events){
                let func = events.find(e => typeof e == "function");
                for (const evt of events) {
                    if (typeof evt != "string") continue;
                    this.removeEventListener(evt, func);
                }

                return this
            },

            hide(){
                let current = getComputedStyle(this).display;
                this._display = current;

                this.style.display = "none";
                return this
            },

            show(displayOverride){
                this.style.display = displayOverride || this._display || "inherit";
                return this
            },

            applyStyle(rules){
                if(typeof rules !== "object") throw new Error("First attribute of \"applyStyle\" must be an object");

                for(let rule in rules){
                    if(!rules.hasOwnProperty(rule)) continue;

                    let value = rules[rule];

                    if(!rule.startsWith("--")) rule = rule.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

                    this.style.setProperty(rule, value)
                }
            },

            set(...elements){
                this.innerHTML = '';
                return this.add(...elements)
            },

            clear(){
                this.innerHTML = '';
                return this
            },

            has(...elements){
                return !!elements.find(element => this.get(element))
            }
        },

        prototypeTiny(){
            if(LS.Tiny._prototyped) return;
            LS.Tiny._prototyped = true;

            console.warn("Warning: TinyFactory has been prototyped globally to all HTML elements. You can now use all its featuers seamlessly. Beware that this may conflict with other libraries or future changes or cause confusion, please use with caution!");
            Object.assign(HTMLElement.prototype, LS.TinyFactory);
        },

        Util: {
            resolveElements(...array){
                return array.flat(Infinity).map(element => {
                    if(element && element.tagName) return element;

                    return [...N("div", element).childNodes];
                }).flat();
            },

            params(get = null){
                let url = location.href;

                if(!url.includes('?')){
                    return get? null : {}
                }

                let result = {},
                    params = url.replaceAll(/(.*?)\?/gi, '').split('&')
                ;
                
                for(let param of params){
                    param = param.split("=");
                    result[param[0]] = decodeURIComponent(param[1] || "").replace(/#(.*)/g,"")
                }

                return get? result[get] : result
            },

            touchHandle(element, options = {}){
                element = O(element);

                if(!element) throw "Invalid handle!";

                let events = new LS.EventHandler, cancelled = false;

                options = {
                    buttons: [0, 1, 2],
                    ...options
                }

                if(options.cursor) events.cursor = options.cursor;
                
                events.target = element //The target will change based on the event target!

                let [pointerLockPreviousX, pointerLockPreviousY] = [0, 0];

                function move(event) {
                    if(cancelled) return;

                    let x, y, isTouchEvent = event.type == "touchmove";

                    if(!isTouchEvent) event.preventDefault()

                    if(!events.pointerLockActive) {
                        x = isTouchEvent? event.touches[0].clientX : event.clientX
                        y = isTouchEvent? event.touches[0].clientY : event.clientY
                    }

                    if(options.pointerLock){
                        // The following adds seamles fallback for pointerlock on touch devices and emulates absolute mouse position for pointerlock!
                        // This allows you to easily enable/disable pointerlock without losing any functionality or having to write custom fallbacks, on both touch and mouse devices!

                        if(events.pointerLockActive){
                            x = pointerLockPreviousX += !isNaN(event.movementX)? event.movementX: 0
                            y = pointerLockPreviousY += !isNaN(event.movementY)? event.movementY: 0
                        } else if(isTouchEvent){
                            event.movementX = Math.round(x - pointerLockPreviousX)
                            event.movementY = Math.round(y - pointerLockPreviousY)
                            pointerLockPreviousX = x
                            pointerLockPreviousY = y
                        }
                    }

                    if(options.onMove) options.onMove(x, y, event, cancel)

                    events.invoke("move", x, y, event, cancel)
                }

                function cancel() {
                    cancelled = true
                }

                function pointerLockChangeWatch(){
                    events.pointerLockActive = document.pointerLockElement === element;
                }

                document.addEventListener('pointerlockchange',  pointerLockChangeWatch);
    
                function release(evt) {
                    events.seeking = false;
                    cancelled = false;
    
                    element.class("is-dragging", 0)
                    events.target.class("ls-drag-target", 0)
                    document.documentElement.class("ls-dragging",0)
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", release);
                    document.removeEventListener("touchmove", move);
                    document.removeEventListener("touchend", release);
                    document.documentElement.style.cursor = "";
    
                    events.invoke(evt.type == "destroy"? "destroy" : "end", evt)

                    if(events.pointerLockActive){
                        document.exitPointerLock();
                    }

                    if(evt.type == "destroy")
                        if(options.onDestroy) options.onDestroy(evt);
                    else 
                        if(options.onEnd) options.onEnd(evt);
                }

                function start(event){
                    if(typeof options.exclude == "string" && event.target.matches(options.exclude)) return;
                    if(!options.exclude && event.target !== element) return;

                    event.preventDefault()

                    if(event.type == "mousedown" && !options.buttons.includes(event.button)) return;
                    
                    events.seeking = true;

                    let x = event.type == "touchstart"? event.touches[0].clientX : M.x, y = event.type == "touchstart"? event.touches[0].clientY : M.y;

                    events.invoke("start", event, cancel, x, y)
                    if(options.onStart) options.onStart(event, cancel, x, y)

                    if(cancelled) return events.seeking = false;

                    if(options.pointerLock && event.type !== "touchstart") {

                        pointerLockPreviousX = M.x
                        pointerLockPreviousY = M.y

                        if (event.type !== "touchstart") element.requestPointerLock();
                    }

                    events.target = O(event.target);
                    events.target.class("ls-drag-target")

                    element.class("is-dragging")
                    document.documentElement.class("ls-dragging")
                    document.addEventListener("mousemove", move);
                    document.addEventListener("mouseup", release);
                    document.addEventListener("touchmove", move);
                    document.addEventListener("touchend", release);
                    document.documentElement.style.cursor = events.cursor || "grab";
                }

                element.on("mousedown", "touchstart", ...(options.startEvents || []), start)

                events.destroy = function (){
                    release({type: "destroy"})
                    element.off("mousedown", "touchstart", start)
                    document.removeEventListener('pointerlockchange',  pointerLockChangeWatch);
                    cancelled = true;
                    events.destroy = () => false;
                    events.destroyed = true
                    return true
                }

                return events
            },

            defaults(defaults, target = {}) {
                if(typeof target !== "object") throw "The target must be an object";

                for (const [key, value] of Object.entries(defaults)) {
                    if (!(key in target)) {
                        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(defaults, key));
                    }
                }
                return target
            },

            copy(text) {
                return new Promise(resolve => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text)
                            .then(() => {
                                resolve()
                            })
                            .catch(error => {
                                resolve(error)
                            })
                    } else {
                        // Old method

                        let temp = N('textarea', {value: text})

                        O().add(temp)
                        temp.select()
                        document.execCommand('copy')
                        
                        O().removeChild(temp)
                        resolve()
                    }
                })
            },
        },

        Component: class {
            constructor(){
                if(!this._component || !LS.components.has(this._component.name)){
                    throw new Error("This class has to be extended and loaded as a component with LS.LoadComponent.");
                }

                this._events = new LS.EventHandler(this);
            }
        },

        LoadComponent(componentClass, options = {}){
            const name = options.name || componentClass.name;

            if(LS.components.has(name)) {
                console.warn(`[LS] Duplicate component name ${name}, ignored!`);
                return
            }

            const component = {
                class: componentClass,
                metadata: options.metadata,
                global: !!options.global,
                name
            }

            LS.components.set(name, component)
            componentClass.prototype._component = component;

            if(component.global){
                LS[name] = options.singular? new componentClass: componentClass;
            }

            return component
        },

        GetComponent(name){
            return LS.components.get(name)
        }
    }

    LS.GlobalEvents = new LS.EventHandler(LS)
    LS.Pallete = LS.Tiny.C;
    LS.Global = LS.Tiny.M;
    LS.SelectAll = LS.Tiny.Q;
    LS.Select = LS.Tiny.O;
    LS.Create = LS.Tiny.N;

    if(LS.isWeb){
        LS.Global.on("keydown", event => {
            M.lastKey = event.key;
            if(event.key == "Shift") LS.Global.ShiftDown = true;
            if(event.key == "Control") LS.Global.ControlDown = true;
        })

        LS.Global.on("keyup", event => {
            LS.Global.lastKey = event.key;
            if(event.key == "Shift") LS.Global.ShiftDown = false;
            if(event.key == "Control") LS.Global.ControlDown = false;
        })

        LS.Global.on("mousedown", () => LS.Global.mouseDown = true)
        LS.Global.on("mouseup", () => LS.Global.mouseDown = false)
    }

    return LS

})