
// LS proposed new component syntax


global: {
    // Runs on first plugin load
}


instance: {

    // Runs on every instance, returns the instance

    return class {
        constructor(id, ...things){
            // id is the instance ID, things is other arguments
        }
    }

}


