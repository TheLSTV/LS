{
    return(_this) => class Tabs{
        constructor(id, element = O("tabs"), options = {}){
            _this = this;
            this.element = O(element);
            this.wrapper = O(element);

            if(!this.element) throw new Error("No element provided");

            this.tabs = {};
            this.order = [];
            this.uniqueIDList = [];

            this.options = {
                list: true,
                listClass: "",
                listItemClass: "",
                listClickable: true,
                hide: true,
                noStyle: false,
                mode: "default",
                listElement: null,
                infinite: true,
                ...options
            }

            if(this.options.listElement) O(_this.options.listElement).class(["tablist", _this.options.listClass]);

            if(this.options.list){
                this.list = {};
                this.listElement = _this.options.listElement || N("div", {
                    class: "tablist " + _this.options.listClass + (_this.options.noStyle?"":" tablist-style")
                })

                if(this.options.dragDrop) {
                    this.dragDrop = LS.DragDrop(id + "_tabs_drag", {
                        animate: false,
                        relativeMouse: true,
                        dropPreview: true,
                        absoluteX: true,
                        container: this.listElement,
                        sameParent: true,
                        strictDrop: false,
                        scrollY: false,
                        outsideParent: true
                    })
    
                    this.dragDrop.enableDrop(this.listElement)
                }

                this.wrapper = N({class: "ls-tabs-wrapper"})

                for(let child of this.element.getChildern()){
                    this.wrapper.add(child)
                }

                this.element.class("ls-tabs-with-list")
                this.element.add(this.wrapper)

                if(!this.options.listElement) O(element).prepend(this.listElement)
            }

            this.rescan()
        }

        _init(){
            _this.setActive(0);
        }

        setActive(tab, force=false){
            if(typeof tab=="number"){
                tab = _this.order[tab]
            }

            let element = _this.tabs[tab],
                index = _this.order.indexOf(tab)

            if(!element)return false;
            if(_this.activeTab == tab && !force) return true;

            if(_this.options.list){
                Object.keys(_this.list).forEach(t=>{
                    _this.list[t].class("active", tab == t)
                })
            }

            for(const _tab in _this.tabs){
                let _element = O(_this.tabs[_tab]);
                if(!_element || _tab == tab){
                    continue
                }
                _element.class("tab-active",0)
                if(_this.options.hide && _this.options.mode != "presentation") _element.hide()
            }

            element.style.display = ""
            element.class("tab-active")

            _this.element.attr("active-tab", tab)
            _this.activeTab = tab
            _this.tab = index
            _this.invoke("tab_changed", index, tab)
            return true
        }

        rescan(){
            (
                _this.options.select? O(_this.wrapper).getAll(_this.options.select) : [...O(_this.wrapper).children]
            ).forEach(element => {

                if(O(element).hasClass("tablist")) return; // Deprecated

                if(element.uniqueTabID && _this.uniqueIDList.includes(element.uniqueTabID)) return;

                element.uniqueTabID = M.GlobalID;
                _this.uniqueIDList.push(element.uniqueTabID);
                _this.addExisting(element)

            })
        }

        addExisting(element, opt = {}){
            return _this.add(null, element, {isReady: true, ...opt})
        }

        add(title, content = N(), opt = {}){
            let element = opt.isReady&&content ?O(content): N("ls-tab",{
                inner: content,
                attr: {"tab-title": title}
            });

            if(!element.hasAttr("tab-title")) element.attr("tab-title", title)

            let id = opt.id||(typeof opt == "string"&&opt) || content.id || element.attr("tab-id") || "tab_"+M.GlobalID;
            element.attr("tab-id", id)

            if(!opt.isReady)_this.wrapper.add(element);
            _this.tabs[id] = element;
            _this.order.push(id);

            _this.addToList(id);
            return id;
        }

        addToList(tab){
            //FIXME: Make it more like "updateList" that updates the order
            if(!_this.options.list) return;

            let element = _this.tabs[tab], tabHandle = N("div",{
                innerHTML:element.attr("tab-title")||tab,
                attr:{for:tab},
                className:"_tab "+(_this.options.noStyle?"":"_tab_style ")+_this.options.listItemClass,
                onclick(){if(_this.options.listClickable)_this.setActive(tab)}
            });

            if(this.options.dragDrop) this.dragDrop.enableDrag(tabHandle);
            _this.list[tab] = tabHandle
            _this.listElement.add(tabHandle)
        }

        remove(id){
            // TODO: Maybe make this work
        }

        next(){
            _this.tab = _this.tab > _this.length() - 2? _this.options.infinite? 0 : _this.tab : _this.tab + 1;
            _this.setActive(_this.tab)
        }

        previous(){
            _this.tab=_this.tab < 1? _this.options.infinite? _this.length() - 1 : _this.tab : _this.tab - 1;
            _this.setActive(_this.tab)
        }

        length(){
            return _this.tabs.length
        }
    }
}