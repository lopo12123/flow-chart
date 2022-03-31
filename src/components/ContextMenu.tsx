import { useEffect, useState } from "react";
import { GojsOperate } from "@flowChart/scripts/flowChart.script";

// 菜单出现的位置类型
type CtxMenuType = 'blank' | 'node' | 'link' | 'hide'
// 菜单项类型
type CtxMenuItemType = 'separate' |  // separate of menu
    'cut' | 'copy' | 'paste' | 'delete' |  // node/link operate
    'draw' | 'select' |  // mode: draw / select
    'zoom' | 'clear' | 'download' |  // diagram operate
    'load' | 'store'  // store/load operate

export interface CtxMenuItem {
    type: CtxMenuItemType
    label?: string
    icon?: string
    separator?: boolean
}

// 控制菜单类型及位置
export type ContextMenuControl = (
    type: CtxMenuType,
    position: [ number, number ]
) => void

// 接受的onload参数
export type ContextMenuOnLoad = (controlFn: ContextMenuControl) => void

const AllMenuItem: { [k in CtxMenuItemType]: CtxMenuItem } = {
    separate: { type: 'separate', separator: true },
    cut: { type: 'cut', label: 'cut', icon: 'pi pi-box' },
    copy: { type: 'copy', label: 'copy', icon: 'pi pi-copy' },
    paste: { type: 'paste', label: 'paste node', icon: 'pi pi-file' },
    delete: { type: 'delete', label: 'delete', icon: 'pi pi-trash' },
    draw: { type: 'draw', label: 'start free draw', icon: 'pi pi-palette' },
    select: { type: 'select', label: 'stop free draw', icon: 'pi pi-pencil' },
    zoom: { type: 'zoom', label: 'zoom to fit', icon: 'pi pi-window-minimize' },
    clear: { type: 'clear', label: 'clear canvas', icon: 'pi pi-desktop' },
    download: { type: 'download', label: 'download diagram (as png)', icon: 'pi pi-download' },
    load: { type: 'load', label: 'load diagram (from file)', icon: 'pi pi-image' },
    store: { type: 'store', label: 'store diagram (to file)', icon: 'pi pi-save' },
}

// 全部参数
export interface ContextMenuProps {
    onLoad: ContextMenuOnLoad
    instance: GojsOperate | null
}

export const ContextMenu = (props: ContextMenuProps) => {
    const MenuItemMap: { [k in Exclude<CtxMenuType, 'hide'>]: CtxMenuItem[] } = {
        node: [
            AllMenuItem.cut,
            AllMenuItem.copy,
            AllMenuItem.paste,
            AllMenuItem.delete
        ],
        link: [
            AllMenuItem.delete
        ],
        blank: [
            AllMenuItem.paste,
            AllMenuItem.separate,
            AllMenuItem.draw,
            AllMenuItem.select,
            AllMenuItem.separate,
            AllMenuItem.zoom,
            AllMenuItem.clear,
            AllMenuItem.download,
            AllMenuItem.separate,
            AllMenuItem.load,
            AllMenuItem.store
        ]
    }

    const [ menuItems, setMenuItems ] = useState<CtxMenuItem[]>([])
    const [ visible, setVisible ] = useState(false)
    const [ position, setPosition ] = useState<[ number, number ]>([ -1000, -1000 ])

    /**
     * @description callback for contextClick on diagram
     * @param type event type
     * @param position event position
     */
    const controlFunction: ContextMenuControl = (type, position) => {
        if(type === 'hide') {
            setVisible(false)
            setPosition(position)
        }
        else {
            setMenuItems(MenuItemMap[type])
            setVisible(true)
            setPosition(position)
        }
    }

    /**
     * @description callback for menuitem`s click
     */
    const doMenuCmd = (type: CtxMenuItemType) => {
        switch(type) {
            case 'separate':
                break
            case 'cut':
                props.instance?.doCut()
                break
            case 'copy':
                props.instance?.doCopy()
                break
            case 'paste':
                props.instance?.doPaste()
                break
            case 'delete':
                props.instance?.doDelete()
                break
            case 'draw':
                props.instance?.doDrawMode()
                break
            case 'select':
                props.instance?.doSelectMode()
                break
            case 'zoom':
                props.instance?.doZoomToFit()
                break
            case 'clear':
                props.instance?.doClear()
                break
            case 'download':
                props.instance?.doDownload()
                break
            case 'load':
                props.instance?.doLoad()
                break
            case 'store':
                props.instance?.doStore()
                break
            // just for type check here
            // default:
            //     const a: never = type
            //     break
        }
        controlFunction('hide', [ -1000, -1000 ])
    }

    useEffect(() => {
        props.onLoad(controlFunction)
    }, [])

    return (
        <div
            style={ {
                position: 'absolute',
                zIndex: '1000',
                left: position[0] + 5,
                top: position[1] + 5,
                width: '200px',
                padding: '10px',
                border: 'solid 2px #aaaaaa',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                display: visible ? 'block' : 'none'
            } }
            onContextMenu={ (e) => {
                e.preventDefault()
            } }>
            {
                menuItems.map((item, index) => {
                    if(item.separator) {
                        return (
                            <div key={ index }
                                 style={ {
                                     position: 'relative',
                                     width: 'calc(100% - 10px)',
                                     height: '1px',
                                     margin: '5px',
                                     backgroundColor: '#777777'
                                 } }/>
                        )
                    }
                    else {
                        return (
                            <div key={ index }
                                 className="custom-hover-highlight"
                                 style={ {
                                     position: 'relative',
                                     width: '100%',
                                     height: '30px',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'flex-start'
                                 } }
                                 onClick={ () => {
                                     doMenuCmd(item.type)
                                 } }>
                                <i className={ item.icon } style={ { margin: '0 5px' } }/>
                                <span style={ {
                                    fontSize: '12px'
                                } }>{ item.label }</span>
                            </div>
                        )
                    }
                })
            }
        </div>
    )
}