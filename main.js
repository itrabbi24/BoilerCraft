const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { startServer } = require('./server');

let mainWindow;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready — BoilerCraft Studio',
      message: `A brand new version (${info.version}) of BoilerCraft Studio has been downloaded automatically.`,
      buttons: ['Restart Now to Update', 'Later']
    }).then((buttonIndex) => {
      if (buttonIndex.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: 'BoilerCraft Studio',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC handler to open native Windows Folder Picker dialog
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Destination Folder for Your Project'
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

app.whenReady().then(() => {
  startServer((port) => {
    createWindow(port);
    if (app.isPackaged) {
      setupAutoUpdater();
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(4800);
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
