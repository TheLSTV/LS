{
    return(_this) => class Sheet {
        constructor(id, options = {}){
            _this = this;

            this.options = options = LS.Util.defaults({
                element: N()
            }, options)
        }
    }
}