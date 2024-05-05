{
    return(_this)=>class Nav{
        constructor(id, element){

            _this = this;
            this.id = id;

            this.element = element
            this.menu = {}

            _this.active = false

            if(this.element)LS.once("body-available", ()=>{
                element.getAll("ls-dropdown").all(dropdown => {
                    this.addMenu(dropdown, dropdown.get("ls-menu"))
                })
            })

            gl.on("nav-open", (source, menu)=>{
                this.hide(null, id == source, menu)
            })
        }
        contextMenu(target, menu){
            let id = _this.virtualMenu(menu, null, ()=>{
                return [M.x, M.y]
            })
            
            O(target).on('contextmenu', function(event) {
                event.preventDefault();
                _this.show(id)
            })
        }
        virtualMenu(menuElement, id, virtualHandle = ()=>[0,0]){
            if(!menuElement)throw "Invalid menu element";
            return _this.addMenu(null, menuElement, id, virtualHandle)
        }
        addMenu(handle, menuElement, _id = null, virtualHandle = null){
            let id = _id || (menuElement && menuElement.id) || M.GlobalID;

            if(menuElement){
                if(handle)O(handle).attr("menu", id)
                LS._topLayer.add(menuElement)
                menuElement.id = id;
                
                this.menu[id] = {
                    element: O(menuElement),
                    handle: handle || virtualHandle,
                    id,
                    shown: false
                }
            }

            this.setup(handle, id, virtualHandle)
            return id;
        }
        setup(trigger, id, virtualHandle = null){
            let hasMenu = !!_this.menu[id];
            if(!hasMenu){
                trigger
                    .on("mouseenter", ()=>{
                        if(_this.active) _this.hide(null, true)
                    })
                return
            }
            if(trigger)trigger
                .on("mouseenter", ()=>{
                    if(_this.active) _this.show(id)
                })
                .on("mousedown", () => _this.toggle(id))
                .on("keydown", (e)=>{
                    switch(e.keyCode){
                        case 27: _this.hide(id); break
                        case 13: _this.toggle(id); break
                    }
                });
            O().on("mousedown", (e)=>{
                if(_this.menu[id].shown && e.target !== _this.menu[id].handle){
                    let r = _this.menu[id].element.getBoundingClientRect();
                    if(!(M.x>r.left&&M.x<r.right&&M.y>r.top&&M.y<r.bottom)) _this.hide(id)
                }
            })
            M.on("resize", ()=>{if(_this.menu[id].shown) _this.position(_this.menu[id].handle, _this.menu[id].element)})
            M.on("scroll", ()=>{if(_this.menu[id].shown) _this.position(_this.menu[id].handle, _this.menu[id].element)}, true)

            _this.menu[id].sub = [];
            _this.menu[id].element.getAll("ls-option").all(option =>{
                let subMenu = option.get(":scope > ls-menu")
                if(subMenu){
                    _this.menu[id].sub.push({menu: subMenu, handle: option});
                    option.class("has-submenu");
                    option.on("mouseenter", ()=>{
                        if(option.parentElement == _this.menu[id].element) _this.clearSubmenus(id);
                        option.class("submenu-visible")
                        _this.position(option, subMenu, true)
                    })
                } else {
                    option.on("click", ()=>{
                        _this.invoke("selected", id, option)
                        _this.hide(id)
                    })
                }
            })
        }
        clearSubmenus(id){
            for(let a of _this.menu[id].sub){
                a.menu.hide()
                a.handle.class("submenu-visible", 0)
            }
        }
        toggle(menu){
            _this[_this.menu[menu].shown?"hide":"show"](menu)
        }
        show(id){
            let menu = _this.menu[id];
            if(!menu || menu.shown)return;
            _this.clearSubmenus(id);
            _this.active = true;
            gl.invoke("nav-open", _this.id, id);
            _this.position(menu.handle, menu.element);
            menu.element.show()
            menu.shown = true;
            if(typeof menu.handle !== "function") menu.handle.class("open")
        }
        position(handle, menu, sub){
            if(typeof handle === "function") handle = handle();
            if(Array.isArray(handle)){
                return menu.style = `left:${handle[0]}px;top:${handle[1]}px`;
            }
            let r = handle.getBoundingClientRect()
            menu.style = `left:${sub? r.right : r.left}px;top:${sub? r.top : r.top + r.height}px;max-height:${Math.min(innerHeight-(r.top+r.height+20),600)}px`;
        }
        hide(id, own, source){
            if(!id){
                for(let m in this.menu){
                    if(source == m)continue;
                    m = this.menu[m];
                    if(m.shown) this.hide(m.id, own)
                }
                return;
            }
            let menu = _this.menu[id];
            if(!menu || !menu.shown)return;
            if(!own) _this.active = false;
            menu.shown = false;
            menu.element.hide()
            if(typeof menu.handle !== "function") {
                menu.handle.focus()
                menu.handle.class("open", 0)
            }
        }
    }
}