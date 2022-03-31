import SHA256 from "crypto-js/sha256";
import {
    Adornment,
    Binding,
    Diagram,
    GraphLinksModel,
    GraphObject,
    HTMLInfo,
    Link,
    Model,
    Node,
    Palette,
    Panel,
    Part,
    Placeholder,
    Point,
    Shape,
    Size,
    Spot,
    TextBlock,
    Tool
} from "gojs";

// gojs extension: Inspector
import { Inspector } from "gojs/extensionsJSM/DataInspector";
// gojs extension: Inspector
import { FreehandDrawingTool } from "gojs/extensionsJSM/FreehandDrawingTool";
// gojs extension: figure (just load the file then use)
// import "gojs/extensionsJSM/Figures";

import { ContextMenuControl } from "@flowChart/components/ContextMenu";
import { useToastStore } from "@flowChart/scripts/ToastStore";

// region [figure]
/**
 * @description figures: build-in
 */
const Figure_BuildIn = [
    'Rectangle', 'Square', 'RoundedRectangle', 'Border', 'Ellipse',
    'Circle', 'TriangleRight', 'TriangleDown', 'TriangleLeft', 'TriangleUp',
    'Triangle', 'Diamond', 'LineH', 'LineV', 'None',
    'BarH', 'BarV', 'MinusLine', 'PlusLine', 'XLine'
] as const
type Figure_BuildInType = (typeof Figure_BuildIn)[number]

/**
 * @description figures: extension
 */
// const Figure_Extension = [
//     todo dynamic import figures
// ]
// endregion

// region [palette] palette
type PortTypes = '' | 'T' | 'R' | 'B' | 'L'

const FontFamilys = [
    "Times New Roman", "Consolas", "helvetica", "lab",
    "Microsoft YaHei"
] as const
type FontTypes = (typeof FontFamilys)[number]

/**
 * @description item in palette
 */
interface PaletteItem {
    isNode: true
    // text in item
    text: string
    // text color
    textColor: string
    // font family
    fontFamily: FontTypes
    // type of item
    figure: Figure_BuildInType
    // background-color of item (#rrggbb)
    fill: string
    // border-color of item (#rrggbb)
    stroke: string
    // border-width of item (number)
    strokeWidth: number
    // angle: string
    // [optional] item that need to be hide
    hidden?: Exclude<keyof PaletteItem, 'hidden' | 'isNode'>[]
}

/**
 * @description data on items (node)
 */
export type GojsNodeData = PaletteItem & { key: number, __gohashid: number }
/**
 * @description data on items (link)
 */
export type GojsLinkData = {
    isNode: undefined
    // text
    text: string
    // text color
    textColor: string
    // font family
    fontFamily: FontTypes
    // from key
    from: number
    // to key
    to: number
    // from port
    fromPort: PortTypes
    // to port
    toPort: PortTypes
    __gohashid: number
}
// endregion

// region interface with store/load
/**
 * @description the structure of JSON.parse(myDiagram.model.toJson())
 */
interface ModelObj {
    readonly class: 'GraphLinksModel'
    readonly name: 'diagram'
    readonly linkFromPortIdProperty: 'fromPort'
    readonly linkToPortIdProperty: 'toPort'
    nodeDataArray: {
        readonly isNode: true
        text: string
        textColor: string
        figure: Figure_BuildInType
        fill: string
        stroke: string
        strokeWidth: number
        key: number
        loc: string
    }[]
    linkDataArray: {
        text: string
        textColor: string
        stroke: string
        points: number[]  // number of items in even, like [x1, y1, x2, y2, ...]
        from: number
        to: number
        fromPort: PortTypes
        toPort: PortTypes
    }[]
}

/**
 * @description the object structure in store file
 */
interface StoreFileObj {
    // sha256 of modelJson
    sha: string
    // YY-M[M]-D[D] hh:mm:ss
    date: string
    // value of myDiagram.model.toJson()
    modelJson: string
}

// endregion

// alias for gojs.GraphObject.make
const $make = GraphObject.make

// region misc
/**
 * @description [port] create port for elements on the diagram
 * @param name port name
 * @param spot the Spot of the element this port is
 * @param output if the port can output
 * @param input if the port can input
 */
const makePort = (name: Exclude<PortTypes, ''>, spot: Spot, output: boolean, input: boolean) => {
    return $make(Shape, 'Circle', {
        // default is not seen
        fill: null, stroke: null,
        // port size
        desiredSize: new Size(7, 7),
        // port position
        alignment: spot,
        // just inside the Shape
        alignmentFocus: spot,
        // port name
        portId: name,
        // declare where links may connect at this port
        fromSpot: spot, toSpot: spot,
        // declare whether the user may draw links to/from here
        fromLinkable: output, toLinkable: input,
        // cursor
        cursor: 'pointer'
    })
}
/**
 * @description [port] show/hide small ports in node
 */
const showPort = (node: GraphObject, show: boolean) => {
    // @ts-ignore
    node.ports.each((port) => {
        if(port.portId !== '') {
            port.fill = show ? 'rgba(0, 0, 0, 0.3)' : null
        }
    })
}
// endregion

// region core
/**
 * @description create an empty model
 */
const emptyModel = () => {
    const _model = Model.fromJson(JSON.stringify({
        class: 'GraphLinkModel',
        linkFromPortIdProperty: 'fromPort',
        linkToPortIdProperty: 'toPort',
        nodeDataArray: [],
        linkDataArray: []
    }))
    _model.name = 'diagram'

    return _model
}
/**
 * @description create a diagram on specific element
 */
const baseDiagram = (el: HTMLDivElement) => {
    return $make(
        Diagram, el,
        {
            // 背景网格
            grid: $make(
                Panel, "Grid",
                $make(Shape, 'LineH', { stroke: 'lightgray', strokeWidth: 0.5 }),
                $make(Shape, 'LineH', { stroke: 'gray', strokeWidth: 0.5, interval: 10 }),
                $make(Shape, 'LineV', { stroke: 'lightgray', strokeWidth: 0.5 }),
                $make(Shape, 'LineV', { stroke: 'gray', strokeWidth: 0.5, interval: 10 }),
            ),
            // 拖拽功能
            // - 不允许拖拽线条
            "draggingTool.dragsLink": false,
            // - 格线吸附
            "draggingTool.isGridSnapEnabled": true,
            // 连线功能
            // - 不允许无连接的线
            "linkingTool.isUnconnectedLinkValid": false,
            "linkingTool.portGravity": 20,
            // 编辑连线连接目标
            // - 不允许无连接的线
            "relinkingTool.isUnconnectedLinkValid": false,
            "relinkingTool.portGravity": 20,
            "relinkingTool.fromHandleArchetype": $make(Shape, 'Diamond', {
                segmentIndex: 0,
                cursor: 'pointer',
                desiredSize: new Size(8, 8),
                fill: 'lightblue',
                stroke: 'lightblue'
            }),
            "relinkingTool.toHandleArchetype": $make(Shape, 'Diamond', {
                segmentIndex: -1,
                cursor: 'pointer',
                desiredSize: new Size(8, 8),
                fill: 'lightblue',
                stroke: 'lightblue'
            }),
            // 编辑连线转折
            "linkReshapingTool.handleArchetype": $make(Shape, 'Diamond', {
                desiredSize: new Size(7, 7),
                fill: 'lightblue',
                stroke: 'lightblue'
            }),
            "rotatingTool.handleAngle": 270,
            "rotatingTool.handleDistance": 30,
            "rotatingTool.snapAngleMultiple": 15,
            "rotatingTool.snapAngleEpsilon": 15,
            "undoManager.isEnabled": true
        }
    )
}
/**
 * @description [template: node-selection] selection adornment template for node
 */
const nodeSelectTemplate = () => {
    return $make(
        Adornment, 'Auto',
        $make(Shape, { fill: null, stroke: 'deepskyblue', strokeWidth: 1, strokeDashArray: [ 4, 2 ] }),
        $make(Placeholder)
    )
}
/**
 * @description [template: node-resize] resize adornment template for node
 */
const nodeResizeTemplate = () => {
    return $make(
        Adornment, 'Spot', { locationSpot: Spot.Center },
        $make(Placeholder),
        $make(Shape, {
            alignment: Spot.TopLeft,
            cursor: 'nw-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.Top,
            cursor: 'n-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.TopRight,
            cursor: 'ne-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.Right,
            cursor: 'e-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.BottomRight,
            cursor: 'sw-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.Bottom,
            cursor: 's-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.BottomLeft,
            cursor: 'se-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            alignment: Spot.Left,
            cursor: 'w-resize',
            desiredSize: new Size(6, 6),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
    )
}
/**
 * @description [template: node-rotate] rotate adornment template for node
 */
const nodeRotateTemplate = () => {
    return $make(
        Adornment, { locationSpot: Spot.Center, locationObjectName: 'CIRCLE' },
        $make(Shape, 'Circle', {
            name: 'CIRCLE',
            cursor: 'pointer',
            desiredSize: new Size(7, 7),
            fill: 'lightblue',
            stroke: 'deepskyblue'
        }),
        $make(Shape, {
            geometryString: 'M3.5 7 L3.5 30',
            isGeometryPositioned: true,
            stroke: 'deepskyblue',
            strokeWidth: 1,
            strokeDashArray: [ 4, 2 ]
        })
    )
}
/**
 * @description [template: node] template for node
 */
const nodeTemplate = (ctxMenu: HTMLInfo) => {
    return $make(
        Node, 'Spot',
        {
            contextMenu: ctxMenu,
            locationSpot: Spot.Center,
            selectable: true, selectionAdornmentTemplate: nodeSelectTemplate(),
            resizable: true, resizeObjectName: 'PANEL', resizeAdornmentTemplate: nodeResizeTemplate(),
            rotatable: true, rotateAdornmentTemplate: nodeRotateTemplate()
        },
        new Binding('location', 'loc', Point.parse).makeTwoWay(Point.stringify),
        new Binding('angle').makeTwoWay(),
        // the main object is a Panel that surrounds a TextBlock with a Shape
        $make(
            Panel, 'Auto', { name: 'PANEL' },
            new Binding('desiredSize', 'size', Size.parse).makeTwoWay(Size.stringify),
            // region 外侧边框
            $make(
                Shape, 'Rectangle', {
                    // the default port: if no spot on link data, use closest side
                    portId: '',
                    fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
                    toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
                    cursor: 'pointer',
                    // default color (can be changed by new Binding('fill'))
                    fill: 'white',
                    strokeWidth: 2,
                },
                // custom color
                new Binding('fill'),
                new Binding('stroke'),
                new Binding('figure'),
                new Binding('strokeWidth')
            ),
            // endregion
            // region 内部文字
            $make(
                TextBlock, {
                    font: 'bold 11pt "Times New Roman", Times, serif',
                    margin: 8,
                    maxSize: new Size(160, NaN),
                    wrap: TextBlock.WrapFit,
                    editable: true,
                },
                new Binding('text').makeTwoWay(),
                new Binding('stroke', 'textColor'),
                new Binding('font', 'fontFamily', (val) => {
                    return `bold 11pt ${ val }`
                })
            )
            // endregion
        ),
        // four small named ports, one on each side:
        makePort('T', Spot.Top, true, true),
        makePort('R', Spot.Right, true, true),
        makePort('B', Spot.Bottom, true, true),
        makePort('L', Spot.Left, true, true),
        // handle mouse enter/leave events to show/hide the ports
        {
            mouseEnter: (e, node) => {
                showPort(node, true)
            },
            mouseLeave: (e, node) => {
                showPort(node, false)
            }
        }
    )
}
/**
 * @description [template: link-selection] selection adornment template for link
 */
const linkSelectTemplate = () => {
    return $make(
        Adornment, 'Link',
        $make(Shape, {
            // isPanelMain declares that this Shape shares the Link.geometry
            isPanelMain: true,
            fill: 'transparent',
            stroke: 'deepskyblue',
            // use selection object's strokeWidth
            strokeWidth: 0
        })
    )
}
/**
 * @description [template: link] template for link
 */
const linkTemplate = (ctxMenu: HTMLInfo) => {
    return $make(
        Link,
        {
            contextMenu: ctxMenu,
            routing: Link.AvoidsNodes,
            curve: Link.JumpOver,
            corner: 5,
            toShortLength: 4,
            cursor: 'pointer',
            // select adornment
            selectable: true,
            selectionAdornmentTemplate: linkSelectTemplate(),
            // edit config
            relinkableFrom: true,
            relinkableTo: true,
            reshapable: true
        },
        new Binding('points').makeTwoWay(),
        // 连线的形状
        $make(
            Shape, { isPanelMain: true, strokeWidth: 2, stroke: '#999999' },
            new Binding('fill', 'stroke'),
            new Binding('stroke')
        ),
        // 箭头
        $make(
            Shape, { toArrow: 'Standard', stroke: '#999999', fill: '#999999' },
            new Binding('fill', 'stroke'),
            new Binding('stroke'),
        ),
        // 连线上的文字块
        $make(
            Panel, 'Auto',
            // region 外框
            $make(
                Shape, 'Rectangle',
                { fill: null, stroke: '#343434', strokeWidth: 0.5, minSize: new Size(40, NaN) },
                // 不选中时使此文本框不可见
                new Binding('visible', 'isSelected').ofObject()
            ),
            // endregion
            // region 内容
            $make(
                TextBlock,
                {
                    textAlign: 'center',
                    font: '10pt "Times New Roman", Times, serif',
                    // 连线文字颜色
                    stroke: '#999999',
                    margin: 5,
                    minSize: new Size(40, NaN),
                    editable: true
                },
                new Binding('text').makeTwoWay(),
                new Binding('stroke', 'textColor'),
                new Binding('font', 'fontFamily', (val) => {
                    return `bold 11pt ${ val }`
                })
            )
            // endregion
        )
    )
}
/**
 * @description [static: palette] palette items (config)
 */
const paletteItems: PaletteItem[] = [
    {
        isNode: true,
        text: 'Start',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'Circle',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
    },
    {
        isNode: true,
        text: 'Progress',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'Rectangle',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
    },
    {
        isNode: true,
        text: 'Branch',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'Diamond',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
    },
    {
        isNode: true,
        text: 'Comment',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'RoundedRectangle',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
    },
    {
        isNode: true,
        text: 'Text',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'Rectangle',
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        hidden: [ 'fill', 'figure', 'stroke', 'strokeWidth' ]
    },
    {
        isNode: true,
        text: 'Port',
        textColor: '#777777',
        fontFamily: 'Times New Roman',
        figure: 'Triangle',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2
    }
]
// endregion

// region utils
/**
 * @description props of contextMenu(HTMLInfo)
 */
interface contextMenuProp {
    show: (obj: GraphObject, diagram: Diagram, tool: Tool) => void
    hide: (diagram: Diagram, tool: Tool) => void
}

/**
 * @description create HTMLInfo as context menu
 */
const createContextMenu = (prop: contextMenuProp) => {
    return $make(HTMLInfo, {
        show: prop.show,
        hide: prop.hide
    })
}

/**
 * @description create diagram with template and event bind
 */
const createDiagram = (diagramEl: HTMLDivElement, ctxMenu: HTMLInfo) => {
    // create a basic diagram instance
    const _diagram = baseDiagram(diagramEl)

    // set node template (select、resize、rotate)
    _diagram.nodeTemplate = nodeTemplate(ctxMenu)
    // set link template (select、resize)
    _diagram.linkTemplate = linkTemplate(ctxMenu)
    // bind context menu
    _diagram.contextMenu = ctxMenu

    return _diagram
}

/**
 * @description create palette with template and event bind
 */
const createPalette = (paletteEl: HTMLDivElement, ctxMenu: HTMLInfo, diagram: Diagram) => {
    // create a palette instance
    return $make(
        Palette, paletteEl,
        {
            name: 'palette',
            contextMenu: ctxMenu,
            maxSelectionCount: 1,
            nodeTemplateMap: diagram.nodeTemplateMap,
            model: new GraphLinksModel(paletteItems, [], {
                // set a name to identify 'palette',
                // so that can avoid calling callback
                // when do context-click on its node
                name: 'palette'
            })
        }
    )
}

/**
 * @description create inspector for given diagram
 */
const createInspector = (inspectorEl: HTMLDivElement, diagram: Diagram) => {
    // get id (or set it manually if it`s not exist)
    let elId = inspectorEl.id
    if(!elId || elId.trim() === '') {
        inspectorEl.id = `inspector-${ Date.now() }`
        elId = inspectorEl.id
    }

    // @ts-ignore [Here. Of course they are the same].
    // param: diagram
    // require: import("~/node_modules/gojs/release/go.d.ts").Diagram
    // accept: import("~/node_modules/gojs/release/go-module.d.ts").Diagram
    //
    // However, when a private item with the same name in two class,
    // the are supposed to be the same type from an 'interface' or a 'type',
    // otherwise they are different even if they are all 'string' or anything else.
    return new Inspector(elId, diagram, {
        properties: {
            // hide some items
            isNode: { show: false },
            size: { show: false },
            loc: { show: false },
            points: { show: false },
            geo: { show: false },
            category: { show: false },
            hidden: { show: false },

            // set read-only
            key: { show: Inspector.showIfPresent, readOnly: true },

            // both nodes and links
            text: { show: Inspector.showIfPresent, type: 'string' },
            textColor: { show: Inspector.showIfPresent, type: 'color' },
            fontFamily: {
                show: Inspector.showIfPresent,
                type: 'select',
                choices: FontFamilys
            },
            fill: {
                show: (data: Part) => {
                    return data.data.fill && (!data.data.hidden || !data.data.hidden.includes('fill'))
                },
                type: 'color'
            },
            stroke: {
                show: (data: Part) => {
                    return data.data.stroke && (!data.data.hidden || !data.data.hidden.includes('strokeWidth'))
                },
                type: 'color'
            },
            strokeWidth: {
                show: (data: Part) => {
                    return data.data.strokeWidth && (!data.data.hidden || !data.data.hidden.includes('strokeWidth'))
                },
                type: 'number'
            },
            // nodes only
            figure: {
                show: (data: Part) => {
                    return data.data.figure && (!data.data.hidden || !data.data.hidden.includes('figure'))
                },
                type: 'select',
                choices: Figure_BuildIn
            },
            // links only
            fromPort: {
                show: Inspector.showIfPresent,
                type: 'select',
                choices: [
                    // '' means it will automatically find the shortest way to connect
                    '', 'T', 'R', 'B', 'L'
                ]
            },
            toPort: {
                show: Inspector.showIfPresent,
                type: 'select',
                choices: [
                    // '' means it will automatically find the shortest way to connect
                    '', 'T', 'R', 'B', 'L'
                ]
            }
        }
    })
}

/**
 * @description create free-hand-drawer
 */
const createFreeHandDrawer = (diagram: Diagram) => {
    const DrawingTemplate = $make(
        Part,
        {
            locationSpot: Spot.Center,
            isLayoutPositioned: false,
            selectionAdorned: true, selectionObjectName: 'SHAPE', selectionAdornmentTemplate: nodeSelectTemplate(),
            resizable: true, resizeObjectName: 'SHAPE',
            rotatable: true, rotateObjectName: 'SHAPE',
            reshapable: true,
            cursor: 'pointer'
        },
        new Binding('location', 'loc', Point.parse).makeTwoWay(Point.stringify),
        $make(
            Shape, { name: 'SHAPE', fill: null, strokeWidth: 2 },
            new Binding('desiredSize', 'size', Size.parse).makeTwoWay(Size.stringify),
            new Binding('angle').makeTwoWay(),
            new Binding('geometryString', 'geo').makeTwoWay(),
            new Binding('stroke'),
            new Binding('strokeWidth')
        )
    )

    diagram.nodeTemplateMap.add('FreehandDrawing', DrawingTemplate)

    const tool = new FreehandDrawingTool()
    tool.isBackgroundOnly = false
    tool.archetypePartData = {
        category: 'FreehandDrawing',  // 必须项
        stroke: '#777777',
        strokeWidth: 2,
        angle: 0
    }
    tool.isEnabled = false

    diagram.toolManager.mouseMoveTools.insertAt(0, tool as any as Tool)

    return tool
}

// endregion

class GojsOperate {
    private readonly diagram: Diagram
    private readonly palette: Palette
    private readonly drawTool: FreehandDrawingTool

    private get model() {
        return this.diagram.model
    }

    private set model(val: Model) {
        this.diagram.model = val
    }

    constructor(
        diagramEl: HTMLDivElement,
        paletteEl: HTMLDivElement,
        inspectorEl: HTMLDivElement,
        ctxControl: ContextMenuControl
    ) {
        // create context menu
        const ctxMenu = createContextMenu({
            show: (obj, diagram, tool) => {
                // avoid calling context callback when the event`s source is 'palette' rather then 'diagram'
                const diagramName = diagram.model.name as ('palette' | 'diagram')
                if(diagramName === 'palette') {
                    (diagram.contextMenu as HTMLInfo)?.hide?.(diagram, tool)
                    return
                }

                const mousePt = diagram.lastInput.viewPoint

                if(obj === null) ctxControl('blank', [ mousePt.x, mousePt.y ])

                else {
                    // @ts-ignore
                    const objData: GojsNodeData | GojsLinkData = obj.data

                    if(!objData.isNode) {
                        ctxControl('link', [ mousePt.x, mousePt.y ])
                    }
                    else {
                        ctxControl('node', [ mousePt.x, mousePt.y ])
                    }
                }
            },
            hide: () => {
                ctxControl('hide', [ -1000, -1000 ])
            }
        })

        // create diagram
        this.diagram = createDiagram(diagramEl, ctxMenu)

        // bind model
        this.model = emptyModel()

        // create palette
        this.palette = createPalette(paletteEl, ctxMenu, this.diagram)

        // create inspector
        createInspector(inspectorEl, this.diagram)

        // create free-hand-drawer
        this.drawTool = createFreeHandDrawer(this.diagram)

        // region event listener
        // 1. when a link is drawn, manually set its text to '' (default: undefined)
        this.diagram.addDiagramListener('LinkDrawn', (e) => {
            e.subject.data.text = ''
            e.subject.data.textColor = '#999999'
            e.subject.data.stroke = '#999999'
            e.subject.data.fontFamily = 'Times New Roman'
        })
        // 2. when the model has been changed, ...
        // endregion
    }

    // region commands
    /**
     * @description do cut
     */
    public doCut() {
        this.diagram.commandHandler.canCutSelection()
        && this.diagram.commandHandler.cutSelection()
    }

    /**
     * @description do copy
     */
    public doCopy() {
        this.diagram.commandHandler.canCopySelection()
        && this.diagram.commandHandler.copySelection()
    }

    /**
     * @description do paste
     */
    public doPaste() {
        if(!this.diagram.commandHandler.canPasteSelection()) {
            useToastStore().warn('Paste cannot be performed because there is no source')
        }
        else {
            this.diagram.commandHandler.pasteSelection(this.diagram.lastInput.documentPoint)
        }
    }

    /**
     * @description do delete
     */
    public doDelete() {
        this.diagram.commandHandler.deleteSelection()
    }

    /**
     * @description enable drawer
     */
    public doDrawMode() {
        this.drawTool.isEnabled
            ? useToastStore().warn('already in draw mode')
            : useToastStore().success('switch mode: DRAW')
        this.drawTool.isEnabled = true
    }

    /**
     * @description disable drawer
     */
    public doSelectMode() {
        this.drawTool.isEnabled
            ? useToastStore().success('switch mode: SELECT')
            : useToastStore().warn('already in select mode')
        this.drawTool.isEnabled = false
    }

    /**
     * @description zoom to fit
     */
    public doZoomToFit() {
        this.diagram.commandHandler.canZoomToFit()
        && this.diagram.commandHandler.zoomToFit()
    }

    /**
     * @description clear diagram
     */
    public doClear() {
        this.diagram.clear()
    }

    /**
     * @description download the canvas as png
     */
    public doDownload() {
        this.diagram.makeImageData({
            callback: (dataUrl) => {
                const aTag = document.createElement('a')
                aTag.download = `canvas_${ Date.now() }.png`
                aTag.href = dataUrl
                aTag.click()
            }
        })
    }

    /**
     * @description load data from file to reload the model data
     */
    public doLoad() {
        // create a selector
        const fileSelector = document.createElement('input')
        fileSelector.type = 'file'

        // set callback for file select event
        fileSelector.onchange = () => {
            const file = fileSelector.files?.[0]
            // do nothing if file is undefined
            if(!!file) {
                // verify the suffix of file
                if(file.name.split('.').reverse()[0] !== 'fc') {
                    useToastStore().warn('Incorrect file')
                    fileSelector.onchange = null
                }
                // read file
                else {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const fileObj: StoreFileObj = JSON.parse(reader.result as string)
                        const doSha = SHA256(fileObj.modelJson) + ''

                        // verify file sha
                        if(doSha !== fileObj.sha) {
                            useToastStore().warn('This file has been tampered with')
                        }
                        // now the file is correct
                        else {
                            this.model = Model.fromJson(fileObj.modelJson)
                            useToastStore().success(`Diagram reloaded (last modified: ${ fileObj.date })`)
                        }

                        fileSelector.onchange = null
                    }
                    reader.onerror = () => {
                        useToastStore().error('Some error occurred when reading this file')
                        fileSelector.onchange = null
                    }
                    reader.readAsText(file)
                }
            }
        }

        // show selector
        fileSelector.click()
    }

    /**
     * @description store the data of model into a file
     */
    public doStore() {
        useToastStore().info('Generating')
        try {
            // generate the file object
            const modelJsonStr = this.model.toJson()
            const dateStr = (new Date().toLocaleDateString().replace(/[/]/g, '-')) + ' ' + (new Date().toLocaleTimeString())
            const fileObj: StoreFileObj = {
                sha: SHA256(modelJsonStr) + '',
                date: dateStr,
                modelJson: modelJsonStr
            }

            // get the base64 string of the json string of file object
            const file64 = window.btoa(JSON.stringify(fileObj))

            // create anchor element and automatically click it to download file
            const aTag = document.createElement('a')
            aTag.href = `data:text/plain;base64,${ file64 }`
            aTag.download = `diagram_${ dateStr.replace(/[-/ ]/g, '.').replace(/[:]/g, '') }.fc`
            aTag.click()
            useToastStore().success('Done')
        } catch (e: any) {
            useToastStore().error('Error: ', e.toString())
        }
    }

    // endregion

    /**
     * @description destroy diagram instance and unbind with dom
     */
    public dispose() {
        this.diagram.div = null
        this.palette.div = null
    }
}

export {
    GojsOperate
}