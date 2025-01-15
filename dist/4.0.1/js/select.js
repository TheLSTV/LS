LS.LoadComponents({Select(gl) {

    /*

        LS Code quality rating: 6/10
        This component needs changes
    
    */


    gl.fromNative = function (selectElement) {
        let select = LS.Select(N("ls-select", {attr: ["compatibility"]}))

        select.loadFromElement(selectElement)
        select.updateElements()

        select.set(selectElement.value)

        if(selectElement.onchange){
            select.on("change", selectElement.onchange)
        }

        selectElement.remove()

        return select
    }

    return(_this) => class Select {
        constructor(id, element, options = {}){
            element = O(element);

            if(!element) throw "No element provided for the select component!";

            _this = this;

            this.id = id;
            this.value = null

            this.uniqueSet = new Set;

            if(Array.isArray(options)){
                options = {values: options}
            }

            this.options = LS.Util.defaults({
                search: true,
                handleClickEvents: true,
                values: []
            }, options)

            if(element.tagName === "SELECT") return gl.fromNative(element);

            this.element = element;

            this.element.attrAssign({
                tabindex: 2
            })

            if(this.element.has("ls-menu")){
                this.menuElement = this.element.get("ls-menu")
            }

            _this.menuElementContainer = (this.menuElement && this.menuElement.has(".ls-select-options"))? this.menuElement.get(".ls-select-options"): N({class: "ls-select-options"});

            if(!this.menuElement) this.menuElement = N("ls-menu");

            _this.menuElement.class("has-top-handle")

            if(this.options.search){
                _this.menuElement.prepend(N("input", {
                    placeholder: "Search",

                    oninput(){
                        _this.search(this.value)
                    }
                }), N("hr", { style: {marginTop: "0"} }))
            }

            _this.menuElement.add(_this.menuElementContainer)

            O(options.rootElement || LS._topLayer).add(this.menuElement);

            M.on("resize", () => {if(this.open) this.position()})
            M.on("wheel", "touchmove", () => {if(this.open) this.position()}, true)

            this.open = false;

            this.element
                .on("mousedown", () => this.toggle())
                .on("keydown", event => {
                    switch(event.keyCode){
                        case 27: this.hide(); break
                        case 13: this.toggle(); break
                        case 40: case 9: this.show(); this.getOptions()[0].element.focus(); break
                    }
                });

            O(options.rootElement || document.body).on("mousedown", event => {
                if(this.open && event.target !== this.element){
                    let box = this.menuElement.getBoundingClientRect();
                    if(!(event.clientX > box.left && event.clientX < box.right && event.clientY > box.top && event.clientY < box.bottom)) this.hide()
                }
            })
            
            this.loadFromElement();

            this.updateElements()
            this.selectFirst()
        }

        selectFirst(){
            if(_this.options.values.length > 0) _this.set(_this.options.values[0])
        }

        set(option){
            if(typeof option === "string") option = _this.options.values.find(_option => _option.value === option);
            else if (typeof option === "number") option = _this.options.values[option];

            if(!option || !option.value) return false;
            
            _this.value = option.value;
            _this.element.set(_this.options.getLabel? _this.options.getLabel(option): (option.label || option.element || option.value));

            if(option.listElement) O(option.listElement).attrAssign("selected");

            if(_this.invoke) _this.invoke("change", option.value, option)
            return true
        }

        removeOption(index){
            if(typeof index === "string") index = _this.options.values.findIndex(_option => _option.value === index);

            // TODO: add an unique ID set, and handle element removal/memory cleanup by checking for difference in arrays
            this.options.values[index].listElement.remove()

            this.options.values[index] = null
            _this.updateElements()
        }

        clearOptions(){
            this.options.values = []
            _this.updateElements()
        }

        updateElements(values){
            let i = -1;
            for(const option of _this.options.values){
                i++

                if(!option || typeof option !== "object") continue;

                if(typeof option == "string"){
                    // let label = N("ls-label", {attr: {title: option}, innerText: option});
                    // _this.menuElementContainer.add(label)
                    // _this.options[i] = {type: "label", element: label}
                    continue
                }

                if(!option.type) option.type = "option";

                let optionElement = option.listElement || N("ls-option");

                if(!option.listElement) option.listElement = optionElement;

                let optionContent = option.element || option.value;

                optionElement.set(optionContent)

                if(option.type == "option"){
                    optionElement.attrAssign({ tabindex: "1" });

                    optionElement.onmouseup = () => {
                        if(!_this.options.handleClickEvents) return;

                        _this.hide(); _this.set(option)
                    }

                    optionElement.onkeydown = event => {
                        if(!_this.options.handleClickEvents) return;

                        _this.hide()
                        if(event.keyCode == 13) _this.set(option)
                    }
                }

                _this.menuElementContainer.add(optionElement)
            }
        }

        loadFromElement(source = _this.menuElementContainer){
            // _this.options.values = []

            for(const element of source.getAll()){
                let parent = element.parentElement.tagName;

                // if(!parent.includes("SELECT") && !parent.includes("OPTGROUP")) continue;

                let option =
                    element.tagName === "OPTGROUP"? { type: "label", value: element.attr("label") }:
                    element.tagName === "OPTION"? {
                        type: "option",
                        element: element.children.length > 0? [...element.children]: null,
                        value: element.attr("value") || element.innerHTML
                    } : null
                ;

                _this.options.values.push(option)
            }
        }

        addOption(option){
            let index = _this.options.values.push(option)
            _this.updateElements()
            return index -1
        }

        toggle(){
            _this[_this.open? "hide" : "show"]()
        }

        show(){
            if(_this.open) return;
            _this.open = true;

            _this.position();
            _this.element.class("open")
        }

        position(){
            let box = _this.element.getBoundingClientRect();

            _this.menuElement.applyStyle({
                left: box.left + "px",
                width: box.width + "px",
                top: (box.top + box.height) + "px",
                maxHeight: Math.min(innerHeight - (box.top + box.height + 20), 400) + "px",
                display: "block"
            })
        }

        hide(){
            if(!_this.open) return;
            _this.open = false;

            _this.element.focus()
            _this.element.class("open", false)
            _this.menuElement.style.display = "none";
        }

        get(){
            return _this.value
        }

        search(value){
            function fuzz(string){
                return string.toLowerCase().trim().replace(/[\s\n\t\r:|_]/g, "")
            }

            _this.menuElement.getAll(".ls-select-options > *").forEach(element => element.style.display = fuzz(element.innerText).includes(fuzz(value))? "block" : "none")
        }
    }
}});