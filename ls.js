/*] default {*/
String.prototype.replaceAll||(String.prototype.replaceAll=function(a,b){return"[object regexp]"===Object.prototype.toString.call(a).toLowerCase()?this.replace(a,b):this.replace(new RegExp(a,"g"),b)});

if(!LS){
    let isWeb = typeof window !== 'undefined', global = isWeb? window : global || globalThis;

    if(!global.hasOwnProperty("Globalise")){
        // Outdated code

        global.Globalise = function (...objects){
            for(let object of objects){
                for(let property of Object.keys(object)){
                    global[property] = object[property]
                }
            }
        }
    }

    var LS = {
        isWeb,

        // To be removed
        get CDN(){
            console.warn("[LS Warning] LS.CDN is marked for removal and should not be used anymore");
            return '/*] switch_dev(http://cdn.extragon.test, https://cdn.extragon.cloud) */'

            // Future syntax proposal
            return _akeno.exec(function (){
                return backend.dev? "thing": "thing"
            })
        },

        Util:{
            resolve(...array){

                // Takes a list of elements or element-like structure and cleans the array to a definite array of elements

                return array.flat(Infinity).map(element => {
                    if(element && element.tagName) return element;

                    return [...N("temp", element).childNodes];
                }).flat();
            },

            objectPath(o,s,v,splitter,strict=false){
                // s=s.replace(/\[(\w+)\]/g,splitter+'$1');
                // s=s.replace(new RegExp("^\\"+splitter),'').replace(new RegExp("\\"+splitter+"+","g"),splitter);
                // if(s=="")return o;
                // let a=s.split(splitter);
                // for(let [i,k] of a.entries()){
                //     if(k in o){
                //         o=o[k];
                //     }else{
                //         if(strict)return null;
                //         o[k]=(i==a.length-1)?v||{}:{};o=o[k];
                //         if(i==a.length-1)return o;
                //     }
                // }
                // return o;
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
                let legacyHandle = LS.Util.RegisterMouseDrag(element, options.exclude || false, options);
                return legacyHandle;
            },

            RegisterMouseDrag(handle, exclude = false, options = {}){
                if(!handle || !O(handle)) throw "Invalid handle!";

                console.warn("Note: You are using LS.Util.RegisterMouseDrag - this has been replaced by LS.Util.touchHandle. It is recommended to migrate. Backwards compatibility so far is supported.")

                let events = new(LS.EventResolver()), cancelled = false;

                options = {
                    buttons: [0, 1, 2],
                    ...options
                }

                if(options.cursor) events.cursor = options.cursor;
                
                events.target = handle //The target will change based on the event target!

                function move(event) {
                    if(cancelled) return;

                    event.preventDefault()

                    let x = event.type == "touchmove"? event.touches[0].clientX : event.clientX, y = event.type == "touchmove"? event.touches[0].clientY : event.clientY;
                    events.invoke("move", x, y, event)
                    if(options.onStart) options.onStart(event, cancel, x, y)
                }

                function cancel() {
                    cancelled = true
                }
    
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

                    if(evt.type == "destroy")
                        if(options.onDestroy) options.onDestroy(evt);
                    else 
                        if(options.onEnd) options.onEnd(evt);
                }

                function start(event){
                    event.preventDefault()
                    if(typeof exclude == "string" && event.target.matches(exclude)) return;
                    if(!exclude && event.target !== handle) return;

                    if(event.type == "mousedown" && !options.buttons.includes(event.button)) return;
                    
                    events.seeking = true;

                    let x = event.type == "touchstart"? event.touches[0].clientX : M.x, y = event.type == "touchstart"? event.touches[0].clientY : M.y;

                    events.invoke("start", event, cancel, x, y)
                    if(options.onStart) options.onStart(event, cancel, x, y)

                    if(cancelled) return events.seeking = false;

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
                    r.append(...LS.Util.resolve(...a));
                    return r.self
                },

                addBefore(a){
                    LS.Util.resolve(a).forEach(e=>r.parentNode.insertBefore(e,r))
                    return r
                },

                addAfter(a){
                    LS.Util.resolve(a).forEach(e=>r.parentNode.insertBefore(e,r.nextSibling))
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

                // ! Deprecated !
                move(){
                    console.warn("You are using element.move from LS! This is strongly discouraged and deprecated. Use element.addTo instead.");
                    return r.addTo
                },

                wrapIn(e){
                    r.addAfter(e);
                    e.appendChild(r);
                    return r
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
                    r.style.display = displayOverride || r.attr("ls-hide-originaldisplay") || "inherit";
                    return r
                },

                applyStyle(rules){
                    if(typeof rules !== "object") throw new Error("First attribute of \"applyStyle\" must be an object");
                    for(const rule in rules){
                        if(!rules.hasOwnProperty(rule))continue;
                        r.style[rule] = rules[rule]
                    }
                },

                getStyle(){
                    return getComputedStyle(r)
                },

                set:(...a)=>{
                    r.innerHTML = '';
                    return r.add(...a)
                },

                clear(){r.innerHTML='';return r},

                setText:(a)=>{
                    r.innerText=a
                },

                has(...a){
                    return !!a.find(l => r.get(l))
                },

                watch:c => E(r, c),

                parent: (n = 0) => r.tagName == 'BODY' ? r.parentElement : (n > 0 ? O(r.parentElement).parent(n - 1) : r.parentElement),

                findParent(match,limit='html'){
                    return r.path().reverse().find(e=>e.matches(match)||e.matches(limit))
                },

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
            Q: (e, q) => {
                let elements = (e?.tagName && !q ? [e] : [...(e?.tagName ? e : document).querySelectorAll(e?.tagName ? !q ? '*' : q : typeof e == 'string' ? e : '*')])?.map(r => {
                    if(!r._affected){

                        let methods = LS.TinyFactory(r);
                        
                        Object.defineProperties(r, Object.getOwnPropertyDescriptors(methods))

                        if(r.tagName == "BR") r.removeAttribute("clear"); // Fixes a bug (i think?)

                        Object.defineProperty(r, "loading", {
                            get(){
                                return r.hasAttribute("load")
                            },
                            set(v){
                                r[v?"setAttribute":"removeAttribute"]("load","")
                            }
                        });
                    }
                    return r.self
                }),
                bulk = {
                    all(prop){
                        if(prop)for(const [i,a] of elements.entries()){
                            prop(a,i)
                        }
                        if(!prop){
                            function each(func,...attr){
                                elements.forEach(e=>e[func](...attr))
                            }
                            let r={};
                            for(const name of ['class','attr','add','set','clear','applyStyle','attrAssign','delAttr','on']){
                                r[name]=function(...attr){each(name,...attr)}
                            }
                            return r;
                        }
                    }
                };

                return Object.assign(elements, bulk)
            },

            O(...selector){
                return LS.Tiny.Q(...selector.length < 1? ['body'] : selector)[0]
            },

            D: () => {
                console.warn("You are using D() which is deprecated and should be removed.");
                return document
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

            S(e,s){
                console.warn("LS.Tiny.S is deprecated")

                return !s?!e?O():(e.id!==void 0)?getComputedStyle(e):
                typeof e=='string'?O(e):Object.keys(e).map(f => f + ':' + e[f]).join(';'):

                (Array.isArray(e) ? e : !e ? [O()] : [e]).forEach(m => {
                    m = typeof m == 'string' ? O(m) : m;
                    Object.assign(m.style, s)
                })
            },

            E: (b, c) => {
                console.warn("LS.Tiny.E is deprecated")
                if (typeof c != 'function') {
                    let _c=c,
                        _b=b;
                    c=()=>{
                        try {
                            O(Q(_b), _c)
                        }catch(e){}
                    };
                    b = O()
                }
                new(window.MutationObserver || window.WebKitMutationObserver)(r => {
                    c([...r[0].addedNodes].map(n => O(n)), [...r[0].removedNodes].map(n => O(n)))
                }).observe(b, {
                    childList: !0,
                    subtree: !0
                });
                return O(b)
            },

            T: (fn, fb, onerror = e => {}) => {
                console.warn("LS.Tiny.T is deprecated")
                let r;
                try {
                    r = fn()
                } catch (e) {
                    r = fb;
                    onerror(e)
                }
                return r
            },

            U(url=location.href){
                console.warn("LS.Tiny.U is deprecated")
                return Object.assign(new URL(url),{
                    goTo(){location.href=url},
                    open(){open(url)},
                    get segments(){return location.pathname.split("/").filter(s=>s)},
                    async fetch(opt){return await fetch(url,opt)},
                    reload(){location.replace(url)},
                    params(specific=!1){if(!url.includes('?')){return specific?null:{}}let o={};url.replaceAll(/(.*?)\?/gi,'').split('&').forEach(e=>{e=e.split('=');o[e[0]]=decodeURIComponent(e?.[1]).replace(/#(.*)/g,"")});return specific?o[specific]:o}
                })
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

            M:{
                x: 0,
                y: 0,
                _GlobalID: {
                    count: 0,
                    prefix: Math.round(Math.random()*1e3)
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
                get GlobalIndex(){
                    M._GlobalID.count++;
                    return +((""+M._GlobalID.prefix)+(""+M._GlobalID.count))
                },
                get GlobalID(){return M.GlobalIndex.toString(36)},

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

                Component(...list){
                    list = list.filter(c=>!LS[c])
                    if(list.length<1)return;
                    return M.Script(LS.CDN+"/ls/js/2/@Bare,"+list.join(",").replaceAll(/[ \n/?]/g,""))
                },

                StyleComponent(...list){
                    return M.Style(LS.CDN+"/ls/css/2/@Bare,"+list.join(",").replaceAll(/[ \n/?]/g,""))
                },

                Document(url, target){
                    return new Promise((r,j)=>{
                        fetch(url)
                            .then(async q=>{
                                q = await q.text();
                                (O(target)||O()).add(q);
                                r()
                            })
                            .catch(e=>j(e.toString()))
                    })
                },
                loop(t,...f){
                    for(let i=0;i<t;i++){
                        for(const fn of f){
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
                    console.warn(`[LS Framework] Duplicate component name ${name}, import was ignored`);
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

                    if(attributes[0] instanceof Element){
                        attributes[0] = O(attributes[0]);

                        if(id && attributes[0].attr("ls-component") === id.toLowerCase()) {
                            let previous = LS[name].list[id]
                            if(previous) return previous
                        }

                        attributes[0].attr("ls-component", name.toLowerCase())
                    }

                    let ClassInstance = new((LS[name].class)({})) (id, ...attributes);

                    if(LS[name].conf.events) ClassInstance.Events = new (LS.EventResolver())(ClassInstance);

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

                if(LS[name].conf.events) LS[name].Events = new (LS.EventResolver()) (LS[name]);

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
                        if(previous) LS[name].batch(selector);

                        // Deprecated here! To be updated
                        E(parent, async(elements, r)=>{
                            for(const element of elements){
                                if(element.matches(selector)){
                                    LS[name].new((await LS[name].invoke("observer_element_added", element)).filter(h=>h)[0]||m.id||"observed_"+M.GlobalID, element)
                                }
                            }
                        })

                        return "Observer added for \""+ name +"\" looking for any "+selector;
                    }

                    if(LS.invoke){
                        LS.invoke("componentLoad", name)
                        LS.invoke("componentLoad:" + name)
                    }
                }
            }
        }
    }
    /*]part(tiny)*/
    if(isWeb){
        Globalise(LS.Tiny);

        M
        .on("mousemove", "touchmove", e =>{
            let source = (e.type !== "mousemove" ? e.touches[0] : e);
            M.x = source.clientX
            M.y = source.clientY
        })
        .on("keydown", e => {
            M.lastKey = e.key;
            if(e.key == "Shift") M.ShiftDown = true;
            if(e.key == "Control") M.ControlDown = true;
        })
        .on("keyup", e => {
            M.lastKey = e.key;
            if(e.key == "Shift") M.ShiftDown = false;
            if(e.key == "Control") M.ControlDown = false;
        })
        .on("mousedown", () => M.mouseDown = true)
        .on("mouseup", () => M.mouseDown = false);

        O(document.documentElement)

        let loading, loaded;
        M.on("keydown", async(event) => {
            if(loading || window.LSFrame)return;
            if (event.ctrlKey && event.altKey && event.key === "c") {
                if(!LS.ToolBox && !loaded){
                    loading = true;
                    LS._debugToolBoxShow = true;
                    await M.Component("toolbox")
                    loading = false;
                    loaded = true
                    return
                }
                LS.ToolBox.toggle();
            }
        });

        if(global.customElements)
        customElements.define('ls-group', class extends HTMLElement {
            constructor(){
                super();
            }
            connectedCallback(){
                // Temporary solution, of course. Add accessibility later.

                let _this = this;
                
                if(O(this).hasAttr("radio")){
                    let _value = null;
                    Object.defineProperty(this, "value", {
                        set(value){
                            let element = _this.getAll('[value="' +value+ '"], [name="' +value+ '"], [id="' +value+ '"]')[0]
                            if(element){
                                _value = value
    
                                _this.attr("value", value);
                
                                _this.getAll("[ls-selected]").all().delAttr("ls-selected");
                                element.attrAssign("ls-selected")
                            }
                        },
                        get(){
                            return _value
                        },
                        configurable: true
                    })

                    for(let option of [...this.children]){
                        O(option).on("click", ()=>{
                            _this.value = option.attr("value") || option.attr("name") || option.id || null;
                        })
                    }

                    if(this.hasAttr("value")) _this.value = this.attr("value")
                }
            }
        });
    }
    /*]end*/
}

/*]

end
part(manipulator)*/
String.prototype.manipulate = function(mapper = " *:"){return LS.Util.Manipulate("" + this, mapper)}
String.prototype.manip = String.prototype.manipulate;
/*]end*/

/*] part(EventResolver) {*/
LS.LoadComponents({
    /*]
    import(
        ls-js/eventresolver.js
        : EventResolver :  js
    )
    */
})
LS.GlobalEvents = new(LS.EventResolver())(LS)

;(()=>{

    LS.once("body-available", ()=>{
        LS._topLayer = N({id: "ls-top-layer", attr: "ls"});
        LS._topLayerInherit = function (element = document.body) {
            O(element);
            LS._topLayer.attrAssign({
                "ls-theme": element.attr("ls-theme"),
                "ls-style": element.attr("ls-style"),
                "ls-accent": element.attr("ls-accent")
            })
        }

        LS._topLayerInherit()

        O().addAfter(LS._topLayer)

        LS.GlobalEvents.prepare({
            name: "body-available",
            completed: true
        })
    })

    if(document.body) LS.invoke("body-available"); else M.on("load", () => LS.invoke("body-available"));
})();
/*]}*/

LS.LoadComponents({
    /*]
    set(type::js)

    import(
        ls-js/modal.js
        : Modal $type,

        ls-js/tabs.js
        : Tabs $type,

        ls-js/dragdrop.js
        : DragDrop $type,

        ls-js/timeline.js
        : Timeline $type,

        ls-js/nav.js
        : Nav $type,

        ls-js/list.js
        : List $type,

        ls-js/select.js
        : Select $type,

        ls-js/tooltips.js
        : Tooltips $type,

        ls-js/tree.js
        : Tree $type,

        ls-js/present.js
        : Present $type,

        ls-js/resize.js
        : Resize $type,
        
        ls-js/progress.js
        : Progress $type,

        ls-js/color.js
        : Color $type,
        
        ls-js/graphgl.js
        : GraphGL $type,
        
        ls-js/patchbay.js
        : PatchBay $type,
        
        ls-js/knob.js
        : Knob $type,
        
        ls-js/multiselect.js
        : MultiSelect $type,
        
        ls-js/workspace.js
        : Workspace $type,

        ls-js/toast.js
        : Toast $type,

        ls-js/native.js
        : Native $type,

        ls-js/toolbox.js
        : ToolBox $type,

        ls-js/deprecated/dialog.js
        : Dialog $type,

        ls-js/deprecated/terminal.js
        : Terminal $type,

        ls-js/deprecated/editor.js
        : Editor $type,

        ls-js/deprecated/fragment.js
        : Fragment $type,

        ls-js/deprecated/form.js
        : Form $type,

        ls-js/deprecated/steps.js
        : Steps $type,

        ls-js/deprecated/debugger.js
        : Debugger $type,

        ls-js/deprecated/chips.js
        : Chips $type,

        ls-js/deprecated/notif.js
        : Notif $type,

        ls-js/deprecated/react.js
        : NanoReact $type,

        ls-js/deprecated/menubar.js
        : Menubar $type
    )
    */
});

/*]
part(Knob) {
*/
customElements.define('ls-knob', class extends HTMLElement {
    constructor(){
        super();
    }
    connectedCallback(){
        if(O(this).hasClass("manual-init"))return this.class("manual-init", 0);
        this.ls = LS.Knob(this.id || M.GlobalID, this)
    }
});
/*]}
part(Menu) {
*/
customElements.define('ls-nav', class extends HTMLElement {
    constructor(){
        super();
    }
    connectedCallback(){
        if(O(this).hasClass("manual-init"))return this.class("manual-init", 0);
        this.ls = LS.Nav(this.id || M.GlobalID, this)
    }
});

M.on("load", ()=>{
    Q("[ls-not-ready]").all(e=>e.ready())
})

/*]}*/