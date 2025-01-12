{
    let layer = 50000;

    gl.build = function (template, options){
        let instance = gl.new(M.GlobalID, null, {open: false, ...options});
        instance.fromTemplate(template)

        return instance
    }

    gl.highestModal = function (){
        let openModals = Object.values(LS.Modal.list).filter(modal => modal.isOpen);

        return openModals.length > 0? openModals.reduce((prev, current) => (prev.layer > current.layer) ? prev : current) : null
    }

    return(_this) => class LS_Modal{
        constructor(id, element = N(), options = {}){
            _this = this;

            this.options = LS.Util.defaults({
                uncancelable: false,
                open: false,
                shade: true,
                keep: true,
                animationDelay: 100
            }, options);

            Object.defineProperty(this, "isOpen", {
                get(){
                    if(!_this.element) return false;
                    return (!_this.element.hasAttr('open') || _this.element.attr('open') === "true");
                }
            })

            Object.defineProperty(this, "content", {
                get(){
                    if(!_this.element) return false;
                    return _this.element.get(".ls-modal-content")
                },
                set(value){
                    if(!_this.element) return;
                    return _this.element.get(".ls-modal-content").set(value)
                }
            })

            Object.defineProperty(this, "title", {
                get(){
                    if(!_this.element) return false;
                    return _this.element.get(".ls-modal-title")
                },
                set(value){
                    if(!_this.element) return;
                    return _this.element.get(".ls-modal-title").set(value)
                }
            })

            this.open = _this.show;
            this.close = _this.hide;

            _this.closeTimeout = 0;

            if(element) this.setContent(element);

            LS.once("body-available", () => {
                if(!gl.targetElement){
                    if(!LS._topLayer.has(".modals")) LS._topLayer.add(N({class: "modals"}));
                    gl.targetElement = LS._topLayer.get(".modals");
                }

                if(element) gl.targetElement.add(this.element)
            })
        }
        
        _init(){
            if(_this.options.open) _this.open(); else _this.close()
        }

        setContent(content){
            _this.element = _this.options.shade? N("ls-shade-fixed", {
                onclick(){
                    if(!(_this.options.uncancelable || _this.options.uncancellable) && event.target == this){
                        _this.hide()
                    }
                },
                inner: content
            }) : content;

            _this.element.attr("open", "false")
            _this.element.hide()
        }

        handleKey(event){
            if(gl.highestModal().id !== _this.id) return;

            let key = event.key;

            switch(key){
                case "Enter":

                break;
                case "Escape":
                    if(!(_this.options.uncancelable || _this.options.uncancellable)){
                        _this.close()
                    }
                break;
            }
        }

        show(){
            if(_this.isOpen || !_this.element) return false;

            _this.lastFocus = document.activeElement;
            
            let firstFocusable = _this.element.firstFocusable;

            if(firstFocusable) firstFocusable.focus();

            window.addEventListener("keyup", _this.handleKey)

            LS.once("body-available", () => {
                if(_this.closeTimeout > 0) {
                    clearTimeout(_this.closeTimeout)
                    _this.closeTimeout = 0;
                }

                _this.invoke("open");

                _this.element.style.display = null;
                
                setTimeout(()=>{
                    _this.element.attr('open', "true");
                }, 40)

                _this.element.style.zIndex = layer;
                _this.layer = layer;
                layer++;
            })
        }

        hide(){
            if(!_this.isOpen || !this.element) return false;

            _this.invoke("close");
            _this.element.attr('open', "false");

            if(_this.lastFocus) _this.lastFocus.focus();

            window.removeEventListener("keyup", this.handleKey)

            _this.closeTimeout = setTimeout(() => {
                if(!_this.options.keep){
                    _this.destroy()
                    return
                }

                _this.element.style.display = "none";
            }, _this.options.animationDelay)
        }

        fromTemplate(template){
            if(typeof template == "string") template = {content: template};

            let buttons = []
            if(template.buttons) for(let button of template.buttons){
                if(typeof button == "string") button = {text: button};

                let element = N("button", {
                    inner: button.text,
                    class: "elevated"
                })

                element.onclick = function(...pass){
                    
                    if(!button.keep) {
                        _this.hide()
                    }

                    if(button.onclick) button.onclick.call(this, ...pass);
                }
                
                if(button.color) element.attr("ls-accent", button.color)

                buttons.push(element)
            }
            
            let modal = N("ls-modal", [
                N("ls-modal-body", [template.title? N("h2", {inner: template.title, class: "ls-modal-title"}): "", N({inner: template.content, class: "ls-modal-content"})]),
                N("ls-modal-footer", buttons.length > 0? buttons: "")
            ])

            if(template.uncancelable || template.uncancellable) _this.options.uncancelable = true;

            _this.setContent(modal)

            _this.element.style.display = "none";

            LS.once("body-available", () => {
                gl.targetElement.add(_this.element)
            })
        }

        destroy(){
            _this.element.remove()
            _this.element = null
        }
    }
}