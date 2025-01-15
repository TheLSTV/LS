LS.LoadComponents({PatchBay(gl) {
    gl.extends = "Workspace";
    class LS_Node {
        constructor (options = {}) {
            if(options instanceof Element) options = {element: options};

            this.id = options.id || M.GlobalID;
            this.class = options.class || "";
            this.parent = options.parent || null;
            this.position = options.position || [];
            this.data = options.data || {}; // CUSTOM DATA TO BE SET BY THE APPLICATION.

            this.element = options.element || N();
            this.element.class("ls-bay-node")

            let handle = LS.Util.touchHandle(this.element, {exclude: ".ls-patch-source-hitbox, .ls-patch-source-hitbox *"});
            handle.cursor = "none";

            let _this = this,
                ox = 0,
                oy = 0,
                workspace = null
            ;

            function drag(){
                let mouse = workspace.mousePoint;
                _this.move(mouse.canvasXr - ox, mouse.canvasYr - oy)
            }

            handle.on("start", ()=>{
                workspace = _this.parent.workspace;

                let rect = _this.element.getBoundingClientRect(),
                    mouse = workspace.mousePoint,
                    point = workspace.relativePoint(rect.x, rect.y)
                ;

                ox = mouse.x - point.x
                oy = mouse.y - point.y

                this.parent.globalZ++
                this.element.style.zIndex = this.parent.globalZ
                drag()
            })

            handle.on("move", drag)

            if(options.position)_this.move(...options.position);
            if(options.onAdded)options.onAdded(this)
            console.log(options);
            gl.invoke("nodeAdded", this)
        }

        move(x, y){
            if(typeof x != "number") x = 0;
            if(typeof y != "number") y = 0;

            this.position = [ x, y ];
            this.element.style.left = x + "px"
            this.element.style.top = y + "px"
            if(this.parent) this.parent._draw()
        }

        addSource(element, options = {}){
            if(!O(element) || !this.parent)return;

            element.class("ls-patch-source")
            let hitbox = N({class: "ls-patch-source-hitbox"});
            element.wrapIn(hitbox)

            let handle = LS.Util.touchHandle(hitbox);
            handle.cursor = "none";
            handle.drawTarget = element;

            let _this = this;

            let source = {
                handle,
                isInput: !!options.isInput,
                id: M.GlobalID,
                node: this.id,
                class: options.class || element.attr("bay-class") || ""
            }

            element.attrAssign({"ls-accent": _this.parent.getAccentColor(source.class)})

            function drag(){
                let rect = element.getBoundingClientRect()
                _this.parent.d(_this.parent.dragLine, rect.x + (rect.width / 2), rect.y + (rect.height / 2), M.x, M.y, !source.isInput)
            }
            
            hitbox.id = source.id;

            handle.on("start", ()=>{
                this.parent.dragLine.show()
                for(let _source of this.parent.sources){
                    if((source.class !== _source.class) || hitbox !== _source.handle.target && _source.isInput == source.isInput && !(this.parent.connections[_source.id]||[]).includes(source.id)){
                        _source.handle.target.style.opacity = ".2"
                    }
                }
                _this.parent.dragLine.attrAssign({"ls-accent": _this.parent.getAccentColor(source.class)})
                this.parent.svgContainer.getAll(".ls-bay-line:not(.line-drag)").all(e => e.style.opacity = ".2")
                drag()
            })

            handle.on("move", drag)

            handle.on("end", (evt)=>{
                this.parent.svgContainer.style.opacity = "1"
                let target = O(document.elementFromPoint(M.x, M.y))
                if(target.hasClass("ls-patch-source-hitbox")){
                    this.parent.connect(...(source.isInput ? [source.id, target.id] : [target.id, source.id]))
                }
                this.parent.element.getAll(".ls-patch-source-hitbox").all(e => e.style.opacity = "1")
                this.parent.svgContainer.getAll(".ls-bay-line").all(e => e.style.opacity = "1")
                this.parent.dragLine.hide()
            })
            
            _this.parent.sources.push(source)
            return source
        }

        destroy(){
            this.svgContainer.remove()
        }
    }

    gl.newNode = function (options){
        return new LS_Node(options)
    }

    return _this=>class LS_PatchBay{
        constructor (id, element, options = {}) {
            if(!LS.Workspace)throw new Error("PatchBay requires Workspace to work properly.");


            options = {
                zoomControls: true,
                import: {},
                ...options
            }

            this.options = options;

            _this = this;
            this.id = options.id || options.import.id || id || M.GlobalID;
            this.nodes = [];
            this.connections = options.import.connections || {};
            this.classes = {};
            this.sources = [];

            this.connectionRenderCache = {};
            this.globalZ = 0;
            this.element = O(element || N());
            this.element.class("ls-patchbay")
            this.svgContainer = O(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

            this.workspace = LS.Workspace(id + "-workspace", element, {...options.workspace || {}})

            // if(options.zoomControls){
            //     this.workspace.element.add(N("ls-group", {
            //         attr: ["join"],
            //         inner: [
            //             N("input"),
            //             N("button", "-"),
            //             N("button", "+"),
            //         ]
            //     }))
            // }

            if(LS.Knob){
                //TODO: Make this work idk
                // this.knob = N("ls-knob", {class: "manual-init", style: "display:hidden"})
                // this.knob.ls = LS.Knob(this.id+"_"+"knob", this.knob, "flat")
                // this.element.add(this.knob)
            }

            if(LS.MultiSelect){
                LS.MultiSelect(this.id + "-bayselect", this.workspace.element, {passthrough: ":not(.ls-patchbay, .ls-workspace)"})
            }

            this.svgContainer.class("ls-bay-svg")
            this.element.add(this.svgContainer)

            this.dragLine = this.addLine()
            this.dragLine.class("line-drag")

            if(options.import.nodes){
                for(let node of options.import.nodes){
                    this.add(new LS_Node(node))
                }
            }
        }

        export(){
            return {
                nodes: _this.nodes.map(node => {
                    return {
                        id: node.id,
                        class: node.class,
                        data: node.data,
                        position: node.position
                    }
                }),
                id: _this.id,
                connections: _this.connections,
                sources: _this.sources.map(source => {
                    return {
                        id: source.id,
                        class: source.class,
                        node: source.node,
                        isInput: source.isInput
                    }
                })
            }
        }

        addLine(opt = {}){
            let group = O(document.createElementNS('http://www.w3.org/2000/svg', 'g')),
                arrow = O(document.createElementNS('http://www.w3.org/2000/svg', 'path')),
                line = O(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
            ;

            group.add(line, arrow);
            group.class("ls-bay-line")

            line.class("ls-bay-line-connector")
            arrow.class("ls-bay-line-arrow")

            if(opt.id){
                group.id = opt.id
                delete opt.id
            }

            opt = {
                stroke: 'var(--accent)',
                'stroke-width': 2,
                fill: 'transparent',
                ...opt
            }

            line.attrAssign(opt)
            arrow.attrAssign({fill: opt.stroke || "var(--accent)", d: "M0 0 L-5 -15 L5 -15 Z"})
            _this.svgContainer.add(group);
            return group
        }

        add(...nodes) {
            for(let node of nodes){
                if(!node)continue;
                node.parent = _this;
                _this.nodes.push(node)
                _this.element.add(node.element)
                _this.globalZ++
                node.element.style.zIndex = _this.globalZ
            }
        }

        remove(...nodes) {

        }

        newNode(options){
            return new LS_Node(options)
        }

        connect(from, to){
            if(from == to)return;
            from = _this.sources.find(s=>s.id==from);
            to = _this.sources.find(s=>s.id==to);

            if(!from||!to)throw new Error("Invalid source/destination");
            if(from.isInput === to.isInput)return;
            if(from.class !== to.class)return;

            if(!_this.connections[from.id]) _this.connections[from.id] = [];
            if(_this.connections[from.id].includes(to.id)) return;
            _this.connections[from.id].push(to.id)

            _this._draw()
        }

        getAccentColor(_class){
            return _this.classes[_class] ? _this.classes[_class].color || "" : "";
        }

        _draw(){
            for(let start of Object.keys(_this.connections)){
                let source = _this.sources.find(s => s.id == start);
                if(!source)continue;
                for(const end of _this.connections[start]){
                    let target = _this.sources.find(s => s.id == end);
                    if(!target)continue;
                    let rect1 = source.handle.drawTarget.getBoundingClientRect()
                    let rect2 = target.handle.drawTarget.getBoundingClientRect()
                    let id = `line-${start}-${end}`
                    if(!_this.connectionRenderCache[id]) _this.connectionRenderCache[id] = {
                        redraw: false
                    }

                    ;(_this.svgContainer.get("#" + id) || _this.addLine({
                        id
                    })).attrAssign({"ls-accent": _this.getAccentColor(target.class)})

                    _this.connectionRenderCache[id].calculated = _this.d(null, rect1.x + (rect1.width / 2), rect1.y + (rect1.height / 2), rect2.x + (rect2.width / 2), rect2.y + (rect2.height / 2), false, true)
                }
            }
            for(const id of Object.keys(_this.connectionRenderCache)){
                _this.dApply(_this.svgContainer.querySelector("#" + id), _this.connectionRenderCache[id].calculated)
            }
        }

        disconnect(from, to){

        }

        calculateCenterPoint(x1, y1, x2, y2, x3, y3) {
            const t = .5;
            return { x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3, y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3 };
        }

        d(path, x1, y1, x2, y2, reverse = false, precalc = false){
            let relative, result = {};

            relative = _this.workspace.relativePoint(x1, y1);
            x1 = relative.canvasXr
            y1 = relative.canvasYr

            relative = _this.workspace.relativePoint(x2, y2);
            x2 = relative.canvasXr
            y2 = relative.canvasYr
            
            let controlX = (x1 + x2) / 2,
                controlY = (y1 > y2) ? y1 : y2
            ;

            result.line = `M${x1} ${y1} Q${controlX} ${controlY} ${x2} ${y2}`;

            const deltaX = x2 - x1;
            const deltaY = y2 - y1;

            let center = this.calculateCenterPoint(x1, y1, controlX, controlY, x2, y2),
                length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 100
            ;

            if(_this.knob){
                _this.knob.style.left = center.x + "px";
                _this.knob.style.top = center.y + "px";
            }

            result.arrowPos = `translate(${center.x}, ${center.y}) rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) + (reverse ? -90 : 90)}) scale(${Math.min(1, length)})`;
            result.arrowOpacity = Math.min(1, length);

            if(!precalc){
                _this.dApply(path, result)
            }
            return result
        }

        dApply(path, d){
            let line = path.get(".ls-bay-line-connector"),
                arrow = path.get(".ls-bay-line-arrow")                            
            ;
            line.setAttribute('d', d.line);
            arrow.setAttribute('transform', d.arrowPos);
            arrow.setAttribute('opacity', d.arrowOpacity);
        }
    }
}});