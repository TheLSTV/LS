{

    return _this => {
        return class AutomationGraphEditor {
            constructor(id, element, options = {}){
                _this = this;

                this.element = element;

                this.element.class("ls-automationgraph")

                this.options = LS.Util.defaults({
                    scaleX: 1,
                    scaleY: 1,

                    width: 460,
                    height: 100,

                    editableCurvature: true,
                    switcherTypes: ["square", "linear", "curve"],

                    rightClickToCreate: true,

                    defaultNewPoint: {
                        type: "square"
                    },

                    values: {
                        start: 0,
                        points: []
                    }
                }, options)

                this.containerElement = N({
                    class: "ls-automationgraph-container"
                });

                Object.defineProperty(this, "values", {
                    get() {
                        return _this.options.values || {start: 0, points: []}
                    },

                    set(newValues) {
                        _this.options.values = newValues
                        _this.redrawPoints()
                    }
                })

                this.containerElement.on("contextmenu", event => {
                    if(_this.options.rightClickToCreate){
                        event.preventDefault()

                        if(O(event.target).hasClass("ls-automationgraph-point-handle")) return;

                        let box = this.containerElement.getBoundingClientRect()
                        
                        let point = {
                            ..._this.options.defaultNewPoint,
                            offset: ReverseTranslatePointX(event.clientX - box.x),
                            value: ReverseTranslatePointY(event.clientY - box.y)
                        }

                        if(_this.values.points.find(_point => _point.offset === point.offset)) return;

                        _this.values.points.push(point)
                        _this.currentView.updateScale()
                    }
                })

                this.element.add(this.containerElement)

                this.startRenderer()
            }

            addPoint(point = {}, updateScreen = true){
                _this.values.points.push({
                    ..._this.options.defaultNewPoint,
                    value: _this.values.start,
                    offset: 0,
                    ...point
                })

                if(updateScreen) _this.currentView.updateScale()
            }

            removePoint(index, updateScreen = true){
                if(typeof index === "string"){
                    index = _this.values.points.findIndex(point => point.id === index)
                }

                _this.values.points[index] = null

                if(updateScreen) _this.currentView.updateScale()
            }

            destroy(){
                if(_this.currentView) _this.currentView.destroy()
            }

            updateScale(x, y){
                if(_this.currentView) _this.currentView.updateScale(x, y)
            }

            updateSize(newWidth, newHeight){
                if(_this.currentView) _this.currentView.updateSize(newWidth, newHeight)
            }

            restartRenderer(){
                _this.startRenderer()
            }

            redrawPoints(){
                if(_this.currentView) _this.currentView.redrawPoints()
            }

            startRenderer(){
                if(_this.currentView){
                    _this.currentView.destroy()
                }

                let handles = {}, uniquePoints = new Set;

                let current = {
                    get values(){
                        return _this.options.values
                    }
                }

                _this.currentView = {
                    destroy(){
                        for(let handle in handles){
                            if(handles[handle] && handles[handle].destroy){
                                handles[handle].destroy()
                                delete handles[handle]
                            }
                        }

                        handles = null;

                        _this.containerElement.clear()
                        _this.currentView = null
                    },

                    redrawPoints(){
                        redrawAllPoints()
                        draw()
                    },

                    updateScale(x, y){
                        _this.options.scaleX = x || _this.options.scaleX
                        _this.options.scaleY = y || _this.options.scaleY

                        svgWidth = _this.options.width * _this.options.scaleX
                        svgHeight = _this.options.height * _this.options.scaleY

                        _this.containerElement.get("svg").applyStyle({
                            width: svgWidth +"px",
                            height: svgHeight +"px",
                        })

                        _this.currentView.redrawPoints()
                    },

                    updateSize(newWidth, newHeight){
                        _this.options.width = newWidth || _this.options.width
                        _this.options.height = newHeight || _this.options.height

                        _this.currentView.updateScale()
                    }
                }

                let [svgWidth, svgHeight] = [_this.options.width * _this.options.scaleX, _this.options.height * _this.options.scaleY]

                _this.containerElement.set(`<svg width="${svgWidth}" height="${svgHeight}"><defs><linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:var(--accent);stop-opacity:12%" /><stop offset="100%" style="stop-color:var(--accent);stop-opacity:4%" /></linearGradient></defs><path class="ls-graph-stroke" fill="none" stroke="var(--accent)" /><path class="ls-graph-fill" fill="url(#lineGradient)" /></svg>`)

                let start = TranslatePointY(current.values.start);

                let pointSegments = []; // Move to the starting point

                function getPath(){
                    return `M 0 ${start} ${pointSegments.join(" ")}`
                }
        
                function generatePoint(i){
                    let point = current.values.points[i];
                    
                    let value = TranslatePointY(point.value)
                    let offset = TranslatePointX(point.offset)
                    if(!point.curvature) point.curvature = 0;

                    const previousPoint = getPreviousPoint(i)

                    switch(point.type){
                        case "curve":
                            // Curved line

                            let controlPoints = _this.calculateCurvatureControlPoint(point.curvature, offset, value, previousPoint.x, previousPoint.y)
            
                            pointSegments[i] = `Q${controlPoints.x},${controlPoints.y} ${offset},${value}`
                        break;

                        case "linear":
                            // Straight line

                            pointSegments[i] = `L${offset},${value}`;
                        break;

                        default:
                            // Straight jump
                            pointSegments[i] = `L${offset},${previousPoint.y} L${offset},${value}`;
                    }

                    if (i === current.values.points.length -1){
                        pointSegments[i] += ` L${_this.options.width * _this.options.scaleX},${value}`
                    }

                    return pointSegments[i]
                }

                function getPreviousPoint(i){
                    return {
                        x: i === 0 ? 0 : TranslatePointX(current.values.points[i - 1].offset),
                        y: i === 0 ? TranslatePointY(current.values.start) : TranslatePointY(current.values.points[i - 1].value)
                    }
                }

                function getNextPoint(i){
                    return {
                        x: i === current.values.points.length - 1 ? svgWidth : TranslatePointX(current.values.points[i + 1].offset),
                        y: TranslatePointY(current.values.points[i].value)
                    }
                }

                function redrawAllPoints(){
                    let j = -1;

                    current.values.points = current.values.points.filter(_ => _).sort((a, b) => a.offset - b.offset)

                    pointSegments = []

                    for (const point of current.values.points) {
                        j++;

                        if(!point.id) {
                            point.id = M.uid()
                            uniquePoints.add(point.id)
                        }

                        generatePoint(j)
                        
                        if(!handles.hasOwnProperty(point.id)){
                            let i = +j;

                            let value = TranslatePointY(point.value)
                            let offset = TranslatePointX(point.offset)

                            let handleElement = N({
                                class: "ls-automationgraph-point-handle"
                            });

                            let controlPointHandleElement = N({
                                class: "ls-automationgraph-curve-handle",
                                style: "display: none"
                            });
            
                            updateHandle()

                            let handle = LS.Util.touchHandle(handleElement, {
                                cursor: "none",
                                buttons: [0]
                            })

                            let controlPointHandle = LS.Util.touchHandle(controlPointHandleElement, {
                                cursor: "none",
                                buttons: [0],
                                pointerLock: true
                            })
            
                            handles[point.id] = handle;
                            handles[point.id + "_control"] = controlPointHandle;
            
                            function updateHandle(valuesChanged, updatedIndex){

                                if(!valuesChanged){
                                    value = TranslatePointY(point.value)
                                    offset = TranslatePointX(point.offset)

                                    i = typeof updatedIndex === "number"? updatedIndex: current.values.points.findIndex(_point => _point.id === point.id)
                                }

                                handleElement.style.setProperty("--bottom", (svgHeight - value) + "px")
                                handleElement.style.left = offset + "px";
                                handleElement.style.top = value + "px";

                                if(_this.options.editableCurvature){
                                    let center, previousPoint, nextPoint;

                                    switch(point.type){
                                        case "curve":
                                            previousPoint = getPreviousPoint(i)
                                            
                                            let controlPoints = _this.calculateCurvatureControlPoint(point.curvature, offset, value, previousPoint.x, previousPoint.y)

                                            center = _this.calculatePathPoint(previousPoint.x, previousPoint.y, controlPoints.x, controlPoints.y, offset, value)
                                            break

                                        case "linear":
                                            previousPoint = getPreviousPoint(i)

                                            center = {
                                                x: (previousPoint.x + offset) / 2,
                                                y: (previousPoint.y + value) / 2,
                                                r: Math.atan2(previousPoint.y - value, previousPoint.x - offset) * 180 / Math.PI
                                            }
                                            break

                                        default:
                                            previousPoint = getPreviousPoint(i)

                                            center = {
                                                x: offset + ((previousPoint.x - offset) / 2),
                                                y: previousPoint.y
                                            }
                                    }

                                    // controlPointHandleElement.style.opacity = Math.abs(center.x - offset) < 20? ".1": ".5"
                                    controlPointHandleElement.style.left = center.x + "px";
                                    controlPointHandleElement.style.top = center.y + "px";
                                    controlPointHandleElement.style.display = "block";
                                    controlPointHandleElement.style.transform = `translate(-50%, -50%) rotate(${center.r || 0}deg)`;

                                } else controlPointHandleElement.style.display = "none";
                            }

                            handles[point.id].updateHandle = updateHandle;
            
                            handle.on("start", () => {
                                handleElement.class("active")
                                _this.invoke("handle.grab", i, ReverseTranslatePointX(offset), ReverseTranslatePointY(value))
                            })

                            handle.on("move", (x, y) => {
                                let box = _this.containerElement.getBoundingClientRect();
            
                                let [newX, newY] = [x - box.x, y - box.y];
            
                                let prev = getPreviousPoint(i), next = getNextPoint(i);

                                newX = Math.max(prev.x, Math.min(next.x, newX))
                                newY = Math.max(0, Math.min(svgHeight, newY))
            
                                offset = newX;
                                value = newY;

                                updateHandle(true)

                                if(current.values.points[i + 1] && handles[current.values.points[i + 1].id] && handles[current.values.points[i + 1].id].updateHandle) handles[current.values.points[i + 1].id].updateHandle(true)
                                if(_this.options.editableCurvature && current.values.points[i - 1] && handles[current.values.points[i - 1].id] && handles[current.values.points[i - 1].id].updateHandle) handles[current.values.points[i - 1].id].updateHandle(true)

                                current.values.points[i].offset = ReverseTranslatePointX(offset);
                                current.values.points[i].value = ReverseTranslatePointY(value);
                                _this.invoke("handle.change", i, current.values.points[i].offset, current.values.points[i].value)
                                    
                                generatePoint(i)
                                if(i !== current.values.points.length -1) generatePoint(i +1)
                                draw()
                            })
            
                            handle.on("end", () => {
                                handleElement.class("active", false)
                                _this.invoke("handle.release", i, offset, value)
                            })

                            let _initialY = null, _initialValue;

                            // controlPointHandle.on("start", () => {
                            //     _initialY = M.y
                            //     _initialValue = current.values.points[i].curvature || 0
                            // })

                            // controlPointHandle.on("move", (x, y) => {
                            //     current.values.points[i].curvature = _initialValue + (y - _initialY);

                            //     updateHandle(true)
                            //     generatePoint(i)

                            //     draw()
                            // })

                            controlPointHandle.on("start", (x, y) => {
                                let index = _this.options.switcherTypes.indexOf(point.type || "square") + 1

                                if(index < 0) index = 0;
                                if(index > _this.options.switcherTypes.length) index = 0;

                                _this.values.points[i].type = _this.options.switcherTypes[index]

                                _this.redrawPoints()
                            })

                            _this.containerElement.add(handleElement, controlPointHandleElement)

                        } else {
                            handles[point.id].updateHandle(null, j)
                        }
                    }

                    let currentSet = new Set(current.values.points.map(point => point.id));

                    for(let id of uniquePoints){
                        if(!currentSet.has(id)){
                            // Point removed!

                            if(handles[id]) {
                                handles[id].target.remove()
                                handles[id].destroy()
                            }

                            if(handles[id + "_control"]) {
                                handles[id + "_control"].target.remove()
                                handles[id + "_control"].destroy()
                            }
                        }
                    }
                }

                function draw(){
                    let path = getPath();

                    _this.containerElement.get(".ls-graph-stroke").attr("d", path)
        
                    path += ` L${_this.options.width * _this.options.scaleX},${svgHeight} `;
                    path += `L0,${svgHeight} Z`;

                    _this.containerElement.get(".ls-graph-fill").attr("d", path)
                }

                redrawAllPoints()
                draw()

                return this.currentView
            }

            calculateCurvatureControlPoint(curvature, x1, y1, x2, y2) {
                return {
                    x: x1 - (x1 - x2) / 2,
                    y: y2 + (curvature || 0) * (x1 - x2) / 100
                }
            }

            calculatePathPoint(x1, y1, x2, y2, x3, y3, t = .5) {
                return {
                    x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3, y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3,
                    r: Math.atan2(y3 - y1, x3 - x1) * 180 / Math.PI
                }
            }
        }

        function TranslatePointY(point){
            return (100 - point) * _this.options.scaleY
        }
    
        function TranslatePointX(point){
            return point * _this.options.scaleX
        }
    
        function ReverseTranslatePointY(point){
            return 100 - (point / _this.options.scaleY)
        }
    
        function ReverseTranslatePointX(point){
            return point / _this.options.scaleX
        }
    }
}