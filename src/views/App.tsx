import FlowChart from "@flowChart/views/FlowChart";
import Styles from "@flowChart/styles/navbar.module.scss"
import { useEffect } from "react";

export const App = () => {
    // @ts-ignore
    const sendOperateIpc = window.customApis?.sendOperateIpc ?? (() => {
    })

    const doRefresh = () => {
        window.location.reload()
    }

    useEffect(() => {
        const openDevTool = (e: KeyboardEvent) => {
            if(e.code === 'F12') sendOperateIpc('devTool')
        }
        window.addEventListener('keydown', openDevTool)

        return () => {
            window.removeEventListener('keydown', openDevTool)
        }
    }, [])

    return (
        <div style={ {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between'
        } }>
            <div className={ Styles.app }>
                <div className={ Styles.logo }>
                    <i>i</i>`<b>m</b> <u>l</u><b>o</b>g<b>o</b>
                </div>
                <div className={ Styles.btnGroup }>
                    <div className={ Styles.btn } onClick={ () => sendOperateIpc('min') }><i
                        className="pi pi-window-minimize"/></div>
                    <div className={ Styles.btn } onClick={ () => sendOperateIpc('max') }><i
                        className="pi pi-window-maximize"/></div>
                    <div className={ Styles.btn } onClick={ doRefresh }><i className="pi pi-sync"/></div>
                    <div className={ Styles.btn } onClick={ () => sendOperateIpc('close') }><i className="pi pi-times"/>
                    </div>
                </div>
            </div>
            <div style={ {
                position: 'relative',
                width: '100%',
                height: 'calc(100% - 40px)',
            } }>
                <FlowChart/>
            </div>
        </div>
    )
}