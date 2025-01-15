LS.LoadComponents({Resize(gl) {
    let directions = ["top", "bottom", "left", "right", "topleft", "topright", "bottomleft", "bottomright"],
        cursor = ["ns-resize", "ns-resize", "ew-resize", "ew-resize"],
        values = ["height", "height", "width", "width"]
    ;

    return(_this)=>class Resize{
        constructor(id, element, sides = [1, 1, 1, 1, 0, 0, 0, 0], options = {}){
            _this = this;
            this.sides = sides;
            this.values = [0, 0, 0, 0];

            this.options = {
                snap: false,
                snapArea: 140,
                snapTarget: 4,
                set: true,
                absolute: false,
                ...options
            };

            this.element = O(element);

            this.update();
        }

        update(sides = this.sides){
            _this.sides = Array.isArray(sides)? sides.length < 8 ? [...sides, ...Array(8 - sides.length).fill(0)] : sides.slice(0, 8) : [1, 1, 1, 1, 0, 0, 0, 0];

            sides = _this.sides;

            for(const [i,s] of sides.entries()){
                if(i > 7) break;
                this[s? "addHandle" : "removeHandle"](i)
            }
        }

        addHandle(side){
            let direction = directions[side];

            if(!direction) throw new Error("Invalid resize direction");

            if((side > 8 || side < 0) || _this.element.has(".ls-resize-bar-" + direction)) return;

            let handleElement = N({
                class: "ls-resize-bar ls-resize-bar-" + direction
            });

            let handle = LS.Util.touchHandle(handleElement, {buttons: [0]}), initialX, initialY, initialBox, top, left;

            handle.on("move", (x, y)=>{

                let realSides = [side], properties = {};

                if(side > 3) switch(side){
                    case 4: realSides = [0, 2]; break;
                    case 5: realSides = [0, 3]; break;
                    case 6: realSides = [1, 2]; break;
                    case 7: realSides = [1, 3]; break;
                }

                for(const side of realSides){
                    let value, realValue, box = _this.element.getBoundingClientRect();
    
                    switch(side){
                        case 0: // Top
                            // TODO: Make work with all scenarios
                            if(this.options.absolute){
                                realValue = initialBox.height - (y - initialY)
                            }else{
                                realValue = innerHeight - y
                            }
                        break;
                        case 1: // Bottom
                            if(this.options.absolute){
                                realValue = y - box.top
                            }else{
                                // TODO: FIX!
                                // value = initialBox.height - (y - initialY)
                                // if(value < 0) value = 0;
                                // _this.element.style.top = top - (value - initialBox.height) +"px"
                            }
                        break;
                        case 2: // Left
                            // TODO: Make work with all scenarios
                            realValue = initialBox.width - (x - initialX)
                        break;
                        case 3: // Right
                            // TODO: Make work with all scenarios
                            realValue = x - box.left
                        break;
                    }
    
                    value = realValue;
                    if(value < 0) value = 0;
    
                    if(_this.options.snap){
                        if(realValue < _this.options.snapArea){
                            value = _this.options.snapArea
                        }
                        if(realValue < _this.options.snapArea / 2){
                            value = _this.options.snapTarget
                        }
                    }
    
                    if(this.options.absolute){
                        switch(side){
                            case 0:
                                properties.top = top - (value - initialBox.height)
                            break;
                            case 2:
                                properties.left = left - (value - initialBox.width)
                            break;
                        }
                    }
    
                    _this.values[side] = value
                    properties[values[side]] = _this.values[side]
    
                    if(_this.options.set) {
                        for(let property in properties){
                            if(!properties.hasOwnProperty(property)) continue;
        
                            _this.element.style[property] = properties[property] +"px"
                        }
                    }
                }

                _this.invoke("resize", direction, properties)
            })

            handle.on("start", ()=>{
                initialX = M.x;
                initialY = M.y;
                initialBox = _this.element.getBoundingClientRect();

                left = getComputedStyle(_this.element).left.match(/\d+|[.]/g);
                left = left? +left.join(""): 0;

                top = getComputedStyle(_this.element).top.match(/\d+|[.]/g);
                top = top? +top.join(""): 0;

                handle.cursor = cursor[side]
                _this.invoke("resizestart", direction)
            })

            handle.on("end", ()=>{
                _this.invoke("resizeend", direction)
            })

            _this.element.add(handleElement)
        }

        removeHandle(side){
            let direction = directions[side];
            if((side>4||side<0) || !_this.element.has(".ls-resize-bar-" + direction)) return;

            _this.element.get(".ls-resize-bar-" + direction).remove();
        }
    }
}});