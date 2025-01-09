LS.LoadComponent(class Toast extends LS.Component {
    constructor(){
        super()

        let container = this.container = N({
            class: "ls-toast-layer"
        });

        LS.once("body-available", () => {
            LS._topLayer.add(container);
        })
    }
}, { global: true, singular: true })

// {
//     gl.conf={
//         batch: false,
//         singular: true
//     }

//     return _this => class Toasts {
//         constructor(){
//             _this = this;

//             let container = N({
//                 class: "ls-toast-layer"
//             });

//             this.container = container;

//             LS.once("body-available", ()=>{
//                 LS._topLayer.add(container);
//             })
//         }

//         closeAll(){
//             _this.invoke("close-all")
//         }

//         show(content, options = {}){

//             let toast = N({
//                 class: "ls-toast",
//                 attr: {"ls-accent": options.accent || "auto"},
//                 inner: [
//                     options.icon? N("i", {class: options.icon}) : "",
//                     N({inner: content, class: "ls-toast-content"}),
//                     !options.uncancellable? N("button", {
//                         class: "elevated circle ls-toast-close",
//                         inner: "&times;",
//                         onclick(){
//                             methods.close()
//                         }
//                     }): ""
//                 ]
//             })

//             let methods = {
//                 element: toast,

//                 update(content){
//                     toast.get(".ls-toast-content").set(content)
//                 },

//                 close(){
//                     toast.class("open", 0);
//                     setTimeout(()=>{
//                         if(!options.keep) toast.remove()
//                     }, 200)
//                 }
//             }

//             _this.once("close-all", methods.close)

//             _this.container.add(toast);

//             if(options.timeout) setTimeout(()=>{
//                 methods.close()
//             }, options.timeout)
            
//             setTimeout(()=>{
//                 toast.class("open")
//             }, 1)

//             return methods
//         }
//     }
// }