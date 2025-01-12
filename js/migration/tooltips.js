{
    if(!LS.isWeb)return;
    gl.conf={
        batch: false,
        singular: true
    }
    return(_this)=>class Tooltips{
        constructor(){
            _this = this;

            this.element = N({class:"ls-tootlip-layer"});
            this.contentElement = N({class:"ls-tooltip-content"});
            this.element.add(this.contentElement);

            this.attributes = ['ls-tooltip', 'ui-tooltip', 'ls-hint', 'tooltip'];
            this.observer = new MutationObserver(this.addElements);

            function add() {
                LS._topLayer.add(_this.element)

                _this.rescan()

                _this.observer.observe(document.documentElement, {
                    attributes: true,
                    // childList: true,
                    subtree: true,
                    attributeFilter: _this.attributes
                })
            }

            LS.once("body-available", ()=>{
                add()
            })
        }

        position(x, y){
            let box;

            if(x instanceof Element) {
                box = x.getBoundingClientRect()
            } else if(typeof x == "number") box = {x}

            let cbox = _this.contentElement.getBoundingClientRect(),
                pos_top = box.top - cbox.height,
                pos_bottom = box.top + box.height
            ;

            _this.contentElement.applyStyle({
                left:(
                    box.width ? Math.min(Math.max(box.left+(box.width/2)-(cbox.width/2),4),innerWidth-(cbox.width)) : box.x
                ) + "px",

                maxWidth:(innerWidth - 8)+"px",

                top: typeof y === "number"? y + "px": `calc(${pos_top < 20? pos_bottom : pos_top}px ${pos_top < 0? "+" : "-"} var(--ui-tooltip-rise, 5px))`
            })
        }

        set(text){
            _this.contentElement.set(text);
        }

        show(){
            _this.element.class("shown");
            LS._topLayerInherit();
        }

        hide(){
            _this.element.class("shown", 0)
        }

        addElements(mutations){
            if(!Array.isArray(mutations)) mutations = [mutations];

            for(let mutation of mutations.reverse()) {
                if(typeof mutation !== "object" || !mutation || !mutation.target) continue;

                let e = O(mutation.target), attr = mutation.attributeName;

                e.hasTooltip = e.hasAttr(attr);
                e.tooltip_value = e.attr(attr);
                e.tooltip_hint = e.hasAttr("ls-hint");

                if(!e._tt)! _this.setup(e);
            }
        }

        rescan(){
            _this.addElements(Q(_this.attributes.map(a=>`[${a}]`).join(",")).map(e=>{
                return {
                    target: e,
                    attributeName: Object.keys(e.attr()).find(a=>_this.attributes.includes(a))
                }
            }))
        }

        setup(element){
            element._tt = true;
            element.on("mouseenter", ()=>{
                if(!element.hasTooltip) return;
                _this.invoke("set", element.tooltip_value);

                if(element.tooltip_hint) return;

                _this.set(element.tooltip_value)
                _this.show()

                _this.position(element)
            })

            element.on("mousemove", () => _this.position(element))

            element.on("mouseleave", () => {
                if(!element.hasTooltip) return;
                _this.invoke("leave", element.tooltip_value);
                _this.hide()
            })
        }
    }
}