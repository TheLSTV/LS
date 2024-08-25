{
    customElements.define('ls-select', class extends HTMLElement {
        constructor(){
            super();
        }

        connectedCallback(){
            if(this.hasAttribute("compatibility"))return;
            this.setAttribute("ls-not-ready", "")
            let isReady = false;

            this.ready = () => {
                if(isReady) return;
                isReady = true;
                this.ls = LS.Select(this.id || M.GlobalID, this)
                this.delAttr("ls-not-ready")
            }

            setTimeout(() => {
                if(!isReady)console.warn("[ LS Note ] You are using the ls-select custom element. Due to browser limitations, you have to call .ready() on the element after your options are available!")
            }, 2000);
        }
    });


    /*

        LS Code quality rating: 3/10
        This component needs major changes
    
    */


    gl.fromNative = function (selectElement) {
        let select = LS.Select(N("ls-select", {attr: ["compatibility"]}))

        select.loadFromElements(selectElement)
        select.updateElements()
        select.set(select.getOptions().find(option => option.value === selectElement.value))

        if(selectElement.onchange){
            select.on("change", selectElement.onchange)
        }

        selectElement.remove()

        return select
    }

    return(_this) => class Select {
        constructor(id, element, values, options = {}){
            element = O(element);

            if(!element) throw "No element provided for the select component";

            _this = this;
            this.id = id;
            this.options = []
            this.value = null

            let isNative = element.tagName == "SELECT";

            this.element = isNative? N("ls-select", {attr: ["compatibility"]}) : element;

            this.element.attrAssign({tabindex: 2, title: element.attr("title"), "ls-h-scroll": ''})

            if(isNative){
                // Backwards compatibility with <select>
                element.style.display = "none";
                element.addAfter(this.element)
                element.on("change", () => this.set(this.options.find(o=> o.value = element.value)));
            }

            this.menu = N("ls-menu", {
                class: "has-top-handle",
                inner: [
                    N("input", {
                        placeholder: "Search",
                        oninput(){
                            _this.menu.getAll(".ls-select-options > *").forEach(e=>e.style.display=e.innerText.toLowerCase().replace(/[\s\n:|_]/g,'').includes(this.value.toLowerCase().replace(/[\s\n:|_]/g,''))?"block":"none")
                        }
                    }),
                    "<hr style=margin-top:0>",
                    N({class: "ls-select-options"})
                ]
            });

            _this.menuContainer = _this.menu.get(".ls-select-options");
            O(options.root || LS._topLayer).add(this.menu);

            M.on("resize",()=>{if(this.shown) this.position()})
            M.on("scroll",()=>{if(this.shown) this.position()}, !0)

            this.shown = false;
            this.element
                .on("mousedown", () => this.toggle())
                .on("keydown", (e)=>{
                    switch(e.keyCode){
                        case 27: this.hide(); break
                        case 13: this.toggle(); break
                        case 40:case 9: this.show(); this.getOptions()[0].element.focus(); break
                    }
                });

            O(options.root || O()).on("mousedown", (e)=>{
                if(this.shown && e.target !== this.element){
                    let r = this.menu.getBoundingClientRect();
                    if(!(M.x>r.left&&M.x<r.right&&M.y>r.top&&M.y<r.bottom))this.hide()
                }
            })

            if(!values){
                this.loadFromElements(isNative? element : this.element);
                this.updateElements()
            }else{
                this.updateElements(values)
            }

            this.selectFirst()
        }

        get(){
            return _this.value
        }

        selectFirst(){
            if(this.options.length > 0) this.set(this.getOptions()[0])
        }

        set(opt){
            let option = typeof opt=="object"?opt: _this.options[opt];
            if(!option)return new Error(opt+" is an invalid option!");
            _this.value = option.value;
            _this.element.set(option.label || option.value);
            if(opt.element)O(opt).attrAssign("selected");

            if(_this.invoke)_this.invoke("change", option.value, option)
            _this.hide()
        }

        updateElements(values){
            if(values)_this.options=values;

            let existing = _this.menuContainer.getAll();

            let i = -1;
            for(const opt of _this.options){
                i++
                if(typeof opt=="string"){
                    let label = N("ls-label", {attr: {title: opt}, innerText: opt});
                    _this.menuContainer.add(label)
                    _this.options[i] = {type: "label", element: label}
                    continue
                }

                if(!opt.type)opt.type="option";

                let 
                    existed = !!opt.element,
                    optElement = opt.element || N("ls-option");
                    
                if(!optElement.hasClass("rich") && opt.type!=="plain")optElement.innerHTML = opt.label || opt.value;
                optElement.class("indent", opt.indent? 1:0)

                if(opt.type == "option"){
                    optElement.attrAssign({tabindex: "1"})
                    optElement.onmouseup = () => _this.set(opt)
                    optElement.onkeydown = (e)=>{
                        if(e.keyCode==13)_this.set(opt)
                    }
                }

                _this.options[i].element = optElement
                _this.menuContainer.add(optElement)
            }
        }

        getOptions(){
            return _this.options.filter(o=>o.type=="option")
        }

        exportOptions(){
            return _this.options.map(o=>{
                return {type: o.type, label: o.label, value: o.value, indent: o.indent}
            })
        }

        updateFromElements(){
            //...
        }

        loadFromElements(source = _this.menuContainer){
            _this.options = []
            for(const opt of source.getAll()){
                let parent = opt.parentElement.tagName;
                if(!parent.includes("SELECT") && !parent.includes("OPTGROUP")) continue;
                let option = 
                    opt.tagName.includes("OPTGROUP")? opt.attr("label"):
                    opt.tagName.includes("OPTION")?
                    {
                        type: "option",
                        indent: !!(parent.includes("OPTGROUP")?1:0),
                        label: opt.innerHTML,
                        value: opt.attr("value") || opt.innerHTML
                    }:
                    {
                        type: "plain",
                        element: opt
                    }
                ;
                if(opt.tagName=="LS-OPTION") option.element = opt;
                _this.options.push(option)
            }
        }

        toggle(){
            _this[_this.shown?"hide":"show"]()
        }

        show(){
            if(_this.shown)return;
            _this.shown=!0;
            _this.position();
            _this.element.class("open")
        }

        position(){
            let r = _this.element.getBoundingClientRect();
            _this.menu.style=`left:${r.left}px;width:${r.width}px;top:${r.top+r.height}px;max-height:${Math.min(innerHeight-(r.top+r.height+20),400)}px;display:block`;
        }

        hide(){
            if(!_this.shown)return;
            _this.shown=!1;
            _this.menu.hide()
            _this.element.focus()
            _this.element.class("open", 0)
        }
    }
}