LS.LoadComponents({Timeline(gl) {
    return _this=>class LS_Timeline{
        constructor(id, element, options = {}){
            _this = this;
            this.id = id;
            this.options = options;
            this.element = element;
            this.items = [];

            this.timelines = [{
                items: {},
                labels: []
            }]

            this.areaElement = element.get("ls-timeline-area");
            this.container = element.get("ls-timeline-container");
            this.markers = element.get("ls-timeline-markers");
            this.pointer = element.get("ls-timeline-pointer");
            this.blackout = element.get("ls-timeline-blackout");
            this.labels = element.get("ls-timeline-labels");
            
            if(!this.pointer){
                this.pointer = N("ls-timeline-pointer")
                this.container.add(this.pointer)
            }
            
            if(!this.blackout){
                this.blackout = N("ls-timeline-blackout")
                this.areaElement.add(this.blackout)
            }

            this._zoom = _this.options.zoom || 1;
            this._position = _this.options.position || 0;
            this._playerLength = _this.options.length || 5000;
            this._currentTimeline = _this.options.timeline || 0;
            _this.zoomMultiplier = 1;

            Object.defineProperty(this, "timeline", {
                get(){
                    return _this.timelines[_this._currentTimeline]
                }
            })

            Object.defineProperty(this, "currentTimeline", {
                get(){
                    return _this._currentTimeline
                },
                set(value){
                    if(_this._currentTimeline == value) return;

                    for(let item in _this.timeline.items) {
                        if(!_this.timeline.items.hasOwnProperty(item)) continue;

                        _this.timeline.items[item].element.hide()
                    }

                    _this._currentTimeline = value
                    if(!_this.timelines[value]) _this.timelines[value] = {
                        items: {},
                        labels: []
                    }

                    for(let item in _this.timeline.items) {
                        if(!_this.timeline.items.hasOwnProperty(item)) continue;

                        _this.timeline.items[item].element.show("flex")
                    }

                    _this.updateLabels()
                }
            })

            Object.defineProperty(this, "rows", {
                get(){
                    return _this.container.getAll("ls-timeline-row").length
                }
            })

            Object.defineProperty(this, "position", {
                get(){
                    return _this._position
                },
                set(value){
                    _this._position = Math.max(0, Math.min(value, _this.playerLength))
                    updatePointer()
                }
            })

            Object.defineProperty(this, "playerLength", {
                get(){
                    return _this._playerLength
                },
                set(value){
                    _this._playerLength = Math.min(Math.max(_this.options.min || 0, value), _this.options.max || Infinity)
                    scroll()
                }
            })

            if(!_this.options.minZoom) _this.options.minZoom = .004;
            if(!_this.options.maxZoom) _this.options.maxZoom = 15;

            Object.defineProperty(this, "zoom", {
                get(){
                    return _this._zoom
                },
                set(value){
                    _this._zoom = Math.max(_this.options.minZoom, Math.min(value, _this.options.maxZoom))

                    let i = 0;

                    // TODO:FIXME: I mean, just look at this
                    _this.zoomMultiplier = _this.zoom < .005 ? 512 : _this.zoom < .01 ? 256 : _this.zoom < .015 ? 128 : _this.zoom < .02 ? 64 : _this.zoom < .05 ? 32 : _this.zoom < .10 ? 16 : _this.zoom < .25 ? 8 : _this.zoom < .5 ? 4 : _this.zoom < 10 ? 1 : .5;

                    _this.areaElement.style.setProperty("--column-width", (_this.zoom * (_this.options.baseValue || 10) * _this.zoomMultiplier) +"px")

                    for(const object of Object.values(_this.timeline.items)){
                        object.start = object.start;
                        object.length = object.length;
                    }

                    updatePointer()
                    scroll()
                }
            })

            document.addEventListener('wheel', (event) => {
                if (event.ctrlKey && this.areaElement.matches(":hover")) {
                    event.preventDefault();

                    let zoomFactor = this.zoom * .16
                    this.zoom = this.zoom - (event.deltaY > 0 ? zoomFactor : -zoomFactor)
                }
            }, { passive: false });

            O(this.areaElement).class("ls-timeline")

            let handle = LS.Util.touchHandle(this.areaElement, {exclude: ".ls-timeline-item, .ls-timeline-item *", buttons: [0]}), prevSeek;
            this.handle = handle;

            handle.on("start", ()=>{
                requestAnimationFrame(scrollBounds)
            })

            function scrollBounds(){
                let scrollBox = _this.container.getBoundingClientRect();

                _this.position = (_this.container.scrollLeft + (M.x - scrollBox.left)) / _this.zoom

                if(prevSeek !== _this.position) _this.invoke("seek", _this.position)
                prevSeek = _this.position;

                if(M.x > (scrollBox.right - 20)) _this.container.scrollBy(Math.min(40, (M.x - (scrollBox.right - 20))/2), null)
                if(M.x < (scrollBox.left + 20)) _this.container.scrollBy(Math.min(40, -(((scrollBox.left + 20)) - M.x)/2), null)

                updatePointer()
                if(handle.seeking) requestAnimationFrame(scrollBounds)
            }

            this.dragDrop = LS.DragDrop(id + "_timeline_drag", {
                animate: false,
                relativeMouse: true,
                dropPreview: true,
                absoluteX: true,
                container: this.container,
                strictDrop: false,
                sameParent: true,
                ...this.options.disableCrossing? {
                    movementOnly: true,
                    lockY: true,
                }: {},
                getters: {
                    get snapAt(){
                        return [..._this.items.filter(e=>!e.hasClass("ls-held")), _this.blackout]
                    }
                }
            })

            this.dragDrop.on("dragStart", (element, event, cancel)=>{
                if(event.target.classList.contains("ls-resize-bar")) cancel()
            })

            this.dragDrop.on("drop", (source, target, event) => {
                if(event.source == _this.dragDrop.id){
                    event.cancelMorph();
                    let id = source.attr("data-timeline-id");

                    _this.timeline.items[id].start = event.boundX / _this.zoom
                }
            })

            this.dragDrop.on("dropDone", (source, target, event)=>{
                if(event.source == _this.dragDrop.id){
                    let id = source.attr("data-timeline-id");
                    
                    if(_this.timeline.items[id].row == _this.rows -1) _this.addRow();
                    _this.invoke("rowchange", source, id)
                }
            })

            let prevSection = null, prevMultiplier = _this.zoomMultiplier;

            let markers = [];

            for(let i = 0; i < 100; i++){
                let marker = N()
                markers.push(marker)
                _this.markers.add(marker)
            }

            function scroll(){
                // Temporary solution
                _this.container.style.setProperty("--scroll-width", Math.max(_this.container.clientWidth, _this.container.scrollWidth) +"px")

                let scroll = _this.container.scrollLeft,
                    section = Math.floor(scroll / (3000 * _this.zoom))
                ;

                if(prevSection !== section || _this.zoomMultiplier !== prevMultiplier){
                    let value = section * 50, values = _this.options.label? _this.options.label(value, markers.length, _this.zoomMultiplier, scroll) : null;
                    let i = 0;
                    for(let marker of markers){
                        marker.set(values? values[i] : value + i)
                        i++
                    }
                    prevMultiplier = _this.zoomMultiplier
                }

                scroll -= section * (3000 * _this.zoom);

                _this.markers.style.transform = "translateX("+ (-scroll) +"px)"

                if(_this.labels){
                    _this.labels.scroll(0, _this.container.scrollTop)
                }

                prevSection = section;
                updatePointer()
            }
            
            function updatePointer(){
                _this.pointer.style.left = ((-_this.container.scrollLeft / _this.zoom) + _this.position) * _this.zoom +"px"
                _this.blackout.style.left = -_this.container.scrollLeft + (_this.playerLength * _this.zoom) +"px"
            }

            scroll()
            this.container.on("scroll", scroll)

            for(let row of this.areaElement.getAll("ls-timeline-row")){
                this.dragDrop.enableDrop(row)
            }

            this.zoom = _this._zoom;
            this.playerLength = _this._playerLength;
            this.position = _this._position;
        }

        addRow(label){
            let row = N("ls-timeline-row");
            _this.container.add(row)
            this.dragDrop.enableDrop(row)

            _this.timeline.labels[_this.rows] = label || ""

            _this.updateLabels()

            return row
        }

        item(element, id = M.GlobalID, options){
            if(element.hasClass("ls-timeline-item")) return;

            if(_this.options.resize !== false){
                LS.Resize(_this.id + "_timeline_item_resize_" + id, element, [0, 0, 1, 1], {set: false, absolute: true}).on("resize", (side, values)=>{
                    if(values.left) _this.timeline.items[id].start = values.left / _this.zoom;
                    if(values.width) _this.timeline.items[id].length = values.width / _this.zoom;
                });
            }

            _this.dragDrop.enableDrag(element)

            element.class("ls-timeline-item")
            element.id = _this.id + "_timeline_" + id;
            element.attr("data-timeline-id", id);
            
            element.on("click", (event)=>{
                _this.invoke("select", element, id, _this.timeline.items[id], event)
            })

            _this.items.push(element)

            let start = 0, length = 0;

            _this.timelines[_this._currentTimeline].items[id] = {
                element,

                get start(){
                    return start
                },

                get zoomedStart(){
                    return start / _this.zoom
                },

                set start(value){
                    start = value;
                    element.style.left = start * _this.zoom + "px"
                },

                get end(){
                    return (_this.options.singlePoint? start : (start + length))
                },

                get zoomedEnd(){
                    return (_this.options.singlePoint? start : (start + length)) / _this.zoom
                },

                get length(){
                    return length
                },

                get zoomedLength(){
                    return length / _this.zoom
                },

                set length(value){
                    length = value;
                    if(!_this.options.singlePoint) element.style.width = length * _this.zoom + "px"
                },

                get row(){
                    return Array.prototype.indexOf.call(element.parentElement.parentElement.children, element.parentElement)
                },

                set row(value){
                    if(value < 0) return;

                    let parent = _this.container.getAll("ls-timeline-row")[value];
                    if(!parent){
                        parent = _this.addRow()
                    }
                    parent.add(element)

                    _this.invoke("rowchange", element, id)
                }
            }

            return id
        }

        intersectingAt(time){
            time = time;

            let result = [];
            for(const id in _this.timeline.items){
                if(!_this.timeline.items.hasOwnProperty(id)) continue;
                let item = _this.timeline.items[id];

                if(time >= item.start && time <= item.end) result.push(id)
            }
            return result;
        }

        contentLength(){
            let data = Object.values(_this.timeline.items), result = data.reduce((maxEnd, currentObject) => {
                return currentObject.end > maxEnd.end ? currentObject : maxEnd;
            }, data[0]);

            return result? result.end : 0;
        }

        updateLabels(){
            [..._this.labels.childNodes].forEach(element => element.remove())

            let i = -1;
            for(let label of _this.timeline.labels) {
                i++;

                if(typeof label == "string"){
                    _this.timeline.labels[i] = label = N("ls-timeline-row-label", label);
                }

                _this.labels.add(label)
            }
        }
    }
}});