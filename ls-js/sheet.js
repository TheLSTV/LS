{
    return(_this) => class Sheet {
        constructor(id, options = {}){
            _this = this;

            this.element = N({
                class: "ls-sheet-wrapper"
            })

            this.container = N({
                class: "ls-sheet-container"
            })

            this.element.add(this.container)

            this.options = options = LS.Util.defaults({
                element: N()
            }, options)

            this.container.add(this.options.element)

            this.handle = LS.Util.touchHandle(this.container)

            LS._topLayer.add(this.element)
        }

        open(){
            _this.element.class("open")
        }
        
        close(){
            _this.element.class("open", false)
        }
    }
}