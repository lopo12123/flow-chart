const { app, BrowserWindow } = require("electron")
// import { app, BrowserWindow } from "electron";

let winRef// : BrowserWindow

const createWindow = () => {
    winRef = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            devTools: true
        }
    })

    winRef.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

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