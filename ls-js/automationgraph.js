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
                    height: 200,

                    editableCurvature: true,

                    rightClickToCreate: true,

                    defaultNewPoint: {
                        type: "linear"
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
                        return _this.currentView? _this.currentView.values: _this.options.values || {}
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

                this.startRenderer(this.options.values)
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

            startRenderer(graph = _this.options.values){
                if(_this.currentView){
                    _this.currentView.destroy()
                }

                let handles = {}, uniquePoints = new Set;

                _this.currentView = {
                    get values(){
                        return graph
                    },

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

                    updateScale(x, y){
                        _this.options.scaleX = x || _this.options.scaleX
                        _this.options.scaleY = y || _this.options.scaleY

                        svgWidth = _this.options.width * _this.options.scaleX
                        svgHeight = _this.options.height * _this.options.scaleY

                        _this.containerElement.get("svg").applyStyle({
                            width: svgWidth +"px",
                            height: svgHeight +"px",
                        })

                        redrawAllPoints()
                        draw()
                    },

                    updateSize(newWidth, newHeight){
                        _this.options.width = newWidth || _this.options.width
                        _this.options.height = newHeight || _this.options.height

                        _this.currentView.updateScale()
                    }
                }

                let [svgWidth, svgHeight] = [_this.options.width * _this.options.scaleX, _this.options.height * _this.options.scaleY]

                _this.containerElement.set(`<svg width="${svgWidth}" height="${svgHeight}"><defs><linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:var(--accent);stop-opacity:12%" /><stop offset="100%" style="stop-color:var(--accent);stop-opacity:4%" /></linearGradient></defs><path class="ls-graph-stroke" fill="none" stroke="var(--accent)" /><path class="ls-graph-fill" fill="url(#lineGradient)" /></svg>`)

                let start = TranslatePointY(graph.start);

                let pointSegments = []; // Move to the starting point

                function getPath(){
                    return `M 0 ${start} ${pointSegments.join(" ")}`
                }
        
                function generatePoint(i){
                    let point = graph.points[i];
                    
                    let value = TranslatePointY(point.value)
                    let offset = TranslatePointX(point.offset)
                    let curvature = point.curvature || 0;

                    const prevValue = i === 0 ? start : TranslatePointY(graph.points[i - 1].value);
                    const prevOffset = i === 0 ? 0 : TranslatePointX(graph.points[i - 1].offset);

                    switch(point.type){
                        case "curve":
                            // Curved line

                            const controlPointX = offset - (offset - prevOffset) / 2;
                            const controlPointY = prevValue + curvature * (value - prevValue) / 100;
            
                            pointSegments[i] = `Q${controlPointX},${controlPointY} ${offset},${value}`
                        break;

                        case "linear":
                            // Straight line

                            pointSegments[i] = `L${offset},${value}`;
                        break;

                        default:
                            // Straight jump
                            pointSegments[i] = `L${offset},${prevValue} L${offset},${value}`;
                            // console.log(pointSegments[i]);

                    }

                    if (i === graph.points.length -1){
                        pointSegments[i] += ` L${_this.options.width * _this.options.scaleX},${value}`
                    }

                    return pointSegments[i]
                }

                function redrawAllPoints(){
                    let j = -1;

                    graph.points = graph.points.filter(_ => _).sort((a, b) => a.offset - b.offset)

                    for (const point of graph.points) {
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
                                buttons: [0]
                            })
            
                            handles[point.id] = handle;
                            handles[point.id + "_control"] = controlPointHandle;
            
                            function updateHandle(valuesChanged, updatedIndex){

                                if(!valuesChanged){
                                    value = TranslatePointY(point.value)
                                    offset = TranslatePointX(point.offset)

                                    i = updatedIndex || graph.points.findIndex(_point => _point.id === point.id)
                                }

                                handleElement.style.setProperty("--bottom", (svgHeight - value) + "px")
                                handleElement.style.left = offset + "px";
                                handleElement.style.top = value + "px";


                                if(_this.options.editableCurvature && (point.type === "curve")){

                                    const prevValue = i === 0 ? start : TranslatePointY(graph.points[i - 1].value);
                                    const prevOffset = i === 0 ? 0 : TranslatePointX(graph.points[i - 1].offset);
                                    const controlPointX = offset - (offset - prevOffset) / 2;
                                    const controlPointY = prevValue + (point.curvature || 0) * (value - prevValue) / 100;
        
                                    let center = _this.calculatePathPoint(prevOffset, prevValue, controlPointX, controlPointY, offset, value)
        
                                    controlPointHandleElement.style.left = center.x + "px";
                                    controlPointHandleElement.style.top = center.y + "px";
                                    controlPointHandleElement.style.display = "block";

                                } else controlPointHandleElement.style.display = "none";
                            }

                            handles[point.id].updateHandle = updateHandle;
            
                            handle.on("start", () => {
                                handleElement.class("active")
                            })

                            handle.on("move", (x, y) => {
                                let box = _this.containerElement.getBoundingClientRect();
            
                                let [newX, newY] = [x - box.x, y - box.y];
            
                                newX = Math.max(i === 0? 0: TranslatePointX(graph.points[i - 1].offset), Math.min(i === graph.points.length -1? svgWidth: TranslatePointX(graph.points[i + 1].offset), newX))
                                newY = Math.max(0, Math.min(svgHeight, newY))
            
                                // if((i === 0? true: (newX >= TranslatePointX(graph.points[i - 1].offset))) && (i === graph.points.length -1? true: (newX <= TranslatePointX(graph.points[i + 1].offset)))) offset = newX;
            
                                offset = newX;
                                value = newY;

                                updateHandle(true)

                                if(graph.points[i + 1] && handles[graph.points[i + 1].id] && handles[graph.points[i + 1].id].updateHandle) handles[graph.points[i + 1].id].updateHandle(true)

                                graph.points[i].offset = ReverseTranslatePointX(offset);
                                graph.points[i].value = ReverseTranslatePointY(value);
            
                                generatePoint(i)
                                if(i !== graph.points.length -1) generatePoint(i +1)
                                draw()
                            })
            
                            handle.on("end", () => {
                                handleElement.class("active", false)
                            })

                            let _initialY = null, _initialValue;

                            controlPointHandle.on("start", () => {
                                _initialY = M.y
                                _initialValue = graph.points[i].curvature || 0
                            })

                            controlPointHandle.on("move", (x, y) => {
                                graph.points[i].curvature = _initialValue + (y - _initialY);

                                updateHandle(true)
                                generatePoint(i)

                                draw()
                            })

                            _this.containerElement.add(handleElement, controlPointHandleElement)

                        } else {
                            handles[point.id].updateHandle(null, j)
                        }
                    }

                    let currentSet = new Set(graph.points.map(point => point.id));

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

            calculatePathPoint(x1, y1, x2, y2, x3, y3, t = .5) {
                return {
                    x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3, y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3
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