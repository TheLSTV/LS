{
    return _this => class ProgressBar{
        constructor(id, element, options = {}){
            this.element = element = O(element)
            if(!element) throw "No element provided";

            _this = this;

            this.options = LS.Util.defaults({
                seeker: element.tagName == "LS-SEEKER",
                styled: true,
                vertical: false,
                padding: options.vertical? 16: 0,
                separator: element.tagName == "LS-SEEKER"? "" : "/",
                label: true
            }, options)

            element.class("ls-progress");
            element.attrAssign("chv");

            if(this.options.seeker) this.element.class("ls-seek");
            if(this.options.styled) this.element.class("ls-progress-styled");

            element.add(
                N({class: "ls-progress-bar"}),

                this.options.seeker? N({class: "ls-seeker-thumb"}) : null,
                this.options.label?

                N({
                    class: "ls-progress-label",
                    inner:[
                        N("span", {class: "ls-progress-label-left"}),
                        N("span", {class: "ls-progress-label-separator"}),
                        N("span", {class: "ls-progress-label-right"})
                    ]
                }): null
            )

            if(this.options.label){
                this.labelLeft = _this.element.get(".ls-progress-label-left");
                this.labelRight = _this.element.get(".ls-progress-label-right");
                this.labelSeparator = _this.element.get(".ls-progress-label-separator");
            }

            _this._min = this.options.min || +element.attr("min") || 0;
            _this._max = this.options.max || +element.attr("max") || 100;
            _this.step = this.options.step || +element.attr("step") || 1;

            _this._progress = this.options.progress || 0;
            _this._value = Math.min(_this._max, Math.max(_this._min, this.options.value || +element.attr("value") || 0));

            if(!_this.options.metric && element.attr("metric")) _this.options.metric = element.attr("metric");

            this.define(this)

            if(this.options.progress && this.options.value)throw("You can't define both the progress and value.")
        }

        _init(){
            _this.bar = _this.element.get(".ls-progress-bar");

            if(_this.options.label) _this.label = _this.element.get(".ls-progress-label");

            if(_this.options.seeker){
                _this.thumb = _this.element.get(".ls-seeker-thumb");

                let handle = LS.Util.touchHandle(_this.element, {exclude: ".ls-progress-label-left"});

                if(_this.options.label) {
                    _this.labelLeft.style.userSelect = "";
    
                    _this.labelLeft.on("dblclick", ()=>{
                        _this.labelLeft.attrAssign({"contenteditable": "true", "tabindex": "5"})
                        _this.labelLeft.focus()
                    })
    
                    _this.labelLeft.on("blur", ()=>{
                        _this.labelLeft.delAttr("contenteditable")
                        let value = Math.max(_this._min, Math.min(_this._max, +_this.labelLeft.innerText));
                        console.log(value);
    
                        if(isNaN(value))return _this.labelLeft.set(_this._value);
    
                        _this._value = value;
                        _this.update(false, true);
                    })
    
                    _this.labelLeft.on("keypress", (e) => {
                        if(e.key == "Enter") _this.labelLeft.blur()
                    })
                }

                _this.handle = handle;

                handle.on("start", (e, cancel)=>{
                    if(_this.element.hasAttr("disabled")) return;
                    _this.seeking = true;
                    _this.invoke("seekstart", _this._value, _this._max, _this._progress)
                    if(LS.Tooltips) LS.Tooltips.show();
                })
                
                handle.on("move", (x, y, event) => {
                    let rect = _this.element.getBoundingClientRect(),
                        offset = (_this.options.vertical ? (y - rect.top) : (x - rect.left)) / _this.step,
                        range = _this.max - _this._min,
                        newValue = Math.round(((_this.options.vertical ? rect.height - offset : offset) / (_this.options.vertical ? rect.height : rect.width)) * range)
                    ;

                    newValue = Math.floor(newValue * _this.step) + _this._min;

                    if (newValue >= _this._min && newValue <= _this.max) {
                        if (LS.Tooltips) {
                            LS.Tooltips.set(String(newValue));
                            LS.Tooltips.position(_this.thumb);
                        }
                
                        _this._value = newValue;
                        _this.update(false, true);
                    }
                });                

                handle.on("end", ()=>{
                    _this.seeking = false;

                    _this.invoke("seekend", _this._value, _this._max, _this._progress)

                    if(LS.Tooltips) LS.Tooltips.hide();
                })
            }

            _this.update(_this.options.progress && !_this.options.value);
        }

        define(scope){

            Object.defineProperties(scope, {
                progress: {
                    get(){
                        return _this._progress
                    },

                    set(value){
                        _this._progress = value
                        _this.update(true)
                    }
                },
                value: {
                    get(){
                        return _this._value
                    },

                    set(value){
                        _this._value = value
                        _this.update()
                    }
                },
                max: {
                    get(){
                        return _this._max
                    },

                    set(value){
                        _this._max = value
                        _this.update()
                    }
                },
                min: {
                    get(){
                        return _this._min
                    },

                    set(value){
                        _this._min = value
                        _this.update()
                    }
                }
            })
        }

        update(setPercentage, isSeeking) {
            if (_this.seeking && !isSeeking) return;
        
            // Adjust calculations to account for _this._min
            const range = _this.max - _this._min; // The range between min and max
        
            if (!setPercentage) {
                // Calculate progress considering the minimum value
                _this._progress = ((_this.value - _this._min) / range) * 100;
            } else {
                // Calculate value considering the progress and minimum value
                _this._value = (_this._progress * range) / 100 + _this._min;
            }
        
            if (_this.options.seeker) {
                // Set the thumb position based on progress
                _this.thumb.style[_this.options.vertical ? "bottom" : "left"] = _this.options.padding 
                    ? `calc(${_this.progress}%)` 
                    : (_this.progress + "%");
        
                // Invoke "seek" event if the user is seeking
                if (isSeeking) _this.invoke("seek", _this._value, _this._max, _this._progress);
            }
        
            // Invoke "change" event whenever the value changes
            _this.invoke("change", _this._value, _this._max, _this._progress);
        
            // Update the progress bar width/height based on progress
            _this.bar.style[_this.options.vertical ? "height" : "width"] = _this.progress + "%";
        
            // Update labels if label options are enabled
            if (_this.options.label) {
                _this.labelLeft.set(String(_this.value));
                _this.labelSeparator.set(_this.options.separator);
                _this.labelRight.set(String(_this.max) + (_this.options.metric ? " " + _this.options.metric : ""));
            }
        }        
    }
}