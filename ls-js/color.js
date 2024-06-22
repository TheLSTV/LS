{
    gl.conf = {
        batch: false,
        singular: true
    }

    return _this => class Color{
        constructor(){
            _this = this;

            // Default colors and themes available out of the box
            this.default = {
                colors: ["auto", "rich-black", "navy", "blue", "lapis", "pastel-indigo", "teal", "pastel-teal", "aquamarine", "mint", "green" ,"lime", "neon", "yellow", "orange", "deep-orange", "red", "rusty-red", "pink", "hotpink", "purple", "soap", "burple", "gray", "gray-light", "white", "black", "sand", "cozy", "icepop", "sport"],
                themes: ["dark", "light", "amoled"]
            }
            
            // Custom colors and themes
            this.colors = {};
            this.themes = {};

            // Style tag to manage
            this.style = O("#ls-colors");

            if(!this.style){
                LS.once("body-available", ()=>{
                    this.style = N("style", {id: "ls-colors"});

                    O("#ls-top-layer").add(this.style)
                })
            }

            Object.defineProperties(this, {
                lightModePreffered: {
                    get(){
                        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
                    }
                }
            })

            if(window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: light)').addListener(thing => {
                    _this.invoke("scheme-changed", thing.matches)
                })
            }
        }

        add(name, r, g, b){
            if(_this.default.colors.includes(name) || _this.colors[name]) return false;

            let color = C(r, g, b), values = color.color

            _this.colors[name] = values;

            _this.style.add(`[ls-accent="${name}"]{--accent-raw:${values[0]},${values[1]},${values[2]};--accent-dark-raw:${color.darken(10).color.slice(0, 3).join(",")};--accent-background-raw:${color.darken(20).saturation(20).color.slice(0, 3).join(",")};--accent-light-raw:${color.lighten(10).color.slice(0, 3).join(",")};--color-bg:${color.hsl[2] > 50? "#222": "#eee"}}`)
            return true
        }

        setAccent(accent){
            O().setAttribute("ls-accent", accent)
            LS._topLayerInherit()
        }

        setTheme(theme){
            O().setAttribute("ls-theme", theme)
            _this.invoke("theme-changed", theme)

            LS._topLayerInherit()
        }

        adaptiveTheme(amoled){
            LS.Color.setTheme(_this.lightModePreffered? "light": amoled? "amoled" : "dark")
        }

        watchScheme(amoled){
            LS.once("body-available", () => {
                _this.adaptiveTheme();
                _this.on("scheme-changed", () => _this.adaptiveTheme())
            })
        }

        all(){
            return [..._this.default.colors, ...Object.keys(_this.colors)]
        }

        random(){
            return C(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256))
        }

        randomAccent(){
            let colors = _this.all();
            return colors[Math.floor(Math.random() * colors.length)];
        }

        getAverageRGB(image, sampleGap = 20){
            let canvas = N("canvas"),
                context = canvas.getContext && canvas.getContext("2d"),
                index = -4,
                color = [0, 0, 0],
                sampleCount = 0
            ;

            if (!context) return C(...color);

            canvas.height = image.naturalHeight || image.offsetHeight || image.height;
            canvas.width = image.naturalWidth || image.offsetWidth || image.width;
            
            context.drawImage(image, 0, 0);

            let imageData;
            try {
                imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            } catch (error) {
                console.error(error);
                return C(...color);
            }

            for (let i = imageData.data.length; (index += sampleGap) < i; ) {
                ++sampleCount
                color[0] += imageData.data[index]
                color[1] += imageData.data[index + 1]
                color[2] += imageData.data[index + 2]
            }
        
            return (color[0] = ~~(color[0] / sampleCount)), (color[1] = ~~(color[1] / sampleCount)), (color[2] = ~~(color[2] / sampleCount)), C(...color);
        }
    }
}