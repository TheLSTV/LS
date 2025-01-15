
/*

[ About LS-Native ]

LS-Native is an attempt at a cross-platform, fast and light-weight UI system that works well with mobile devices and desktops alike.
It combines navigation via keyboard shortcuts and gestures for seamless experience and familiarity.

It aims at being tiny in size, easy to deploy in any environment (thus its written in vanilla JavaScript and CSS), and is free and open-source!

It also has extensions made for seamless integration with other platforms like Android (material v3) and GTK on Linux.
This includes the synchronisation of color schemes, and of course dark/light themes, among other things.

*/

LS.LoadComponents({Native(gl) {
    gl.conf = {
        batch: false,
        singular: true
    }

    return _this => class LSNative {
        constructor(id, element) {
            this.platform = window.LSNative_Android_Proxy? "android": window.arc? "arc": "web";

            this.global = {
                close(){
                    switch(this.platform){
                        case "web":
                            return close()
                        case "android":
                            return LSNative_Android_Proxy.handle_void_void("close")
                        case "arc":
                            return arc.closeWindow()
                    }
                }
            }
        }

        connectAndriod(callback){
            if(this.android) return this.android;

            return new Promise((resolve, reject)=>{
                if(typeof callback !== "function") throw "Callback must be a function.";
    
                let tools, timeout = 0;
    
                tools = {
                    Resolve(event, data, options = {}){
                        if(typeof options == "string") options = {type: options};

                        let method = ("handle_" + ((data === null || typeof data == "undefined")? "void" : typeof data) + "_" + (options.type || "void")).toLowerCase().trim();

                        if(!LSNative_Android_Proxy[method]) throw `Unsupported method (${method}). Make sure you have types set right.`;

                        return LSNative_Android_Proxy[method](event)
                    },

                    showToast(text){
                        return tools.Resolve("android.toast", text)
                    },
    
                    DynamicColors: {
                        get isAvailable(){
                            return tools.Resolve("dynamicColors.isAvailable", null, "boolean")
                        },
    
                        get isLightMode(){
                            return tools.Resolve("dynamicColors.isLight", null, "boolean")
                        },
    
                        getColor(){
                            return JSON.parse(tools.Resolve("dynamicColors.getColor", null, "string"))
                        },
    
                        getPalette(){
                            return JSON.parse(tools.Resolve("dynamicColors.getPalette", null, "string"))
                        },
    
                        getMain(){
                            return JSON.parse(tools.Resolve("dynamicColors.getMain", null, "string"))
                        },
                    
                        applyTheme(){
                            let isLight = tools.DynamicColors.isLightMode;
    
                            O().attrAssign({"ls-theme": isLight? "light": "dark"})
                            LS._topLayerInherit()
                        },
    
                        applyAccent(){
                            let colors = tools.DynamicColors.getMain();

                            LS.Color.add("dynamicColor", colors.primary)
                            LS.Color.setAccent("dynamicColor")
                        }
                    }
                }
    
                function checkAvailability(){
                    if(window.LSNative_Android_Proxy){
    
                        this.android = tools;
                        this.platform = "android";
                        resolve(tools)
                        if(callback) callback(tools)
                        clearInterval(awaiting)
    
                    } else {
    
                        timeout++
                        if(timeout > 10){
                            clearInterval(awaiting)
                            resolve(null)
                            if(callback) callback(null)
                            throw new Error("Could not estabilish communication with the Java backend. Make sure you have setup your WebView properly and are using the latest version of the proxy library!")
                        }
    
                    }
                }
    
                let awaiting = setInterval(checkAvailability, 50)
                checkAvailability()
            })

        }
    }
}});

/*

LS.Native.connectAndriod(async android => {
    with(android){
        DynamicColors.apply()
    }
})

*/