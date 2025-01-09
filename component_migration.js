// Component structure has changed in v5, and newly looks like this:

// LS v5 Components:
class myCoolComponent extends LS.Component {
    constructor(){
        super();
    }
}

LS.LoadComponent(myCoolComponent, { name: "myCoolComponent" })


// LS v4 Components:
LS.LoadComponents({ myCoolComponent: (gl) => {
    return (_this) => new class {
        constructor(){
            _this = this
        }
    }
} })