{
    return(_this)=>class ASD{
        constructor(id,conf){
            _this=this;
            this.paused=0;
            this.tickDelay=50;
            setInterval(()=>{
                if(this.paused)return;
                this.invoke("tick")
            },this.tickDelay)
        }
        virtualElement(e,inherits=['borderRadius']){
            let virtual=N({
                style:{
                    background: "#4287ec45",
                    border:"1px solid #505dfd",
                    position: "fixed",
                    zIndex: 90000,
                    pointerEvents: "none"
                }
            });
            O().add(virtual)
            _this.on("tick",()=>{
                let cs = S(e),
                    rect = e.getBoundingClientRect()
                S(virtual,{
                    width:rect.width+"px",
                    height:rect.height+"px",
                    top:rect.top+"px",
                    left:rect.left+"px",
                })
                for(const rule of inherits){
                    virtual.style[rule]=cs[rule];
                }
            })
        }
    }
}