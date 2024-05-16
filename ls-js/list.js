{
    return (_this) => class InfiniteList {

        constructor(id, element, options){
            _this = this;
            
            options = LS.Util.defaults({
                lineHeight: 16, // Fixed height of each item
                overheadLines: 16, // Scroll overhead. Must be divisible by two. Eg. 16 = each side of the scroll will have 8 extra rendered items. Lower values might create performance issues when scrolling fast, higher values will consume a more memory and slow down all scrolling. Recommended range is 8 to 32.
                scrollArea: 400, // Scroll area, this also defines the maximum scroll speed per frame
                scrollSensitivity: 2, // More = more effort needed to start scrolling, less = less effort needed to start scrolling. Not recommended to set below 1.
                bottomScrollPadding: 200, // Extra space at the bottom of the scroll in pixels,
                minimumScroll: 0, // Minimum that can be scrolled. Can be below 0.
                layoutOnNoDifference: false, // Disabling this might improve performance a bit, but can cause issues in specific scenarios.
                minimalDifference: 0, // If the difference is smaller than this, do not perform a layout. Higher values can improove load but will cause lagging.
        
                realScroll: false, // If enabled, the scroller will use absolute scroll position and create a filler element, instead of tracking scroll events relatively. This may negatively impact performance but allows you to use the native scrollbar.
                dualScrollbar: false // Incompatible with realScroll - this creates an alternative scrollbar on the left, which uses the browser native scrollbar, but still allows you to use relative scrolling. This might still have a slight negative impact on performance.
            }, options)


            this.element = O(element) || N();

            this.options = options;

            this.scrollContainer = N({
                class: "ls-listScrollContainer"
            })

            this.itemContainer = N({
                class: "ls-listItemContainer"
            })

            this.scrollFilter = N({
                class: "ls-listScrollFilter"
            })

            this.items = []

            this.scrollContainer.add(this.itemContainer, this.scrollFilter)
            this.element.add(this.scrollContainer)
            this.element.class("ls-listContainer")

            this.scrollY = 0;
            this.previousEtape = null;
            this.previousY = null;

            this.scrollContainer.on("scroll", event => {

                let diff = _this.scrollContainer.scrollTop - _this.options.scrollArea;
            
                if (diff < _this.options.scrollSensitivity && diff > -_this.options.scrollSensitivity) return;
            
                _this.scrollContainer.scrollTop = _this.options.scrollArea
            
                _this.scrollY += diff;
                _this.scrollY = Math.max(_this.options.minimumScroll, Math.min((_this.items.length * _this.options.lineHeight) - _this.element.clientHeight + _this.options.bottomScrollPadding, _this.scrollY));
            
                if (!_this.options.layoutOnNoDifference && Math.floor(_this.previousY) == Math.floor(_this.scrollY)) return;
                if (_this.options.minimalDifference && Math.abs(_this.scrollY - _this.previousY) < _this.options.minimalDifference) return;
            
                _this.previousY = _this.scrollY
            
                return _this.updateList()
            })

            this.init()
        }

        init() {
            _this.itemContainer.clear()

            _this.element.style.setProperty("--editor-lineHeight", _this.options.lineHeight + "px")

            _this.items = "123\njkhg".split("\n")

            _this.scrollY = 0
            _this.scrollContainer.scrollTop = _this.options.scrollArea

            _this.itemContainer.set(Array(Math.floor(_this.element.clientHeight / _this.options.lineHeight) + _this.options.overheadLines).fill().map((line, i) => N({
                class: "ls-listItem",
                textContent: _this.items[i]
            })))

            _this.updateList()
        }

        scroll(x, y) {
            scrollY = y
            _this.previousY = y
            _this.itemContainer.scrollLeft = x
            _this.updateList()
        }

        scrollBy(x, y) {
            _this.scrollContainer.scrollBy(x, y)
        }

        updateList() {
            let etapeHeight = _this.options.overheadLines * _this.options.lineHeight,
                etape = Math.floor(_this.scrollY / etapeHeight),
                transform = _this.scrollY % etapeHeight
            ;


            // console.log("Previous etape:", _this.previousEtape, "Etape:", etape, "Scroll:", _this.scrollY, "Transform:", transform);

            // if(etape > _this.previousEtape){
            //     console.log("Shifting bottom");

            //     for(let i = 0; i < _this.options.overheadLines; i++){
            //         let location = (etape * _this.options.overheadLines) + i,
            //             target = _this.itemContainer.child(0)
            //         ;

            //         _this.itemContainer.add(target)

            //         if(location < _this.items.length){
            //             target.class("hidden", 0)
            //             target.set(_this.items[location])
            //         } else {
            //             target.class("hidden")
            //         }
            //     }
            // }

            // if(etape < _this.previousEtape){
            //     console.log("Shifting top");

            //     for(let i = 0; i < _this.options.overheadLines; i++){
            //         _this.itemContainer.child(0).addBefore(_this.itemContainer.lastChild.set(_this.items[(etape * _this.options.overheadLines) + (_this.options.overheadLines - i - 1)]))
            //     }
            // }

            if (etape != _this.previousEtape) {
                for (let i = 0; i < _this.itemContainer.children.length; i++) {
                    let location = (etape * _this.options.overheadLines) + i, target = _this.itemContainer.children[i];

                    if (location < _this.items.length) {
                        target.set(_this.items[location]).class("hidden", 0)
                    } else {
                        target.class("hidden")
                    }
                }
            }

            // console.log(_this.scrollY, transform, (Math.floor(_this.scrollY / etapeHeight) * etapeHeight), etapeHeight);

            _this.itemContainer.style.transform = "translateY(" + (-transform) + "px)"
            _this.previousEtape = etape;
        }
    }
}