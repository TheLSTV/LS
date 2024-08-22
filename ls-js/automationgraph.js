{
    return _this => class AutomationGraphEditor {
        constructor(id, element, options = {}){
            _this = this;

            this.element = element;

            this.element.class("ls-automationgraph")

            this.options = LS.Util.defaults({
                scaleX: 2,
                scaleY: 2,
                width: 600,
                height: 200,

                values: {
                    start: 0,
    
                    points: [
                        {
                            offset: 50,
                            value: 60,
                            type: "square"
                        },
                        {
                            offset: 100,
                            type: "square",
                            value: 80
                        },
                        {
                            offset: 150,
                            value: 30,
                            curvature: 20,
                            type: "exponential"
                        },
                        {
                            offset: 300,
                            value: 30,
                            curvature: 20,
                            type: "linear"
                        },
                        {
                            offset: 150,
                            value: 30,
                            curvature: 20,
                            type: "exponential"
                        },
                    ]
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

            this.element.add(this.containerElement)

            this.startRenderer(this.options.values)
        }

        updateValues(graph = this.options.values){
            this.startRenderer(graph)
        }

        startRenderer(graph, scaleY = _this.options.scaleY, scaleX = _this.options.scaleX, width = _this.options.width, height = _this.options.height){
            if(_this.currentView){
                _this.currentView.destroy()
            }

            let handles = [];

            _this.currentView = {
                get values(){
                    return graph
                },

                destroy(){
                    for(let handle of handles){
                        handle.destroy()
                    }

                    handles = [];

                    _this.containerElement.clear()
                }
            }

            function TranslatePointY(point){
                return (100 - point) * scaleY
            }

            function TranslatePointX(point){
                return point * scaleX
            }

            function ReverseTranslatePointY(point){
                return 100 - (point / scaleY)
            }

            function ReverseTranslatePointX(point){
                return point / scaleX
            }

            let [svgWidth, svgHeight] = [width * scaleX, height * scaleY]

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
                    case "curved": case "exponential": case "round":
                        // Curved line

                        const controlPointX = offset - (offset - prevOffset) / 2;
                        const controlPointY = prevValue + curvature * (value - prevValue) / 100;
        
                        pointSegments[i] = `Q${controlPointX},${controlPointY} ${offset},${value}`
                    break;

                    case "linear": case "line":
                        // Straight line

                        pointSegments[i] = `L${offset},${value}`;
                    break;

                    default:
                        // Straight jump
                        pointSegments[i] = `L${offset},${prevValue} L${offset},${value}`;
                        // console.log(pointSegments[i]);

                }

                if (i === graph.points.length -1){
                    pointSegments[i] += ` L${width * scaleX},${value}`
                }

                return pointSegments[i]
            }
            
            let j = -1;
            for (const point of graph.points) {
                j++;

                let i = +j;

                let value = TranslatePointY(point.value)
                let offset = TranslatePointX(point.offset)

                generatePoint(i)

                let handleElement = N({
                    class: "ls-automationgraph-point-handle"
                });

                updateHandle()
                
                let handle = LS.Util.touchHandle(handleElement, {
                    cursor: "none"
                })

                handles.push(handle);

                function updateHandle(){
                    handleElement.style.setProperty("--bottom", (svgHeight - value) + "px")
                    handleElement.style.left = offset + "px";
                    handleElement.style.top = value + "px";
                }

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

                    updateHandle()

                    graph.points[i].offset = ReverseTranslatePointX(offset);
                    graph.points[i].value = ReverseTranslatePointY(value);

                    generatePoint(i)
                    if(i !== graph.points.length -1) generatePoint(i +1)
                    draw()
                })

                handle.on("end", () => {
                    handleElement.class("active", false)
                })

                _this.containerElement.add(handleElement)
            }

            function draw(){
                let path = getPath();

                _this.containerElement.get(".ls-graph-stroke").attr("d", path)
    
                path += ` L${width * scaleX},${svgHeight} `;
                path += `L0,${svgHeight} Z`;

                _this.containerElement.get(".ls-graph-fill").attr("d", path)
            }

            draw()

            return this.currentView
        }
    }
}