{
    gl.conf = {
        batch: false,
        events: false,
        singular: true,
        becomeClass: true
    }
    return(_this)=>class EventClass{
        constructor(target = null){
            this.listeners = [];
            this.events = {};
            _this = this;
            if(target){
                Object.assign(target, {
                    emit: this.invoke,
                    invoke: this.invoke,
                    on: this.on,
                    once: this.once,
                    off: this.off
                })
            }
        }
        prepare(evt){
            if(typeof evt == "string"){
                evt = {name:evt}
            }

            let name = evt.name;
            delete evt.name;

            _this.events[name] = {...(_this.events[name]||{}), ...evt};
            return evt
        }
        async invoke(name, ...a){
            let evt = _this.prepare(name);
            if(typeof name!="string")name = name.name;

            let ReturnValues=[];

            for(const e of _this.listeners){
                if(!e || e.for !== name) continue;
                ReturnValues.push(await e.f(...a));
                if(e.once)delete _this.listeners[e.i];
            }
            return ReturnValues
        }
        on(type, callback, extra){
            let index = _this.listeners.length;

            _this.invoke("event-listener-added", index)

            if(_this.events[type]){
                let evt = _this.events[type];
                if(evt.completed)callback();
            }

            _this.listeners.push({
                for: type,
                f: callback,
                i: index,
                id: M.GlobalID,
                ...extra
            })
            return _this
        }
        once(type, evt, extra){
            _this.on(type, evt, {
                once: true,
                ...extra
            })
            return _this
        }
        off(type, evt){
            for(const e of _this.listeners){
                if(e.f == evt) return delete _this.listeners[e.i];
            }
            return false
        }
        onChain(...events){
            let func=events.find(e=>typeof e=="function");
            for(const evt of events){
                _this.on(evt, func);
            }
        }
        destroy(){
            _this.on = _this.off = ()=>{}
            _this.listeners = []
            _this.events = []
        }
    }
}