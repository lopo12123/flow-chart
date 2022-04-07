const { join } = require('path')
const { app, BrowserWindow, ipcMain } = require("electron")
// import { app, BrowserWindow, ipcMain } from "electron";

let winRef  // : undefined | BrowserWindow

const createWindow = () => {
    winRef = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        webPreferences: {
            preload: join(__dirname, './preload.js'),
            webSecurity: true,
            devTools: true
        }
    })

    if(process.env.NODE_ENV?.trim() === 'dev') {
        winRef.loadURL('http://localhost:8899')
        winRef.webContents.openDevTools()
    }
    else {
        winRef.loadURL(`file://${join(__dirname, './dist/index.html')}`)
        // winRef.loadFile('index.html')
    }
}

app.whenReady().then(() => {
    createWindow()

    ipcMain.on('operate', (e, args) => {
        if(!winRef) return

        switch(args) {
            case 'min':
                winRef.minimize()
                break
            case 'max':
                winRef.isMaximized()
                    ? winRef.unmaximize()
                    : winRef.maximize()
                break
            case 'close':
                // `win.close()` is disabled while `frame=false`
                winRef = null
                app.exit()
                break
        }
    })

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if(BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    winRef = null
    if(process.platform !== 'darwin') app.quit()
})