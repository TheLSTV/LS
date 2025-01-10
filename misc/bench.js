const bench = (()=>{
    const v4 = (() => {
        var LS = {
            isWeb: typeof window !== 'undefined',
            version: "4.0.1",
            v: 4,
    
            Util: {
                resolveElements(...array){
    
                    // Takes a list of elements or element-like structure and cleans the array to a definite array of elements
    
                    return array.flat(Infinity).map(element => {
                        if(element && element.tagName) return element;
    
                        return [...N("temp", element).childNodes];
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
                    let legacyHandle = LS.Util.RegisterMouseDrag(element, options.exclude || false, options, false);
                    return legacyHandle;
                },
    
                RegisterMouseDrag(handle, exclude = false, options = {}, old = true){
                    if(!handle || !O(handle)) throw "Invalid handle!";
    
                    if(old) console.warn("Note: You are using LS.Util.RegisterMouseDrag - this has been replaced by LS.Util.touchHandle. It is recommended to migrate. Backwards compatibility so far is supported.")
    
                    let events = new LS.EventHandler, cancelled = false;
    
                    options = {
                        buttons: [0, 1, 2],
                        ...options
                    }
    
                    if(options.cursor) events.cursor = options.cursor;
                    
                    events.target = handle //The target will change based on the event target!
    
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
                        events.pointerLockActive = document.pointerLockElement === handle;
                    }
    
                    document.addEventListener('pointerlockchange',  pointerLockChangeWatch);
        
                    function release(evt) {
                        events.seeking = false;
                        cancelled = false;
        
                        handle.class("is-dragging", 0)
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
                        if(typeof exclude == "string" && event.target.matches(exclude)) return;
                        if(!exclude && event.target !== handle) return;
    
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
    
                            if (event.type !== "touchstart") handle.requestPointerLock();
                        }
    
                        events.target = O(event.target);
                        events.target.class("ls-drag-target")
    
                        handle.class("is-dragging")
                        document.documentElement.class("ls-dragging")
                        document.addEventListener("mousemove", move);
                        document.addEventListener("mouseup", release);
                        document.addEventListener("touchmove", move);
                        document.addEventListener("touchend", release);
                        document.documentElement.style.cursor = events.cursor || "grab";
                    }
    
                    handle.on("mousedown", "touchstart", ...(options.startEvents || []), start)
    
                    events.destroy = function (){
                        release({type: "destroy"})
                        handle.off("mousedown", "touchstart", start)
                        document.removeEventListener('pointerlockchange',  pointerLockChangeWatch);
                        cancelled = true;
                        events.destroy = () => false;
                        events.destroyed = true
                        return true
                    }
    
                    return events
                },
    
                flatten(obj){
    
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
    
                /*]
                
                import(
                    ls-js/deprecated/manipulator.js
                    : Manipulator : -f
                )
                
                */
            },
            /*]part(tiny)*/
            TinyFactory(r){
                let __variablesProxyObject
    
                return {
                    _affected: true,
                    isElement: true,
    
                    attr(get = false, set = false){
                        if(set){
                            r.setAttribute(get, set);
                            return set
                        }
    
                        if(get) return r.getAttribute(get);
    
                        let a = r.attributes,
                            c = {}
                        ;
    
                        Object.keys(a).map(b => c[a[b].nodeName] = a[b].nodeValue);
                        return get ? c[get] : c
                    },
    
                    attrAssign(a){
                        if(typeof a == "string") a = {Array: [a]};
                        if(Array.isArray(a)) a = {Array: a};
    
                        for(const k in a){
                            if(!a.hasOwnProperty(k)) continue;
                            if(k == 'Array'){
                                for(let attr of a[k]){
                                    if(typeof attr == "object"){
                                        r.attrAssign(attr)
                                        continue
                                    }
                                    if(attr) r.setAttribute(attr, '');
                                }
                                continue
                            }
                            ;(k && r.setAttribute(k, a[k] || ''));
                        }
    
                        return r
                    },
    
                    hasAttr: r.hasAttribute,
    
                    delAttr(...attribute){
                        attribute = attribute.flat(2);
                        attribute.forEach(a => r.removeAttribute(a))
    
                        return r
                    },
    
                    class(names, action = 1){
                        if(typeof names == "undefined") return [...r.classList];
                        if(typeof names == "string") names = names.split(" ");
                        for(let className of names){
                            if(typeof className !== "string" || className.length < 1)continue;
                            r.classList[(action == "add" || (!!action && action !== "remove"))? (action == 2 || action == "toggle")? "toggle": "add": "remove"] (className)
                        }
                        return r
                    },
    
                    hasClass(...names){
                        let h = !0;
                        names = names.flatMap(c=>{
                            if(!r.classList.contains(c)) h=!1
                        })
                        return h
                    },
    
                    get(selector = '*'){
                        return O(r, selector)
                    },
    
                    getAll(t = '*'){
                        return Q(r, t)
                    },
    
                    getChildern(){
                        return [...r.children]
                    },
    
                    child(i){
                        return r.children[i||0]
                    },
    
                    add(...a){
                        r.append(...LS.Util.resolveElements(...a));
                        return r.self
                    },
    
                    addBefore(a){
                        LS.Util.resolveElements(a).forEach(e=>r.parentNode.insertBefore(e,r))
                        return r
                    },
    
                    addAfter(a){
                        LS.Util.resolveElements(a).forEach(e=>r.parentNode.insertBefore(e,r.nextSibling))
                        return r
                    },
    
                    addTo(a){
                        O(a).add(r)
                        return r
                    },
    
                    setTo(a){
                        O(a).set(r)
                        return r
                    },
    
                    wrapIn(e){
                        r.addAfter(O(e));
                        e.appendChild(r);
                        return r
                    },
    
                    isInView(){
                        var rect = r.getBoundingClientRect();
    
                        return rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.bottom > 0 && rect.right > 0
                    },
    
                    isEntirelyInView(){
                        var rect = r.getBoundingClientRect();
    
                        return (
                            rect.top >= 0 &&
                            rect.left >= 0 &&
                            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                        );
                    },
    
                    addOnce(a){
                        console.warn("element.addOnce is deprecated, do not rely on it")
                        if (!O(r, '#' + a.id)) r.add(a)
                    },
    
                    on(...events){
                        let func = events.find(e => typeof e == "function");
                        for (const evt of events) {
                            if (typeof evt != "string") continue;
                            r.addEventListener(evt, func);
                        }
    
                        return r.self
                    },
    
                    off(...events){
                        let func = events.find(e => typeof e == "function");
                        for (const evt of events) {
                            if (typeof evt != "string") continue;
                            r.removeEventListener(evt, func);
                        }
    
                        return r.self
                    },
    
                    get firstFocusable(){
                        return r.get('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
                    },
    
                    hide(){
                        let current = getComputedStyle(r).display;
    
                        r.attrAssign({
                            "ls-hide-originaldisplay": current == "none"? "block": current
                        })
    
                        r.style.display = "none";
                        return r
                    },
    
                    show(displayOverride){
                        // "ls-hide-originaldisplay" is kind of ugly, is there a better way?
    
                        r.style.display = displayOverride || r.attr("ls-hide-originaldisplay") || "inherit";
                        return r
                    },
    
                    applyStyle(rules){
                        if(typeof rules !== "object") throw new Error("First attribute of \"applyStyle\" must be an object");
    
                        for(let rule in rules){
                            if(!rules.hasOwnProperty(rule)) continue;
    
                            let value = rules[rule];
    
                            if(!rule.startsWith("--")) rule = rule.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
                            r.style.setProperty(rule, value)
                        }
                    },
    
                    get cssVariables(){
                        if(!__variablesProxyObject) __variablesProxyObject = new Proxy({}, {
                            get(target, key){
                                return r.style.getPropertyValue(`--${key}`)
                            },
        
                            set(target, key, value){
                                return r.style.setProperty(`--${key}`, value)
                            }
                        })
    
                        return __variablesProxyObject
                    },
    
                    getStyle(){
                        throw ".getStyle should not be used, use getComputedStyle(element) instead."
                        return getComputedStyle(r)
                    },
    
                    set(...elements){
                        r.innerHTML = '';
    
                        return r.add(...elements)
                    },
    
                    clear(){
                        r.innerHTML = '';
    
                        return r
                    },
    
                    has(...a){
                        return !!a.find(l => r.get(l))
                    },
    
                    parent: (n = 0) => r.tagName == 'BODY' ? r.parentElement : (n > 0 ? O(r.parentElement).parent(n - 1) : r.parentElement),
    
                    self: r,
    
                    findPath () {
                        let path = [r];
                        
                        for(let i = 0; path.at(-1)?.tagName != "HTML"; i++){
                            path.push(r.parent(i));
                            i++
                        }
    
                        return path.reverse()
                    }
                }
            },
    
            Tiny:{
                Q(e, q) {
                    let elements = (e?.tagName && !q ? [e] : [...(e?.tagName ? e : document).querySelectorAll(e?.tagName ? !q ? '*' : q : typeof e == 'string' ? e : '*')])?.map(r => {
                        if(!r._affected){
    
                            let methods = LS.TinyFactory(r);
                            
                            Object.defineProperties(r, Object.getOwnPropertyDescriptors(methods))
    
                            if(r.tagName == "BR") r.removeAttribute("clear"); // Fixes a bug (i think?)
                        }
                        return r.self
                    })
    
                    return Object.assign(elements, {
                        all(callback){
                            if(callback) {
                                for(const [i, a] of elements.entries()) {
                                    callback(a, i)
                                }
    
                                return
                            }
    
                            function each(func,...attr){
                                for(const element of elements) {
                                    element[func](...attr)
                                }
                            }
    
                            return new Proxy({}, {
                                get(target, key){
                                    return (...attr) => each(key, ...attr)
                                }
                            })
                        },
    
                        allChildern(){
    
                        }
                    })
                },
    
                O(...selector){
                    return LS.Tiny.Q(...selector.length < 1? ['body'] : selector)[0]
                },
    
                N(tagName = 'div', content){
                    if(typeof tagName != "string"){
                        content = tagName;
                        tagName = "div";
                    }
    
                    content = (typeof content == 'string'? {innerHTML: content} : Array.isArray(content)? {inner: content} : content) || {};
    
                    let temporary = {};
    
                    if(content.class){
                        temporary.class = content.class;
                        delete content.class
                    }
    
                    if(content.tooltip){
                        temporary.tooltip = content.tooltip;
                        delete content.tooltip
                    }
    
                    if(content.ns){
                        temporary.ns = content.ns;
                        delete content.ns
                    }
    
                    let element = O(Object.assign(
                        document[temporary.ns? "createElementNS" : "createElement"] (temporary.ns? temporary.ns : tagName, temporary.ns? tagName : null),
                        content
                    ));
    
                    if(content.accent){
                        element.attrAssign({"ls-accent": content.accent})
                        delete content.accent
                    }
    
                    if(content.attr) element.attrAssign(content.attr);
    
                    if(temporary.tooltip) {
                        if(!LS.Tooltips){
                            element.attrAssign({"title": temporary.tooltip})
                        }else{
                            element.attrAssign({"ls-tooltip": temporary.tooltip})
                            LS.Tooltips.addElements([{target: element, attributeName: "ls-tooltip"}])
                        }
                    }
    
                    if(temporary.class && element.class) element.class(temporary.class);
    
                    if(typeof content.style == "object") element.applyStyle(content.style);
    
                    if(content.inner || content.content) element.add(content.inner || content.content);
    
                    return element
                },
    
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
    
                        // lighten(percent){
                        //     let [h, s, l] = tools.hsl;
    
                        //     l = Math.min(l + percent, 1);
    
                        //     return C().fromHSL(h, s, l)
                        // },
                        
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
                    x: 0,
                    y: 0,
    
                    _GlobalID: {
                        count: 0,
                        prefix: Math.round(Math.random() * 1e3).toString(36) + Math.round(Math.random() * 1e3).toString(36)
                    },
    
                    lastKey: null,
    
                    ShiftDown: false,
                    ControlDown: false,
    
                    mouseDown: false,
    
                    on(...events){
                        let func = events.find(e => typeof e == "function");
                        for(const evt of events){
                            if(typeof evt != "string") continue;
                            global.addEventListener(evt, func)
                        }
                        return M
                    },
    
                    get GlobalID(){
                        // return M.GlobalIndex.toString(36)
    
                        LS.Tiny.M._GlobalID.count++;
    
                        return `${Date.now().toString(36)}-${(LS.Tiny.M._GlobalID.count).toString(36)}-${LS.Tiny.M._GlobalID.prefix}`
                    },
    
                    uid(){
                        return M.GlobalID + "-" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
                    },
    
                    payloadSignature(title, dataArray = [], paddingSize = 128, base = 16){
                        if(dataArray.length > paddingSize){
                            throw "The length of data cannot exceed the padding size"
                        }
    
                        if(base < 16 || base > 36) throw "base must be a number between 16 and 36";
    
                        let encoder = new TextEncoder();
    
                        for(let i = 0; i < dataArray.length; i++){
                            if(!(dataArray[i] instanceof Uint8Array) && typeof dataArray[i] !== "string") throw "Data can only be a string or an Uint8Array.";
                            dataArray[i] = typeof dataArray[i] === "string"? encoder.encode(dataArray[i]): dataArray[i];
                        }
    
                        dataArray.push(crypto.getRandomValues(new Uint8Array(paddingSize - dataArray.length)));
    
                        let data = dataArray.map(data => [...data].map(value => value.toString(base).padStart(2, "0")).join("")).join(":") + "0" + (base -1).toString(base)
    
                        return `---signature block start "${M.uid()}${title? "-"+ title: ""}"---\n${data}\n---signature block end---`
                    },
    
                    parsePayloadSignature(signature){
                        if(!signature.startsWith("---signature block start") || !signature.endsWith("\n---signature block end---")) throw "Invalid signature data";
    
                        let header = signature.match(/---signature block start "(.*?)"---\n/)[1].split("-"), timestamp, id, instanceID;
    
                        timestamp = parseInt(header[0], 36)
                        id = parseInt(header[1], 36)
                        instanceID = parseInt(header[2], 36)
                        header = header[4] || null
    
                        function decodeBody(hexString) {
                            const byteArray = new Uint8Array(hexString.length / 2);
    
                            for (let i = 0; i < hexString.length; i += 2) {
                                byteArray[i / 2] = parseInt(hexString.substring(i, i + 2), base);
                            }
                            
                            return byteArray;
                        }
    
                        let rawBody = signature.match(/['"t]---\n(.*?)\n---signature block end/s)[1], base = parseInt(rawBody.slice(-2), 36) +1;
                        
                        let body = rawBody.split(":").map(payload => decodeBody(payload));
                        
                        let padding = body.pop()
    
                        return { header, body, padding, timestamp, id, instanceID }
                    },
    
                    Style(url, callback){
                        return new Promise((resolve, reject)=>{
                            O("head").add(N("link", {
                                rel: "stylesheet",
                                href: url,
                                onload(){
                                    if(callback) callback()
                                    resolve()
                                },
                                onerror(error){
                                    if(callback) callback(error)
                                    reject(error.toString())
                                }
                            }))
                        })
                    },
    
                    Script(url, callback){
                        return new Promise((resolve, reject)=>{
                            LS.Tiny.O("head").add(LS.Tiny.N("script", {
                                src: url,
                                onload(){
                                    if(callback) callback()
                                    resolve()
                                },
                                onerror(error){
                                    if(callback) callback(error)
                                    reject(error.toString())
                                }
                            }))
                        })
                    },
    
                    GetDocument(url, callback){
                        return new Promise((resolve, reject) => {
                            fetch(url)
                                .then(async response => {
                                    let data = N("div", await response.text());
    
                                    if(callback) callback(null, data);
                                    resolve(data)
                                })
                                .catch(error => {
                                    let message = error.toString();
    
                                    if(callback) callback(message);
                                    reject(message)
                                })
                        })
                    },
    
                    loop(times, ...functions){
                        for(let i = 0; i < times; i++){
                            for(const fn of functions){
                                fn(i)
                            }
                        }
                    }
                }
            },
            /*]end*/
            LoadComponents(components){
                for(const name in components){
                    if(!components.hasOwnProperty(name)) continue;
    
                    if(LS[name]) {
                        console.warn(`[LS Framework] Duplicate component name ${name}, import was ignored!`);
                        continue
                    }
    
                    LS[name] = function ComponentInstance(id, ...attributes){
                        if(LS[name].conf.isFunction) return (LS[name].class({})) (id, ...attributes);
                        return (LS[name].list[id || "default"]) || (LS[name].new(id, ...attributes));
                    }
    
                    LS[name].new = function (id, ...attributes){
                        if(id instanceof Element) {
                            attributes.unshift(id);
                            id = id.id || "default"
                        }
    
                        if(typeof id === "object" && id !== null) {
                            attributes.unshift(id);
                            id = (id && id.id) || "default"
                        }
    
                        if(attributes[0] instanceof Element){
                            attributes[0] = O(attributes[0]);
    
                            if(id && attributes[0].attr("ls-component") === id.toLowerCase()) {
                                let previous = LS[name].list[id]
                                if(previous) return previous
                            }
    
                            attributes[0].attr("ls-component", name.toLowerCase())
                        }
    
                        let ClassInstance = new((LS[name].class)({})) (id, ...attributes);
    
                        if(LS[name].conf.events) ClassInstance.Events = new LS.EventHandler(ClassInstance);
    
                        if(id) {
                            ClassInstance.id = id;
                            LS[name].list[id] = ClassInstance;
                        }
    
                        if(ClassInstance._init) ClassInstance._init();
                        return ClassInstance
                    }
    
                    LS[name].set = function (key, value){
                        LS[name][key] = value
                    }
    
                    LS[name].list = LS[name].conf = {};
    
                    LS[name].class = ((components[name]) (LS[name]));
    
                    let dependencies = LS[name].conf? LS[name].conf.requires : null;
    
                    if(Array.isArray(dependencies)){
                        for(const dependency of dependencies){
                            if(!LS[dependency] || !components[dependency]){
                                delete LS[name];
                                LS[name] = false;
                                console.error(`[LS Framework] Unmet dependency of "${name}": "${dependency}" ${ dependencies.length > 1? `(All dependencies are: ${dependencies.map(dependency => '"' + dependency + '"').join(", ")})` : '' }\nThis component will not work until the dependencies are met.`);
                                break
                            }
                        }
                        if(!LS[name]) continue;
                    }
    
                    // Component config
                    LS[name].conf = {
                        batch: true,
                        events: true,
                        ... LS[name].conf
                    };
    
                    if(LS[name].conf.events) LS[name].Events = new LS.EventHandler(LS[name]);
    
                    if(LS[name].conf.singular){
    
                        if(LS[name].conf.becomeClass) {
                            LS[name] = LS[name].class;
                            continue
                        }
    
                        LS[name] = LS[name].new("global");
    
                    }else if(LS[name].conf.batch){
    
                        LS[name].batch =  function(elements, config, unique = true) {
                            if(typeof elements == "string") elements = Q(elements);
    
                            if(!Array.isArray(elements)) e = [...O(elements).children];
    
                            for(const element of elements){
                                new LS[name].new((unique? element.id : null) || "auto_" + M.GlobalID, element, config)
                            }
                        }
    
                        // Legacy
                        LS[name].registerGroup = LS[name].batch;
    
                        LS[name].observe = function (selector, previous, parent = O()) {
                            throw "LS.Component.observe has been removed"
                        }
    
                        if(LS.invoke){
                            LS.invoke("componentLoad", name)
                            LS.invoke("componentLoad:" + name)
                        }
                    }
                }
            }
        }
    
    LS.EventHandler = function (target, options) {
        return ((_this) => new class EventClass {
            constructor(){
                this.listeners = [];
                this.events = {};
    
                _this = this;
    
                if(target){
                    for(let key of ["invoke", "on", "once", "off"]){
                        if(!target.hasOwnProperty(key)) target[key] = this[key]
                    }
    
                    this.target = target
                }
            }
    
            prepare(event){
                if(typeof event == "string"){
                    event = {name: event}
                }
    
                let name = event.name;
                delete event.name;
    
                _this.events[name] = {... (_this.events[name] || null), ...event};
    
                return event
            }
    
            async invoke(name, ...data){
                _this.prepare(name);
    
                if(typeof name !== "string") name = name.name;
    
                let ReturnValues = [];
    
                for(const listener of _this.listeners){
                    if(!listener || listener.for !== name) continue;
    
                    ReturnValues.push(await listener.f(...data));
    
                    if(listener.once) delete _this.listeners[listener.i];
                }
    
                return ReturnValues
            }
    
            on(type, callback, extra){
                let index = _this.listeners.length;
    
                // _this.invoke("event-listener-added", index)
    
                if(_this.events[type]){
                    let evt = _this.events[type];
                    if(evt.completed) callback();
                }
    
                _this.listeners.push({
                    for: type,
                    f: callback,
                    i: index,
                    id: LS.Tiny.M.GlobalID,
                    ...extra
                })
    
                return _this.target || _this
            }
    
            once(type, callback, extra){
                _this.on(type, callback, {
                    once: true,
                    ...extra
                })
    
                return _this.target || _this
            }
    
            off(type, event){
                if(typeof type === "function") event = type;
    
                for(const listener of _this.listeners){
                    if(listener.f === event) return delete _this.listeners[listener.i];
                }
    
                return false
            }
    
            completed(event){
                _this.invoke(event)
    
                _this.prepare({
                    name: event,
                    completed: true
                })
            }
    
            onChain(...events){
                let func = events.find(event => typeof event === "function");
    
                for(const event of events){
                    _this.on(event, func);
                }
    
                return _this.target || _this
            }
    
            destroy(){
                this.listeners.clear();
                this.events.clear();
                ["on", "off", "invoke", "once"].forEach(method => this[method] = () => {});
                delete this.target;
            }
        })()
    }
    
    LS.GlobalEvents = new LS.EventHandler(LS)
        return LS
    })();
    
    const v5 = (exports => {
    return exports();
    })(() => {
    
    const LS = {
        isWeb: typeof window !== 'undefined',
        version: "5.0.0",
        v: 5,
    
        components: new Map,
    
        EventHandler: class EventHandler {
            constructor(target){
                this.events = new Map;
   
                this.listeners = [];

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
                // this.listeners.push(callback)
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
    
            async invoke(event, ...data){
                event = event._isEvent? event: this.events.get(event);
    
                if(!event) return [];
    
                const returnData = [];
                let removedEvents = false;
    
                for(const listener of this.listeners){
                    if(!listener || listener._remove || typeof listener.callback !== "function") continue;
                    
                    if(listener.once) {
                        listener._remove = removedEvents = true
                    }
                    
                    try {
                        returnData.push(await listener(...data));
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
    
            completed(evnt){
                this.invoke(evnt)
    
                this.prepare(evnt, {
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
    
    });
    
    return {v4, v5}})();


    (function () {
      
        function benchmark(name, fn, iterations = 1e6) {
          const start = performance.now();
          for (let i = 0; i < iterations; i++) fn();
          const end = performance.now();
          const timeTaken = end - start;
        //   results.push({ name, time: timeTaken });
          console.log(`${name}: ${timeTaken.toFixed(2)}ms`);
        }
      
        function runBenchmarks(bench) {
          console.log(`\nBenchmarking ${bench.version}...\n`);
          // Bench LS.Tiny.O
          benchmark(`${bench.version} Tiny.O - simple`, () => bench.Tiny.O('body'), 1e5);
          benchmark(`${bench.version} Tiny.O - complex`, () => bench.Tiny.O('.class1 .class2 > .class3'), 1e5);
      
          // Bench LS.Tiny.Q
          benchmark(`${bench.version} Tiny.Q - simple`, () => bench.Tiny.Q('.multi-class'), 1e5);
          benchmark(`${bench.version} Tiny.Q - complex`, () => bench.Tiny.Q('.parent > .child, .sibling + .next'), 1e5);
      
          // Bench LS.Tiny.N
        //   benchmark(`${bench.version} Tiny.N`, () => bench.Tiny.N('div', { className: 'test-class' }), 1e5);
      
          // Bench LS.EventResolver
          const eventResolver = new bench.EventResolver();
          const handler = () => {};
          benchmark(`${bench.version} EventResolver.invoke (no listener)`, () => eventResolver.invoke('test-event', {}), 1e6);
          benchmark(`${bench.version} EventResolver.on`, () => eventResolver.on('test-event', handler), 2500);
          benchmark(`${bench.version} EventResolver.on (round 2)`, () => eventResolver.on('another-event', handler), 2500);
        //   benchmark(`${bench.version} EventResolver.once`, () => eventResolver.once('test-event', handler), 5000);
          benchmark(`${bench.version} EventResolver.invoke`, () => eventResolver.invoke('test-event', {}), 5000);

          if(eventResolver.events instanceof Map) {
              const v5_event = eventResolver.events.get("test-event")
              benchmark(`${bench.version} EventResolver.invoke (v5 direct access optimization)`, () => eventResolver.invoke(v5_event, {}), 5000);
              eventResolver.flush()
          }
          return
        }
      
        // Running benchmarks for v4 and v5
        runBenchmarks({ version: 'LS v5', Tiny: bench.v5.Tiny, EventResolver: bench.v5.EventHandler });
        runBenchmarks({ version: 'LS v4', Tiny: bench.v4.Tiny, EventResolver: bench.v4.EventHandler });

        eventResolver = null
      })();
      