{
    gl.conf = {
        batch: false,
        events: false,
        singular: true,
        becomeClass: true
    }

    return () => {
        console.warn("LS.EventResolver is deprecated; You should migrate to LS.EventHandler")
        return LS.EventHandler
    }
}