{
    gl.presets = {
        default: {
            pointer: "dot"
        },

        chrome: {
            arcFill: false,
            arcWidth: 5,
            pointer: "line",
            pointerGlow: true
        },

        flat: {
            arcFill: false,
            arcBackground: true
        },

        progress: {
            arcGap: [180, 540],
            arcFill: false
        }
    }

    gl.defaultStyles = {
        arcGap: [220, 500],
        arc: true,
        arcSpread: 0,
        arcWidth: 15,
        arcRounded: true,
        pointerGlow: false,
        arcBackground: false,
        arcFill: true,
        pointer: "none"
    }

    function describeArc(x, y, radius, spread, startAngle, endAngle, fill){
        function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        }

        var innerStart = polarToCartesian(x, y, radius, endAngle),
            innerEnd = polarToCartesian(x, y, radius, startAngle),
            outerStart = polarToCartesian(x, y, radius + spread, endAngle),
            outerEnd = polarToCartesian(x, y, radius + spread, startAngle),
            largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
        ;

        var d = [
            "M", outerStart.x, outerStart.y,
            "A", radius + spread, radius + spread, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
            ...(fill ? [
                "L", innerEnd.x, innerEnd.y, 
                "A", radius, radius, 0, largeArcFlag, 1, innerStart.x, innerStart.y, 
                "L", outerStart.x, outerStart.y, "Z"
            ] : [])
        ].join(" ");

        return d;
    }

    return _this => class LS_Knob{
        constructor (id, element, style = "default", options = {}) {
            _this = this;

            if(!element || !O(element))throw new Error("No element provided");
            this.element = O(element);

            this.setStyle(this.element.attr("knob-preset") || style || "default", true);

            this.options = {
                min: 0,
                max: 100,
                step: 1,
                ...options
            }

            if(!this.element.has("svg")){
                this.element.add(O(document.createElementNS("http://www.w3.org/2000/svg", "svg")))
            }
            
            this.svg = this.element.get("svg");

            this.svg.attrAssign({
                width: 200,
                height: 200,
                viewBox: "0 0 200 200"
            })

            this.arc = this.svg.get(".ls-knob-arc")
            this.rotor = this.element.get(".ls-knob-rotor");
            this.back = this.svg.get(".ls-knob-back");

            if(!this.element.has(".ls-knob-stator")){
                this.element.add(N({class:"ls-knob-stator"}))
            }

            Object.defineProperties(this, {
                value: {
                    get(){
                        return _value
                    },

                    set(value){
                        _value = Math.max(_this.options.min, Math.min(value, _this.options.max))
                        _this.draw()
                    }
                }
            })


            let _value = _this.options.value || 0;

            let handle = LS.Util.touchHandle(this.element),
                isDragging = false
            ;

            this.handle = handle;
            handle.cursor = "none";
            this.enabled = true;

            this.updateStyle()

            handle.on("start", ()=>{
                _this.drawInit();
                _this.draw();

                this.element.requestPointerLock();
            })

            handle.on("move", (x, y, e) => _this.event(e))
            
            handle.on("end", ()=>{
                if (isDragging) {
                    document.exitPointerLock();
                    isDragging = false;
                }
            })
            
            document.addEventListener('pointerlockchange', () => {
                if (document.pointerLockElement === this.element) {
                    isDragging = true;
                } else {
                    isDragging = false;
                }
            });
        }

        event(event) {
            let step = event? event.movementY * _this.options.step : 0;

            _this.value -= step;
        }

        draw() {
            _this.percentage = ((_this.value - _this.options.min) / (_this.options.max - _this.options.min)) * 100;
            _this.arcAngle = (_this.style.arcGap[0] + (_this.percentage / 100) * (_this.style.arcGap[1] - _this.style.arcGap[0]));
            
            if(_this.invoke) _this.invoke("changed", _this.value)


            if(_this.style.pointer !== "none"){
                _this.rotor.style.transform = `rotate(${_this.arcAngle}deg)`;
            }

            if(_this.style.arc){
                _this.arc.setAttribute("d", _this.Arc(_this.style.arcFill))
            }
        }

        drawInit(){
            if(_this.style.pointer !== "none"){

                if(!_this.rotor){
                    _this.rotor = N({class:"ls-knob-rotor"});
                    _this.element.get(".ls-knob-stator").add(_this.rotor)
                }
                _this.rotor.show()

            } else if(_this.rotor) {
                _this.rotor.hide()
            }

            if(_this.style.arc){
                if(!_this.arc){
                    _this.arc = O(document.createElementNS("http://www.w3.org/2000/svg", "path"))
                    _this.arc.class("ls-knob-arc")
                    _this.svg.add(_this.arc)
                }

                if(_this.style.arcFill){

                    _this.arc.attrAssign({
                        fill: "var(--accent)"
                    })

                } else {

                    _this.arc.attrAssign({
                        fill: "transparent",
                        stroke: "var(--accent)",
                        "stroke-linecap": _this.style.arcRounded? "round": "butt",
                        "stroke-width": _this.style.arcWidth + "%"
                    })
                    _this.element.style.setProperty("--knob-stroke-width", _this.element.getBoundingClientRect().height * (_this.style.arcWidth/100) + "px")
                }

                _this.arc.show()
            } else if (_this.arc) {
                _this.arc.hide()
            }

            if(_this.style.arcBackground && !_this.back){
                _this.back = O(document.createElementNS("http://www.w3.org/2000/svg", "path"));
                _this.back.setAttribute("fill", "transparent")
                _this.arc.addBefore(_this.back)
            }

            if(_this.style.arcBackground){
                _this.back.class("ls-knob-arc-full")
                _this.back.setAttribute("d", _this.Arc(false, _this.style.arcGap[1]))
            }

            _this.element.get(".ls-knob-stator").class("ls-knob-glow", _this.style.pointerGlow ? 1 : 0)
        }

        setStyle(style, quiet = false){
            if(typeof style === "string"){
                let styleName = style;
                style = gl.presets[style] || {}
                style.name = styleName
            }
        
            _this.style = {...gl.defaultStyles, ...style};

            if(!quiet) _this.updateStyle()
        }

        updateStyle(opt = {}){
            Object.assign(_this.style, opt)
            _this.element.attrAssign({"knob-preset": _this.style.name})
            _this.element.attrAssign({"knob-pointer": _this.style.pointer})
            _this.updateOptions()
        }

        updateOptions(opt = {}){
            Object.assign(_this.options, opt)
            _this.drawInit()
            _this.draw()

            setTimeout(() => {_this.drawInit(); _this.draw()}, 4)
        }

        Arc(fill = true, ang = _this.arcAngle){
            if( ang % 180 == 0 ) ang-- ; // Lazy fix
            return describeArc(100, 100, _this.style.arcSpread, 100 - (_this.style.arcFill? 0 : _this.style.arcWidth), _this.style.arcGap[0], ang, fill)
        }
    }
}