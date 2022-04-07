const { ipcRenderer, contextBridge } = require("electron");

/**
 * @description
 * @param args {'min' | 'max' | 'close'}
 */
const sendOperateIpc = (args) => {
    ipcRenderer.send('operate', args)
}

// force from v12.x
contextBridge.exposeInMainWorld('customApis', {
    sendOperateIpc
})