LS.LoadComponents({GraphGL(gl) {
    return _this=>class GraphGL{
        constructor(id,element,_options={}){
            _this=this;
            this.id=id;
            let options=Object.assign({
                height:100,
                width:300,
                default:{shadow:{inner:{}}},
                charts:[],
                tooltip:true,
                blur:20
            },_options);
            this.ns="http://www.w3.org/2000/svg";
            this.options=options;
            this.element=O(element);
            this.charts={};
            this.container=N('div',{inner:[
                N("svg",{ns:this.ns,id:"graphgl_graph_"+id,class:"ls-chart-vector",attr:{viewBox:`0 0 ${options.width} ${options.height}`,width:options.width,height:options.height,xmlns:this.ns}}),
                N({class:"ls-chart-line",attr:"ns"}),
                N({class:"ls-chart-tooltip",attr:["ls-box","ns"],inner:"some text<br>some more"}),
            ],class:"ls-chart-container",id:"ls-chart-"+id});
            this.svg=this.container.get("svg")
            this.tooltip=this.container.get(".ls-chart-tooltip")
            this.svg.add(N("defs",{ns:this.ns,innerHTML:`<filter id="gr_blur_${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${options.blur||0}" /></filter>`}))
            this.defs=this.container.get("svg defs")
            this.element.add(this.container);
            this.container.on("mousemove","touchmove",event=>{
                if(!this.points||!this.options.tooltip)return;
                let rect=this.container.getBoundingClientRect(),content=[],index=Math.round((event.clientX-rect.left)/(this.options.width/this.points)),x=index*(this.options.width/this.points),y=event.clientY-rect.top;
                this.container.get(".ls-chart-line").style.left=this.tooltip.style.left=x+"px"
                this.tooltip.style.top=y+"px";
                if(this.lastPoint==index)return;
                this.lastPoint=index
                if(this.options.labelsX)content.push("<div class='ls-chart-tooltip-top'>"+this.options.labelsX[index]+"</div>");
                for(let chart of Object.values(this.charts)){
                    let point = this.container.get("#graphgl_point_"+chart.id)
                    let color = this.container.getAll("#gr_grad_"+chart.id+" stop").map(e=>e.attr("stop-color"))[index]
                    if(point){
                        point.style.top=chart.points[index][1]+"px"
                        point.style.left=x+"px";
                        point.style.background=color;
                    }
                    content.push(options.contentFunction?options.contentFunction(chart,index):`<div style=background:${color} class=ls-chart-dot></div> ${chart.options.values[index]/(chart.options.divide||0)}${chart.options.metric} ${chart.options.name||""}`)
                    this.tooltip.innerHTML=content.join("<br>");
                }
            })
            for(let g of options.charts){
                g=Object.assign({
                    values:[100,20,30,25,60,70,65,75,45,0],
                    colors:["#42CF00","#8DBD00","#A68B00","#A68B00","#955102","#823205","#6D0808"].reverse(),
                    colorFunction:(v,i)=>{
                        this.clamp(Math.round()-1)
                        return `rgb(${240-(v/this.options.height)*240},${(v/this.options.height)*240},15)`
                    },
                    coloringMethod:"function",//gradient | function | static
                    stroke:8,
                    rounding:20,
                    fluid: true
                },options.default,g)
                g.shadow=Object.assign({allowed:true,spread:7,position:"0,10",opacity:.4},g.shadow);
                g.shadow.inner=Object.assign({allowed:true,y:2,opacity:.4},g.shadow.inner);
                this.graphFactory(M.GlobalID, g);
            }
        }
        graphFactory(id, options){
            if(_this.charts[id])return _this.charts[id];
            let gr;
            return new(class LineGraph{
                constructor(){
                    _this.charts[id]=this;
                    gr=this;
                    gr.id=id;
                    gr.options=options;
let chart=`
<polyline fill="none" id="graphgl_poly_${id}"></polyline>
<path id="graphgl_path_${id}" fill="none" stroke="url(#gr_grad_${id})" stroke-width="${options.stroke}" stroke-linecap="round"></path>`;
// _this.svg.innerHTML+=chart;
let group = N('g',{ns:_this.ns,innerHTML:chart,class:"ls-chart-group",id:"ls-chart-"+id});
_this.svg.add(group)
_this.defs.innerHTML+=`<linearGradient id="gr_grad_${id}" x1="0" y1="0" x2="${_this.options.width}" y2="0" gradientUnits="userSpaceOnUse">
${options.values.map((v,i)=>`<stop offset="${(1/(options.values.length-1))*i}" stop-color="${options.coloringMethod=="gradient"?options.colors[_this.clamp(Math.round((v/_this.options.height)*options.colors.length)-1,0,options.colors.length-1)]:options.coloringMethod=="static"?options.colors:options.colorFunction(v,i)}"></stop>`).join("")}
</linearGradient>
${options.shadow.inner.allowed?`<filter id="gr_inner_${id}" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
<feOffset dy="${options.shadow.inner.y}"></feOffset>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"></feComposite>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${options.shadow.inner.opacity} 0"></feColorMatrix>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_253_365"></feBlend>
</filter>`:''}`
                    _this.container.add(N({class:"ls-chart-point",attr:"ns",id:"graphgl_point_"+id}))
                    gr.group = group;
                    gr.line = group.get("#graphgl_path_"+id);
                    gr.poly = group.get("#graphgl_poly_"+id);
                    _this.points=gr.options.values.length-1;
                    gr.updatePoints();
                    gr.updateStyle()
                }
                calcPoints(values){
                    if(values)gr.options.values=values;
                    gr.maxPoint=gr.options.fluid?Math.max(...gr.options.values):100
                    return gr.points = gr.options.values.map((v,i)=>[(_this.options.width/(gr.options.values.length-1))*i,_this.options.height-((v/gr.maxPoint)*_this.options.height)])
                }
                updatePoints(values){
                    gr.calcPoints(values);
                    if(options.poly){
                        gr.poly.attrAssign({
                            points: gr.points.join(" "),
                            stroke: "url(#gr_grad_"+id+")",
                            "stroke-width": options.stroke
                        })
                    }else{
                        gr.path = _this.gPath(gr.points, options.rounding);
                        gr.line.attr("d",gr.path);
                    }
                }
                updateStyle(){
                    if(options.shadow.allowed&&!gr.group.get("#graphgl_shadow_"+id)){
                        gr.group.add({ns:_this.ns,innerHTML:gr.line.outerHTML.replace("_path_","_shadow_")});
                        gr.shadow=gr.group.get("#graphgl_shadow_"+id);
                        gr.shadow.attrAssign({
                            filter: "url(#gr_blur_"+_this.id+")",
                            transform: "translate("+options.shadow.position+")",
                            "stroke-width":options.shadow.spread,
                            style: "opacity:"+options.shadow.opacity
                        })
                    }
                    gr.line[options.shadow.inner.allowed?"attr":"delAttr"]("filter",options.shadow.inner.allowed?"url(#gr_inner_"+id+")":0);
                }
            })
        }
        clamp(num,min,max){return Math.min(Math.max(num,min),max)}
        gPath(e,b){
            function getAngle(b,c){let d=c.x-b.x,e=c.y-b.y,f=Math.atan2(e,d);return f}
            function removeEmptyElements(a){for(let b=0;b<a.length;b++)""==a[b]&&a.splice(b,1);return a}
            let f=`M${e[0][0]},${e[0][1]}`;
            for(let d=1;d<e.length-1;d++){
                let a=d-1,g=d+1,h={};
                h.x=e[d][0],h.y=e[d][1];
                let c={x:e[a][0],y:e[a][1]},i={};i.x=e[g][0],i.y=e[g][1];
                let j=getAngle(h,c),k=getAngle(h,i),l=(h.x+b*Math.cos(j)).toFixed(3),m=(h.y+b*Math.sin(j)).toFixed(3),n=(h.x+b*Math.cos(k)).toFixed(3),o=(h.y+b*Math.sin(k)).toFixed(3);
                f+="L"+l+","+m+" Q"+h.x+","+h.y+" "+n+","+o
            }
            return f+=`L${e[e.length-1][0]},${e[e.length-1][1]}`
        }
    }
}});