{
    let initialX = 0, prevX = 0, velocityX = 0, initialY = 0, prevY = 0, velocityY = 0, activeInstance, relative, scrollAllowed = false, prevMargin, boundX, boundY, target = null, snapValues;
    function frame(){

        let x = M.x,
            y = M.y
        ;

        let parentBox = getParentBox(), scrollBox = getParentBox(true);

        if(activeInstance.options.relativeMouse){
            x -= relative.x
            y -= relative.y
        }
        
        if(gl.firstFrame){
            gl.firstFrame = false;
            prevX = x
            prevY = y
        }

        if(M.ShiftDown && prevX !== null || activeInstance.options.lockX) x = prevX;

        if(activeInstance.options.lockY) y = prevY;

        if(Array.isArray(snapValues)){
            for(let value of snapValues){
                if(value - x > -activeInstance.options.snapArea && value - x < activeInstance.options.snapArea) {x = value; break};
            }
        }

        if(!activeInstance.options.lockX) gl.dragArea.style.left = x +"px"
        if(!activeInstance.options.lockY) gl.dragArea.style.top = y +"px"

        if(activeInstance.options.animate){
            if(x !== prevX) {velocityX = x - prevX} else {if(velocityX > 0) {velocityX--} else {velocityX++}}
            if(y !== prevY) {velocityY = prevY - y} else {if(velocityY > 0) {velocityY--} else {velocityY++}}
            
            gl.dragArea.style.transform = `translate(${activeInstance.options.relativeMouse? "0" : "-50%"}, ${velocityY}px) rotate(${velocityX}deg)`
        }

        prevX = x
        prevY = y

        if(activeInstance.options.absoluteX) {
            boundX = (gl.current.getBoundingClientRect().left - parentBox.left) + getParent().scrollLeft;
            if(!activeInstance.options.overflow && boundX < 0){
                boundX = 0
            }
            if(activeInstance.options.dropPreview){
                gl.previewBox.style.left = boundX + "px"
            }
        }

        if(activeInstance.options.absoluteY) {
            boundY = (gl.current.getBoundingClientRect().top - parentBox.top) + getParent().scrollTop;
            if(!activeInstance.options.overflow && boundY < 0){
                boundY = 0
            }
            if(activeInstance.options.dropPreview){
                gl.previewBox.style.top = boundY + "px"
            }
        }

        if(scrollAllowed){
            if(activeInstance.options.scrollY) {
                if(M.y > scrollBox.bottom) getParent(true).scrollBy(null, Math.min(40, M.y - scrollBox.bottom))
                if(M.y < scrollBox.top) getParent(true).scrollBy(null, Math.min(40, -(scrollBox.top - M.y)))
            }

            if(activeInstance.options.scrollX) {
                if(M.x > (scrollBox.right - 20)) getParent(true).scrollBy(Math.min(40, (M.x - (scrollBox.right - 20))/2), null)
                if(M.x < (scrollBox.left + 20)) getParent(true).scrollBy(Math.min(40, -(((scrollBox.left + 20)) - M.x)/2), null)
            }
        }

        if(gl.moving && gl.dragArea) requestAnimationFrame(frame);
    }

    function getParentBox(scrollBox, instance = activeInstance){
        return getParent(scrollBox, instance).getBoundingClientRect()
    }

    function getParent(scroll, instance = activeInstance){
        return O((scroll? instance.options.scrollContainer : instance.options.container) || instance.options.container || (gl.current? gl.current.parentElement: instance.element))
    }

    function isAllowed(source, target){
        // TODO: Check for groups
        return target.lsDropTarget === activeInstance.id || activeInstance.options.allowedTargets.includes(target.lsDropTarget) || target === getParent()
    }

    function dropHover(drop){
        if(!isAllowed(gl.current, drop)) return;

        aX = gl.previewBox.getBoundingClientRect().left;

        target = drop;

        if(gl.moving && gl.dragArea && activeInstance.options.dropPreview){
            gl.previewBox.style = `
                height: ${gl.current.clientHeight}px;
                width: ${gl.current.clientWidth}px;
                margin: ${prevMargin};
                border-radius: ${getComputedStyle(gl.current).borderRadius};x
                display: ${getComputedStyle(gl.current).display};
                position: absolute;
            `

            if(activeInstance.options.absoluteX) gl.previewBox.style.marginRight = gl.previewBox.style.marginLeft = "0px";
            if(activeInstance.options.absoluteY) gl.previewBox.style.marginTop = gl.previewBox.style.marginBottom = "0px";

            drop.add(gl.previewBox)
        }
    }

    function waitForIt(){
        if(!gl.engaged) return;
        
        if(Math.abs(initialX - M.x) < activeInstance.options.tolerance && Math.abs(initialY - M.y) < activeInstance.options.tolerance) {
            return setTimeout(waitForIt, 1)
        }

        if(activeInstance.options.outsideParent && gl.current.parentElement.matches(":hover")) return setTimeout(waitForIt, 1);

        // Start the actual drag
        dropHover(activeInstance.options.sameParent? getParent() : gl.current.parent)

        scrollAllowed = getParent().matches(":hover");

        gl.moving = true
        gl.dragArea.clear()
        gl.dragArea.style.transform = "";
        
        if(activeInstance.options.clone){
            gl.current = N({innerHTML: gl.current.outerHTML}).get("*")
        }else{
            gl.current.style.margin = "0";
        }

        gl.current.class("ls-held")

        let snap = activeInstance.options.getters.snapAt;
        if(Array.isArray(snap)){
            snapValues = [];
            for(let element of snap){
                let box = element.getBoundingClientRect(),
                    sub = [
                        box.left,
                        box.right,
                        box.left - gl.current.clientWidth,
                        box.right - gl.current.clientWidth,
                    ]
                ;

                snapValues.push(...sub)
            }
        }

        requestAnimationFrame(frame)
        
        gl.dragArea.add(gl.current)

        if(activeInstance.options.absoluteX){
            gl.current.style.left = "0";
        }

        if(activeInstance.options.preserveHeight){
            gl.dragArea.style.height = relative.box.height +"px"
        }

        if(activeInstance.options.sameParent){
            dropHover(getParent())
        }

        gl.dragArea.show()

        activeInstance.invoke("drag", gl.current)
    }

    async function end(){
        if(gl.moving && gl.dragArea){
            gl.moving = false

            let drop = activeInstance.options.movementOnly? gl.parent : (!activeInstance.options.strictDrop ? target : O(document.elementsFromPoint(M.x, M.y).reverse().find(e => e.lsDrop)));
            
            if(drop && drop.lsDrop && isAllowed(gl.current, drop)){
                
                // Dropped sucessfully
                let push = true, morph = true, event = {
                    cancelPush(){
                        push = false
                    },
                    cancelMorph(){
                        morph = false
                    },
                    source: activeInstance.id,
                    target: drop.lsDropTarget,
                    boundX,
                    boundY,
                    boundWidth: gl.current.clientWidth,
                    boundHeight: gl.current.clientHeight
                };
                
                
                let instance = LS.DragDrop.list[drop.lsDropTarget] || activeInstance;
                
                await instance.invoke("drop", gl.current, drop, event)

                if(morph && activeInstance.options.absoluteX){
                    gl.current.style.left = boundX + "px";
                }

                if(morph && activeInstance.options.absoluteY){
                    gl.current.style.top = boundY + "px";
                }
                
                if(push) {
                    if(activeInstance.options.swap){
                        drop.add(gl.current)
                        let swap = drop.getAll("*").find(e => e.lsDrag);
                        if(!swap) return;
                        gl.parent.add(swap)
                    } else {
                        drop.add(gl.current)
                    }
                }

                delete event.cancelPush;
                instance.invoke("dropDone", gl.current, drop, event)
            }else if(!activeInstance.options.clone){

                activeInstance.invoke("cancel", gl.current)
                gl.parent.add(gl.current)

            }else{

                // When is a clone and not to be dropped
                activeInstance.invoke("cancel")
                gl.current.remove()

            }

            gl.current.style.margin = prevMargin;

            gl.current.class("ls-held", 0)
            gl.previewBox.remove()
            gl.moving = false
            gl.engaged = false
            gl.dragArea.hide()
        }
    }

    M.on("mouseup", ()=>{
        gl.engaged = false
        end()
    })

    if(!gl.dragArea){
        LS.once("body-available", ()=>{
            gl.dragArea = N({class: "ls-drag-area"})
            LS._topLayer.add(gl.dragArea)
        })
    }

    gl.previewBox = N({class: "ls-drop-preview"})

    return _this=>class LS_Drag{
        constructor(id, options = {}){
            _this = this;
            this.id = id;

            this.options = {
                outsideParent: false,
                relativeMouse: false,
                animate: true,
                dropPreview: true,
                absoluteX: false,
                absoluteY: false,
                preserveHeight: true,
                overflow: false,
                container: null,
                scrollContainer: null,
                sameParent: false,
                strictDrop: true,
                dropFindY: false,
                movementOnly: false,
                lockX: false,
                lockY: false,
                scrollY: true,
                scrollX: true,
                clone: false,
                allowedTargets: [],
                getters: {},
                snapArea: 5,
                tolerance: 5,
                ...options
            };

            // Scrolling is initially disabled till the user hovers over the element
            getParent(true, this).on("mouseenter", ()=>{
                scrollAllowed = true
            })
        }

        enableDrag(element, handle){
            element.lsDrag = true
            element.lsDropTarget = _this.id

            O(handle || element).on("mousedown", async (evt)=>{
                if(evt.button !== 0) return;

                let enable = true;

                await _this.invoke("dragStart", element, evt, ()=>{
                    enable = false;
                })

                if(!element.lsDrag || !enable) return;
                prevX = M.x;
                initialX = M.x;
                velocityX = 0;
                initialY = M.y;
                prevY = initialY;
                velocityY = 0;

                let box = element.getBoundingClientRect();

                relative = {
                    box,
                    x: initialX - box.left,
                    y: initialY - box.top
                }

                gl.dragArea.style.top = box.top + "px";
                gl.dragArea.style.left = box.left + "px";

                prevMargin = getComputedStyle(element).margin

                gl.parent = O(element.parentElement)
                gl.engaged = true
                gl.current = element
                gl.firstFrame = true
                activeInstance = _this

                //Wait for when the drag should start or be aborted.
                waitForIt()
            })
        }

        disableDrag(element){
            element.lsDrag = false
        }

        enableDrop(element){
            O(element);

            element.lsDrop = true
            element.lsDropTarget = _this.id
            element.class("ls-drop")
            element.on("mouseenter", ()=>{
                if(!gl.moving || (activeInstance && activeInstance.options.movementOnly)) return;

                dropHover(element)
            })
        }
        
        disableDrop(element){
            element.lsDrop = false
            element.class("ls-drop", 0)
        }
    }
}