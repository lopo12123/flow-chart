import { useLayoutEffect, useRef, useState } from "react";
import { ContextMenu, ContextMenuOnLoad } from "@flowChart/components/ContextMenu";
import { GojsOperate } from "@flowChart/scripts/flowChart.script";
import { EnableDrag } from "@flowChart/components/EnableDrag";
import Styles from "@flowChart/styles/flowchart.module.scss";
import { Toast } from "primereact/toast";
import { useToastStore } from "@flowChart/scripts/ToastStore";

export default () => {
    const toastRef = useRef<Toast>(null)
    const diagramContainer = useRef<HTMLDivElement>(null)
    const paletteContainer = useRef<HTMLDivElement>(null)
    const inspectorContainer = useRef<HTMLDivElement>(null)

    const [ diagramObj, setDiagramObj ] = useState<GojsOperate | null>(null)
    const [ inspectorVisible, setInspectorVisible ] = useState(true)

    // 子组件onLoad后调用
    const doAfterOnLoad: ContextMenuOnLoad = (controlFn) => {
        if(
            !!diagramContainer.current &&
            !!paletteContainer.current &&
            !!inspectorContainer.current
        ) {
            const instance = new GojsOperate(diagramContainer.current, paletteContainer.current, inspectorContainer.current, controlFn)
            setDiagramObj(instance)
        }
    }

    // 清除子组件导致的副作用 - 解绑原有的diagram实例
    useLayoutEffect(() => {
        useToastStore().bind(toastRef.current)

        return () => {
            useToastStore().bind(null)
            diagramObj?.dispose()
            setDiagramObj(null)
        }
    }, [])

    return (
        <div style={ {
            position: 'relative',
            width: '100%',
            height: '100%'
        } }>

            <Toast ref={ toastRef }/>

            <div ref={ diagramContainer }
                 className="custom-canvas-container"
                 style={ {
                     position: 'relative',
                     width: '100%',
                     height: '100%'
                 } }>
            </div>

            <div ref={ paletteContainer }
                 className="custom-canvas-container"
                 style={ {
                     position: 'absolute',
                     zIndex: '100',
                     width: '199px',
                     height: '100%',
                     top: '0',
                     left: '0',
                     borderRight: 'solid 2px #777777',
                     backgroundColor: '#fefefe'
                 } }>
            </div>

            <EnableDrag key="inspector-container"
                        initPos={ { left: '210px', top: '10px' } }
                        innerEl={
                            <div onContextMenu={ (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            } }
                                 style={ {
                                     position: 'relative',
                                     width: '300px',
                                     height: 'fit-content',
                                     border: 'solid 2px #aaaaaa',
                                     borderRadius: '10px',
                                     backgroundColor: '#ffffff',
                                     fontFamily: 'Fira Sans,Arial,sans-serif'
                                 } }>
                                <div className="drag-controller"
                                     style={ {
                                         position: 'relative',
                                         width: 'calc(100% - 20px)',
                                         height: '10px',
                                         margin: '10px',
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'space-between'
                                     } }>
                                    <i className={ inspectorVisible ? 'pi pi-eye' : 'pi pi-eye-slash' }
                                       title={ `${ inspectorVisible ? 'hide' : 'show' } inspector` }
                                       style={ {
                                           position: 'relative',
                                           width: '10px',
                                           textAlign: 'center',
                                           color: '#aaaaaa',
                                           fontWeight: 'bold',
                                           cursor: 'pointer'
                                       } }
                                       onClick={ () => {
                                           setInspectorVisible(!inspectorVisible)
                                       } }/>
                                    <div style={ {
                                        position: 'relative',
                                        width: 'calc(100% - 30px)',
                                        height: '10px',
                                        margin: '5px',
                                        borderRadius: '5px',
                                        backgroundColor: '#aaaaaa'
                                    } }>
                                    </div>
                                </div>

                                <div className={ Styles.inspectorPanel }
                                     style={ {
                                         display: inspectorVisible ? 'block' : 'none'
                                     } }>
                                    <div ref={ inspectorContainer }/>
                                </div>
                            </div>
                        }/>

            <ContextMenu onLoad={ doAfterOnLoad } instance={ diagramObj }/>

        </div>
    )
}