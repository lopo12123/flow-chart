/// dev: react@17.0.2; uuid@8.3.2
import { useLayoutEffect, useRef } from "react";
import { v4 as UUID } from "uuid";

const drag_MousedownCB = (mousedownEv: MouseEvent) => {
    // store the element bind event
    const eventSourceEl = mousedownEv.currentTarget as HTMLElement
    const targetDragId = eventSourceEl.dataset.dragTarget
    // find the element with target id
    // @ts-ignore                chrome & opera  ||  ff & safari
    const path: HTMLElement[] = mousedownEv.path || (mousedownEv.composedPath && mousedownEv.composedPath())
    const dragTargetEl = path.find((el) => {
        return !!el.dataset.dragId && (el.dataset.dragId === targetDragId)
    })

    if(!eventSourceEl || !targetDragId || !dragTargetEl) return

    // when mousedown, compute:
    // 1. the distance between mousedown-point and left-border of el
    // 2. the distance between mousedown-point and top-border of el
    const disX = mousedownEv.clientX - dragTargetEl.offsetLeft
    const disY = mousedownEv.clientY - dragTargetEl.offsetTop
    const drag_MousemoveCB = (mousemoveEv: MouseEvent) => {
        const newX = mousemoveEv.clientX - disX
        const newY = mousemoveEv.clientY - disY
        if(newX > 0 && newX < (window.innerWidth - eventSourceEl.offsetWidth - 10)) {
            dragTargetEl.style.left = newX + 'px'
        }
        if(newY > 0 && newY < (window.innerHeight - eventSourceEl.offsetHeight - 10)) {
            dragTargetEl.style.top = newY + 'px'
        }
    }
    const drag_MouseupCB = () => {
        document.removeEventListener('mousemove', drag_MousemoveCB)
        document.removeEventListener('mouseup', drag_MouseupCB)
    }
    document.addEventListener('mousemove', drag_MousemoveCB)
    document.addEventListener('mouseup', drag_MouseupCB)
}

export interface EnableDragProp {
    innerEl: JSX.Element
    initPos?: {
        top?: string
        right?: string
        bottom?: string
        left?: string
    }
}

/**
 * @description enable free drag for a JSXElement
 * <br/>add the a name of 'drag-controller' to the inner wrapped element
 * <br/>to identify the parts through which I can drag the entire block.
 * @example
 * <EnableDrag key="unique-key" innerEl={
 *     <div>
 *         <div className="drag-controller">
 *             drag here - works
 *         </div>
 *         drag here - does not work
 *         <div className="drag-controller">
 *             drag here - does not work too
 *             only the first drag-controller classed element will work
 *         </div>
 *     </div>
 * }/>
 */
export const EnableDrag = ({ innerEl, initPos }: EnableDragProp): JSX.Element => {
    const dragBoxRef = useRef<HTMLDivElement>(null)
    const dragId = UUID()

    useLayoutEffect(() => {
        const controller = dragBoxRef.current?.getElementsByClassName('drag-controller')[0] as HTMLElement
        if(!controller) throw new Error('No controller for this draggable element.')
        controller.dataset.dragTarget = dragId
        controller.style.cursor = 'grab'
        controller.style.userSelect = 'none'
        controller.addEventListener('mousedown', drag_MousedownCB)
        return () => {
            controller.removeEventListener('mousedown', drag_MousedownCB)
        }
    }, [ dragId ])

    return (
        <div ref={ dragBoxRef } data-drag-id={ dragId }
             style={ {
                 position: 'absolute',
                 zIndex: '10000',
                 width: 'fit-content',
                 height: 'fit-content',
                 ...initPos
             } }>
            { innerEl }
        </div>
    )
}