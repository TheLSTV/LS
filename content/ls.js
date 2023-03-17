String.prototype.replaceAll||(String.prototype.replaceAll=function(a,b){return"[object regexp]"===Object.prototype.toString.call(a).toLowerCase()?this.replace(a,b):this.replace(new RegExp(a,"g"),b)});
if(!window?.Globalise){window.Globalise=(...b)=>b.map(a=>typeof(a)=='string'?(()=>window[a]=window?.[a]||null)():Array.isArray(a)?a.map(v=>window[v]=window?.[v]||null):Object.keys(a).map(v=>window[v]=a[v]))}


if(!LS)var LS={
    /*--part--(tiny){*/
    Util:{
        resolve(...a){
            return a.flat(Infinity).map(i=>{
                if(i?.tagName)return i;
                return [...N("temp",i).childNodes];
            }).flat();
        }
    },
    Tiny:{
        Q: (e, q) => Object.assign((e?.tagName && !q ? [e] : [...(e?.tagName ? e : D()).querySelectorAll(e?.tagName ? !q ? '*' : q : typeof e == 'string' ? e : '*')])?.map(r => {
            if(!r._affected)Object.assign(r, {
                _affected:!0,
                isElement:!0,
                attr(specific=!1,value=!1){
                    if(value){r.setAttribute(specific,value);return value};
                    if(specific)return r.getAttribute(specific);
                    let a = r.attributes,
                        c = {};
                    Object.keys(a).map(b => c[a[b].nodeName] = a[b].nodeValue);
                    return specific ? c[specific] : c
                },
                attrAssign(a){
                    if(typeof a=="string")a={Array:[a]};
                    if(Array.isArray(a))a={Array:a};
                    Object.keys(a).forEach(k=>{
                        if(k=='Array'){
                            a[k].map(_=>_&&r.setAttribute(_,''));
                            return
                        }
                        (k&&r.setAttribute(k,a[k]||''))
                    })
                },
                delAttr(...a){a=a.flat(2);a.forEach(a=>r.removeAttribute(a))},
                class(names,action=1){
                    if(typeof names=="undefined")return [...r.classList];
                    if(typeof names=="string")names=names.split(" ");
                    for(let c of names){
                        r.classList[(action=="add"||(!!action&&action!=="remove"))?"add":"remove"](c)
                    }
                    return r
                },
                hasClass(...names){
                    let h=!0;
                    names=names.flatMap(c=>{
                        if(!r.classList.contains(c))h=!1
                    })
                    return h
                },
                get:(t='*')=>O(r, t),
                getChildern:q=>Q(r.query()+'>'+q||'*'),
                child:i=>r.children[i||0],
                getAll: (t = '*') => Q(r, t),
                add:(...a) =>{
                    r.append(...LS.Util.resolve(...a));
                    return r.self
                },
                addBefore(a){
                    LS.Util.resolve(a).forEach(e=>r.parentNode.insertBefore(e,r))
                },
                addAfter(a){
                    LS.Util.resolve(a).forEach(e=>r.parentNode.insertBefore(e,r.nextSibling))
                },
                addOnce(a){
                    if (!O('#' + a.id)) r.add(a)
                },
                on:(e,l)=>{
                    r.addEventListener(e,l);
                    return r.self
                },
                setStyle: (...a) => O(r.self, ...a),
                getStyle:_=>O(r.self),
                set:(...a)=>{
                    r.innerHTML = '';
                    return r.add(...a)
                },
                setText:(a)=>{
                    r.innerText=a
                },
                has:(...a)=>{
                    return !!a.find(l => r.get(l))
                },
                watch:c=>E(r, c),
                parent: (n = 0) => r.tagName == 'BODY' ? r.parentElement : (n > 0 ? O(r.parentElement).parent(n - 1) : r.parentElement),
                self:r,
                path:()=>{
                    let p=[r],
                        i=0;
                    while(p[p.length - 1]?.tagName != 'HTML') {
                        p.push(r.parent(i));
                        i++
                    }
                    return p.reverse()
                },
                query:()=>r.path().map(r => r.tagName + (r.className ? '.' + r.className.replace(/\s/g, '.') : '') + (r.id ? '#' + r.id : '')).join('>'),
                queryPath: r.query
            });
            return r.self
        }),{
            all(prop){
                for(const [i,a] of this.entries()){
                    prop(a,i)
                }
            }
        }),
        O: (...e) => {
            e=e.length<1?['body']:e;
            return Q(...e)[0]
        },
        D: () => document,
        N:(e='div',o)=>{
            if(typeof e!="string"){o=e;e="div"}
            o=(typeof o=='string'?{innerHTML:o}:Array.isArray(o)?{inner:o}:o)||{};
            let tmp={};
            if(o.class){tmp.class=o.class;delete o.class}
            let n=O(Object.assign(D().createElement(e),o));
            if(o.attr)n.attrAssign(o.attr);
            if(tmp.class)n.class(tmp.class);
            if(o.style&&typeof o.style=="object")S(n,o.style);
            if(o.inner||o.content)n.add(o.inner||o.content);
            return n
        },
        S:(e,s)=>!s?!e?O():(e.id!==void 0)?getComputedStyle(e):typeof e=='string'?O(e):Object.keys(e).map(f => f + ':' + e[f]).join(';') : (Array.isArray(e) ? e : !e ? [O()] : [e]).forEach(m => {
            m = typeof m == 'string' ? O(m) : m;
            Object.assign(m.style, s)
        }),
        E: (b, c) => {
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
            return Object.assign(new URL(url),{
                goTo(){location.href=url},
                open(){open(url)},
                async fetch(opt){return await fetch(url,opt)},
                replace(){location.replace(url)},
                params(specific=!1){if(!url.includes('?')){return specific?null:{}}let o={};url.replaceAll(/(.*?)\?/gi,'').split('&').forEach(e=>{e=e.split('=');o[e[0]]=decodeURIComponent(e?.[1]).replace(/#(.*)/g,"")});return specific?o[specific]:o}
            })
        },
        M:{x:0,y:0,_GlobalID:{count:0,prefix:Math.round(Math.random()*1e3)},lastKey:null,mouseDown:!1,on(...evt){addEventListener(...evt);return M},
            get GlobalIndex(){
                M._GlobalID.count++;
                return +((""+M._GlobalID.prefix)+(""+M._GlobalID.count))
            },
            get GlobalID(){return M.GlobalIndex.toString(36)}
        }
    }
    /*--}*/
}
/*--part--(tiny){*/
Globalise(LS.Tiny);
M.on("mousemove",e=>{M.x=e.clientX;M.y=e.clientY}).on("keypress",e=>M.lastKey=e.key).on("mousedown",e=>M.mouseDown=!0).on("mouseup",e=>M.mouseDown=!1);
/*--}*/

((c)=>{
    Object.keys(c).forEach(D=>{
        if(LS[D]){console.warn("[LS] Duplicate component name \""+D+"\"");return};
        function instance(...a){
            if(LS[D].isFunction)return (LS[D].class({}))(...a);
            if(a[0] instanceof Element)a[0]=a[0].id||"default";
            return LS[D].list[a[0]||"default"]||LS[D].new(...a);
        }
        LS[D]=function Component(...a){return instance(...a)};
        LS[D].new=function(id,...a){
            if(a[0] instanceof Element){
                a[0]=O(a[0]);
                if(a[0].attr("ls-component")==D.toLowerCase())return LS[D].list[id]||undefined;
                a[0].attr("ls-component",D.toLowerCase())
            }
            let i=new((LS[D].class)({}))(id,...a);
            i.listeners=[];i.events=[];
            i.on=function(type,evt,extra){this.listeners.push({for:type,f:evt,id:M.GlobalID,...extra});return this}
            i.once=function(type,evt,extra){this.on(type,evt,{once:true,...extra});return this}
            i.invoke=function(evt,...a){if(!this.events.includes(evt))this.events.push(evt);this.listeners.filter(l=>l.for==evt).forEach(e=>{e.f(...a);if(e.once)this.listeners=this.listeners.filter(e=>e.id!==e.id)})}
            if(i._init)i._init();
            if(id)LS[D].list[id]=i;
            return i
        }
        LS[D].set=function(key,value){LS[D][key]=value};
        LS[D].list={};
        LS[D].class=((c[D])(LS[D]));
        if(LS[D].isSingular){
            LS[D]=LS[D].new("global")
        }else{
            LS[D].registerGroup=(e,conf)=>{
                e=[...O(e).children];
                e.forEach(m=>{
                    new LS[D].new(m.id||"default",m,conf)
                })
            }
            LS[D].batch=(a,conf)=>{
                if(typeof a=="string")a=Q(a);
                a.forEach(a=>new LS[D].new(a.id||"default",a,conf))
            }
            LS[D].observe=(parent,onAdded)=>{
                E(parent,(a,r)=>{
                    a.forEach(m=>{
                        if(m.tagName=="tabs"){
                            
                        }
                    })
                })
            }
        }
    })
})({
    /*--part--(events){*/
    Events(g){
        g.isSingular=!0;
        return(_this)=>class EventClass{}
    },
    /*--}--part--(modal){*/
    Modal(){
        return(_this)=>class Modal{
            constructor(id,content=N(),opt={}){
                _this=this;
                this.options=Object.assign({target:O()},opt);
                this.isOpen=false;
                this.contentElement=content;
                this.element=N("div",{
                    attr:{"ls-modal":"true"},
                    className:"closed",
                    style:opt.style,
                    onclick:e=>{if(opt.cancelable&&O(e.target).attr("ls-modal"))this.hide()},
                    inner:[content]
                });
                (this.options.target||O()).add(this.element);
                this.open=_this.show;
                this.close=_this.hide;
            }
            show(){
                _this.element.style.zIndex=LS.Modal.layer||5000;
                LS.Modal.layer=(LS.Modal.layer||5000)+1;
                _this.invoke("open");
                _this.element.class('closed',0);
                _this.isOpen=!0;
            }
            hide(){
                _this.invoke("close");
                _this.element.class("closed");
                if(_this.options.onclose)_this.options.onclose();
                _this.isOpen=!1;
                if(_this.options.keep===!1){setTimeout(()=>_this.destroy(),1000)};
            }
            destroy(){
                _this.element.remove()
            }
        }
    },
    /*--}--part--(dialog){*/
    Dialog(global){
        global.set("isFunction",!0);
        return(_this)=>(opt={})=>{
            opt=Object.assign({
                title:"Alert",
                content:"",
                cancelable:true,
                buttons:[
                    {text:"OK"},
                    {text:"Cancel",color:"gray"},
                ],
                loading:false,
                keep:!1,
                use:!1
            },opt);
            let m=new LS.Modal.new(null,!opt.use?N('div',{
                inner:[
                    N('span',{
                        inner:[N("b",opt?.title?opt.title+"<br>":""),N("span",opt?.content?.trim?.())]
                    }),
                    N('div',{
                        inner:opt.loading?[N("div",{attr:["ls-load"]})]:opt.buttons?.map?.(b=>N('button',Object.assign({attr:["ls","fluent",b.color?"ls-"+b.color:'ls-blue'],inner:b.text},(b?.element||{})))),
                        attr:["dialog_bottom"]
                    })
                ],
                attr:["ls-dialog-body","ls-modal-body"]
            }):opt.use,opt)
            m.element.getAll("button").forEach(e=>e.on("click",m.close))
            setTimeout(()=>m.show(),20);
            return {
                element:m.element,
                close:m.hide,
                hide:m.close,
                open:m.show,
                show:m.open,
                destroy:m.destroy
            }
        }
    },
    /*--}--part--(tabs){*/
    Tabs(){
        return(_this)=>class Tabs{
            constructor(id,e=O("tabs"),opt={}){
                if(typeof e=="string")e=Q(e);
                if(!e)throw"No element provided";
                _this=this;
                this.element=O(e);
                this.opt=Object.assign({list:!0,listClass:"",listItemClass:"",listClickable:!0,noStyle:!1,listElement:null,infinite:!0},T(()=>JSON.parse(_this.element.attr("tab-options")),{}),opt);
                this.tabs=this.opt.select?O(e).getAll(this.opt.select):[...O(e).children];
                this.list=[];
                if(this.opt.listElement)_this.opt.listElement.className=_this.opt.listElement.className+" tablist "+_this.opt.listClass;
                if(this.opt.list){_this._list=_this.opt.listElement||N("div",{className:"tablist "+_this.opt.listClass});if(!_this.opt.listElement)O(e).prepend(_this._list)}
                this.tabs.forEach(t=>this.register(t));
            }
            _init(){
                _this.update();
                _this.setActive(0);
            }
            setActive(t,force=0){
                if(typeof t=="number")t=_this.list[t];
                let id=t.attr("for"),h=O("[tab-id=\""+id+"\"]"),index=_this.list.indexOf(t);
                if(_this.activeTab==id&&!force)return;
                _this.list.forEach(t=>t.classList.remove("active"));
                t.classList.add("active");
                _this.tabs.forEach(t=>t.style.display="none");
                h.style.display="";
                _this.element.attr("active-tab",id);
                _this.activeTab=id;
                _this.tab=index;
                _this.invoke("tab_changed",index)
            }
            update(){

            }
            add(title,content=N(),opt={}){
                let e=N("tab",{
                    inner:content,
                    attr:{"tab-title":title}
                });
                if(opt.id)e.id=opt.id;
                this.element.add(e);
                _this.tabs.push(e)
                this.register(e);
                return e.id;
            }
            remove(id){
            }
            register(t){
                t=O(t);
                if(!t.attr("tab-id"))t.attr("tab-id",t.id||"tab_"+M.GlobalID);
                let nt=N("div",{innerHTML:t.attr("tab-title"),attr:{for:t.attr("tab-id")},className:"_tab "+(_this.opt.noStyle?"":"_tab_style ")+_this.opt.listItemClass,onclick:function(){if(_this.opt.listClickable)_this.setActive(this)}});
                _this.list.push(nt)
                if(_this.opt.list)_this._list.add(nt);
            }
            unregister(t){
                
            }
            next(){
                _this.tab=_this.tab>_this.length()-2?_this.opt.infinite?0:_this.tab:_this.tab+1;
                _this.setActive(_this.tab)
            }
            previous(){
                _this.tab=_this.tab<1?_this.opt.infinite?_this.length()-1:_this.tab:_this.tab-1;
                _this.setActive(_this.tab)
            }
            length(){
                return _this.tabs.length
            }
        }
    },
    /*--}--part--(steps){*/
    Steps(){
        return(_this)=>class Steps{
            constructor(id,e=O("steps"),o={}){
                _this=this;
                e=O(e);
                if(!o.prevBtn){o.prevBtn=N("button","Previous");e.add(o.prevBtn)};
                if(!o.nextBtn){o.nextBtn=N("button","Next");e.add(o.nextBtn)};
                this.opt=Object.assign({listElement:null,doneText:"Done",select:"step"},o);
                this.tabs=LS.Tabs.new("step_tabs_"+id,e,{listClass:"ls-steps",select:this.opt.select,listItemClass:"ls-steps-item",noStyle:true,listElement:this.opt.listElement,infinite:!1,listClickable:!1});
                this.options={};
                this.element=e;
                this.stack=[];
                this.step=0;
                this.stepIndex=this.tabs.tab;
                let nb=O(this.opt.nextBtn),pb=O(this.opt.prevBtn),nt=nb.innerHTML;
                nb.onclick=()=>{if(_this.step==this.stack.length-1){_this.updateOptions();_this.invoke("done",_this.options)}_this.next()};
                pb.onclick=_this.previous;
                this.updateStack();
                this.tabs.on("tab_changed",(i)=>{
                    this.stepIndex=i;
                    this.invoke("step_changed",i);
                    let rq=this.tabs.tabs[i].attr("required");
                    _this.setCanContinue(!0);
                    if(rq&&!this.options[rq])_this.setCanContinue(!1);
                    nb.innerHTML=i==this.tabs.length()-1?this.opt.doneText:nt;
                    S(pb,{opacity:i!=0?"1":".4"})
                })
            }
            _init(){
                this.reset();
            }
            setCanContinue(v=!0){
                S(_this.opt.nextBtn,{opacity:v?"1":".4","pointer-events":v?"all":"none"})
            }
            next(){
                _this.updateStack()
                if(_this.step<_this.stack.length-1)_this.tabs.setActive(_this.stack[(_this.step++)+1])
            }
            previous(){
                _this.updateStack()
                if(!_this.step<1)_this.tabs.setActive(_this.stack[(_this.step--)-1])
            }
            updateStack(){
                _this.stack=[];
                for(const [i,e] of _this.tabs.tabs.entries()){
                    let pass=!(e.attr("if")?e.attr("if").split(";").map(c=>c.split("=")).find(a=>_this.options[a[0]]==a[1]):!0);
                    _this.tabs.list[i].style.display=pass?"none":"";
                    if(pass){continue}
                    _this.stack.push(i)
                }
                _this.stack.forEach((e,i)=>{
                    e=_this.tabs.list[e];
                    e.class(["last-child","only-child","first-child"],0);
                    if(_this.stack.length<2){e.class("only-child");return};
                    if(i==0)e.class("first-child");
                    if(i==_this.stack.length-1)e.class("last-child");
                })
            }
            updateOptions(){
                _this.tabs.tabs.forEach(t=>{
                    t.getAll("[option],[option-radio]").forEach((o,i)=>{
                        let isRadio=o.hasAttribute("option-radio");
                        if(!o.attr("group"))o.attr("group",isRadio?t.attr("name")||t.attr("tab-name"):o.attr("name")||o.attr("id")||o.attr("title")||"input"+i);
                        if(isRadio)o.onclick=()=>{
                            re(true);
                            o.classList.toggle("selected");
                        }
                        function re(click=false){
                            let isNull=!!(click&&o.classList.contains("selected"));
                            if(isRadio&&!isNull){
                                _this.element.getAll("[option-radio][group=\""+o.attr("group")+"\"]").forEach(d=>d.classList.remove("selected"));
                            }
                            if(isNull){_this.options[o.attr("group")]=null};
                            if((!click&&((isRadio&&o.classList.contains("selected"))||!isRadio))||(click&&!o.classList.contains("selected"))){
                                _this.options[o.attr("group")]=(o.value||o.attr("value")||o.attr("option-radio")||o.attr("option")||o.attr("title"))
                            }
                            let rq=t.attr("required");
                            if(rq)_this.setCanContinue(_this.options[rq]);
                            if(click)_this.updateStack();
                        }
                        re()
                    })
                })
            }
            reset(){
                _this.setCanContinue(!0);
                _this.options={};
                _this.updateOptions();
                _this.step=0;
                _this.element.getAll("[option].selected").forEach(d=>d.classList.remove("selected"));
                _this.element.getAll("[default]").forEach(d=>d[{IMG:"src"}[d.tagName]||"value"]=O(d).attr("default"))
                _this.tabs.setActive(0,1);
                _this.updateStack()
            }
        }
    },
    /*--}--part--(navbar){*/
    Navbar(){
        return(_this)=>class Navbar{
            constructor(id,e){
                if(!e)e=O("nav[ls]");
                if(!e.get)e=O(e);
                e.attr("tabindex","-1");
                e.getAll("group").forEach(e=>e.attr("tabindex","-1"));
                e.getAll("items").forEach(i=>{
                    i.attr("itemgroup-id",M.GlobalID)
                })
                e.getAll("nav>dropdown,nav>group>dropdown").map(d=>{
                    let s=d.tagName;
                    d.onmouseenter=()=>{
                        if(typeof d.attr("no-drop")=="string")return;
                        e.getAll(s).forEach(q=>q.classList.remove("active"));
                        d.classList.add("active")
                    }
                })
            }
        }
    },
    /*--}--part--(select){*/
    Select(){
        return(_this)=>class Select{
            constructor(id,e){
                if(!e)e=O("select,ls-select");
                _this=this;
                this.selectElement=e;
                this.element=N({attr:{tabindex:1,title:e.attr("title"),"ls-h-scroll":''},class:"ls-select"});
                this.menu=N({attr:{tabindex:1},class:"ls-select-menu",inner:[N("input",{placeholder:"Search",oninput:function(){_this.menu.getAll(".ls-select-option").forEach(e=>e.style.display=(e.innerText+e.attr(this.value)).toLowerCase().replace(/[\s\n:|_]/g,'').includes(this.value.toLowerCase().replace(/[\s\n:|_]/g,''))?"block":"none")}}),"<hr>",N({class:"ls-select-options"})]});
                O().add(this.menu);
                e.style.display="none";
                e.addAfter(this.element)
                e.on("change",()=>this.set());
                M.on("resize",()=>{if(this.shown)this.position()})
                M.on("scroll",()=>{if(this.shown)this.position()},!0)
                this.shown=!1;
                this.element
                    .on("click",()=>this.toggle())
                    .on("keydown",(e)=>{if(e.keyCode==13)this.toggle()});
                addEventListener("click",(e)=>{if(this.shown&&e.target!==this.element){let r=this.menu.getBoundingClientRect();if(!(M.x>r.left&&M.x<r.right&&M.y>r.top&&M.y<r.bottom))this.hide()}})
                this.update();
                this.set()
            }
            get(){
                return _this.element.attr("value")
            }
            set(v=_this.selectElement.value,text){
                _this.selectElement.value=v;
                _this.element.setText(text||v);
                _this.element.attr("value",v);
                this.hide()
            }
            update(){
                _this.menu.get(".ls-select-options").set(_this.selectElement.getAll("optgroup,option,ls-option").map(c=>N(c.tagName=="OPTGROUP"?{inner:c.attr("label"),class:"ls-select-label"}:{inner:c.innerHTML,attr:{value:c.attr("value")||"","ls-h-scroll":''},class:"ls-select-option"+(c.parentElement.tagName=="OPTGROUP"?" ls-select-labeled":""),style:(c.parentElement.hasAttribute("disabled")||c.attr("disabled"))?"opacity:.4;pointer-events:none":"",onclick:function(){_this.set(this.attr("value")||this.innerText,this.innerText)}})));
            }
            toggle(){
                _this[_this.shown?"hide":"show"]()
            }
            show(){
                if(_this.shown)return;
                _this.shown=!0;
                _this.position();
                _this.element.classList.add("open")
            }
            position(){
                let r=_this.element.getBoundingClientRect();_this.menu.style=`left:${r.left}px;width:${r.width}px;top:${r.top+r.height}px;max-height:${Math.min(innerHeight-(r.top+r.height+20),400)}px`;
                S(_this.menu,{display:"block"})
            }
            hide(){
                if(!_this.shown)return;
                _this.shown=!1;
                S(_this.menu,{display:"none"})
                _this.element.classList.remove("open")
            }
        }
    },
    /*--}--part--(chips){*/
    Chips(){
        return(_this)=>class Chips{
            constructor(id,e=O("chips"),options={}){
                e=O(e);
                this.options=Object.assign({},options)
                if(!e)throw"No element selected/found!";
                _this=this;
                this.e=e;
                this.id=id;
                this.updateChips();
                this.filter();
            }
            updateChips(){
                _this.chips=_this.e.getAll("[ls-chip]");
                _this.chips.forEach(c=>c.onclick=function(){_this.chips.filter(a=>a!=this).forEach(e=>e.removeAttribute("selected"));this.toggleAttribute("selected");_this.filter()})
            }
            getSelected(){
                return _this.chips.filter(e=>typeof e.attr("selected")=="string").map(e=>e.attr("ls-chip"))
            }
            filter(){
                if(_this.getSelected().length<1)this.chips[0].attr("selected","");
                Q("[ls-chip-filter*=\""+_this.id+":\"]").forEach(e=>{
                    e.style.display=_this.getSelected().find(s=>e.attr("ls-chip-filter").match(/:(.*)/)[1].split(",").includes(s))?"unset":"none"
                })
            }
        }
    },
    /*--}--part--(tree){*/
    Tree(){
        return(_this)=>class Tree{
            constructor(id,e,data,options={}){
                this.options=Object.assign({class:"tree-view"},options);
                if(!data&&data!==null){data=e;e=null};
                if(options.hadler)this.Handler=options.handler;
                this.Element=O(e);
                this.Element.add(N("ul",{className:this.options.class,attr:{path:"/"}}));
                this.List=this.Element.get("ul");
                if(data)this.Expand(this.List,data);
            }
            async Expand(element,data){
                if(element.tagName!=="SUMMARY"){
                    element=element=element.tagName=="UL"?O(element):O(element).get("ul");
                }else{
                    element=element.parent().get("ul");
                }
                element.set(data.map(d=>{
                    var _this=this,path=(element.attr("path")||'')+"/"+d;
                    return N("li",{inner:[N('details',{inner:[
                        N("summary",{
                            innerHTML:"<span>"+_.escape(d)+"</span>",
                            onclick:async function(){
                                if(this.attr("explored"))return;
                                _this.Expand(this,await _this.Handler(path,this));
                                this.attr("explored","")
                            }
                        }),N("ul",{
                            attr:{
                                path:path
                            }
                        })
                    ]})]})
                }))
            }
            async Handler(path,element){
                return ["yellow","blue","red"]
            }
        }
    },
    /*--}--part--(menubar){*/
    Menubar(){
        return(_this)=>class Menubar{
            constructor(id,e=O("menubar"),options={}){
                if(!e)throw"No element found for menubar.";
                this.element=O(e);

            }
        }
    },
    /*--}--part--(notif){*/
    Notif(){
        return(_this)=>class Notif{
            constructor(id,opt={}){
                this.el=N({class:"ls-notif-area",style:`width:${opt.width||300}px`,inner:[N({class:"ls-notif-scroll",inner:N({class:"ls-notif-container"})}),N({class:"ls-notif-hide",inner:"<i class=bi-caret-down-fill></i>",onclick:()=>{_this.el.classList.toggle("hidden")}})]})
                O().add(this.el)
                _this=this;
            }
            push(c){
                return new Promise(r=>{
                    if(typeof c=="string")c={content:c};
                    c=Object.assign({},c);
                    let e=N({class:"ls-notif",inner:[(c.title?N("b",c.title+"<br>"):""),c.content],style:"color:var(--color-bg)",attr:[c.color?"ls-"+c.color:""]});
                    _this.el.get(".ls-notif-container").add(e);
                    let sc=setInterval(()=>_this.el.get(".ls-notif-scroll").scroll(0,_this.el.get(".ls-notif-scroll").scrollHeight),1);
                    setTimeout(()=>{e.classList.add("shown");setTimeout(()=>{clearInterval(sc);r()},200)},10);
                })
            }
            revoke(){

            }
        }
    },
    /*--}--part--(console){*/
    Console(){
        return(_this)=>class Tree{
            constructor(id,e=O("console"),options={}){
                if(!e)throw"No element found for console.";
                this.element=O(e);
                this.lines=0;
                this.opt=Object.assign({timestamp:!0,proxy:!1,overwrite:!1,highlightJS:!0,scroll:!0,max_lines:350},options)
                _this=this;
                if(_this.opt.overwrite){this._console=Object.assign(console,this.__proto__);console=this};
            }
            addLine(opt,...t){
                if(_this.lines>=_this.opt.max_lines){_this.element.child().remove();_this.lines--;};
                let ts="",indent=0;
                opt=Object.assign({proxy:"log",color:""},opt);
                if(_this.opt.proxy)_this._console[opt.proxy](...t);
                t=t.map(v=>typeof v=="object"?JSON.stringify(v,null,4):typeof v=="function"?"<i>%{#aaa}"+v.toString()+"%{/}</i>":typeof v=="number"?"%{#35f}"+v+"%{/}":typeof v=="boolean"?("%{#a5f}"+(v?"true":"false")+"%{/}"):v)
                let styles=0;
                for(const [i,line] of t.entries()){
                    t[i]=line.split("%{").map(c=>{
                        let i=c.indexOf("}");
                        if(i!=-1){
                            let s=c.split("}")[0];
                            if(s=="/"){return(styles>0?(styles--)+1&&"</span>":"")+c.substring(i+1)}
                            styles++;
                            return"<span style=\""+s.split(";").map(s=>{
                                if(!s.includes(":")){return s.split(",").map((v,i)=>`${["color","background","outline","font-style","font-weight","text-decoration","cursor"][i]||"color"}:${v||"unset"}`).join(";")}else{return s}
                            }).join(";")+"\">"+c.substring(i+1)
                        }
                        return c;
                    }).join("")
                }
                if(this.opt.timestamp){
                    ts=new Date;
                    ts=`[${ts.getMonth()+1}.${ts.getDate()}.${ts.getFullYear()} ${ts.getHours()}:${ts.getMinutes()}:${ts.getSeconds()}] `;
                    indent=ts.length;
                    ts=`<span style=color:gray>${ts}</span>`;
                }
                ts=(opt.proxy!=="log"?` <i class=bi-${{error:'x-circle-fill',info:'info-circle-fill',warn:'exclamation-triangle-fill',success:'check-circle-fill'}[opt.proxy]||""}></i> `:"")+ts;
                let result=N("span",{innerHTML:`<span style=color:${opt.color||_this.opt.color||'inherit'}>${ts}${t.join("\n"+" ".repeat(indent))}\n`+("</span>".repeat(styles+1))});
                _this.element.add(result)
                _this.invoke("line",result.textContent)
                if(_this.opt.scroll)_this.element.scroll(0,_this.element.scrollHeight+500);
                _this.lines++;
            }
            log(...t){_this.addLine({},...t)}
            clear(){_this.element.set();_this.lines=0;if(_this.opt.proxy)_this._console.clear();_this.invoke("clear")}
            get(){}
            error(...t){_this.addLine({proxy:"error",color:"#f55"},...t)}
            warn(...t){_this.addLine({proxy:"warn",color:"#fb2"},...t)}
            success(...t){_this.addLine({proxy:"success",color:"#5f5"},...t)}
            info(...t){_this.addLine({proxy:"info",color:"#5ff"},...t)}
        }
    },
    /*--}--part--(editor){*/
    Editor(global){
        global.set("themes",{
            base:{
                textarea:"all:revert;position:absolute;inset:0;outline:none;background:#0000;color:#0000;resize:none;border:none"
            },
            light:{
                body:"background:#fff;color:#000;woú:0"
            },
            dark:{
                include:"base",
                body:"background:#232a2f;color:#eee"
            },
        });
        return(_this)=>class Editor{
            constructor(id,e,opt){
                this.opt=Object.assign({indent:"    "},opt);
                this.element=O(e||N("editor"));
                S(this.element,{
                    position:"relative",
                    width:this.element.attr("width")||"400px",
                    height:this.element.attr("height")||"250px",
                    display:"block"
                });
                this.element.className="ls-editor-body";
                _this=this;
                this.style(global.themes.dark);
                this.element.set([
                    N("div",{className:"ls-editor-inner",style:S({position:"absolute",display:"block",width:"100%",height:"100%"}),inner:[
                        N("div",{className:"ls-editor-overlay",style:S({
                            position:"absolute",
                            "pointer-events":"none",
                            inset:"0",
                            "white-space":"pre"
                        })}),
                        N("textarea",{className:"ls-editor-edit ls-editor-text",inner:["hi"],oninput:function(){
                            _this.element.get(".ls-editor-overlay").innerHTML=this.value
                        }})
                    ]})
                ])

            }
            style(theme){
                let r={};
                function get(obj){
                    if(!obj)return;
                    Object.keys(obj).forEach(k=>{
                        let t={};
                        if(k=="include"){
                            return obj[k].split(",").forEach(k=>get(global.themes[k]))
                        }
                        r[k]=r[k]||{};
                        obj[k].split(";").map(e=>e.split(":").map(e=>e.trim())).forEach(k=>t[k[0]]=k[1]);
                        Object.assign(r[k],t)
                    })
                }
                get(theme);
                Object.keys(r).forEach(k=>{console.warn(_this.element.querySelectorAll("*"));(k=="body"?[_this.element]:_this.element.querySelectorAll(k)).forEach(e=>{console.log(1,e,r[k]);S(e,r[k])})})
                console.log(r);
            }
            addTheme(key,theme){global.themes[key]=theme}
            set(){

            }
            get(){

            }
        }
    }
    /*--}*/
});
if(!dialog)var dialog=LS.Dialog;
if(!modal)var modal=dialog;
Globalise({alert:(m,opt={})=>new Promise((r)=>modal(Object.assign({content:m,buttons:[{text:"OK"}],onclose:r},opt))),confirm:(m,opt={})=>new Promise((r)=>modal(Object.assign({content:m,buttons:[{text:"OK"},{text:"Cancel"}],onclose:r},opt))),prompt:(m,opt={})=>new Promise((r)=>modal(Object.assign({content:m+"<br><input type=text ls fluent>",buttons:[{text:"OK"},{text:"Cancel"}],onclose:r},opt)))})