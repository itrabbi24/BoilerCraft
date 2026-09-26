const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { startServer } = require('./server');

let mainWindow;

// Configure autoUpdater logging and GitHub Release feed
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates on GitHub Releases...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[AutoUpdater] New version ${info.version} available! Downloading...`);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] App is up to date.');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[AutoUpdater] Error checking update:', err.message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[AutoUpdater] Version ${info.version} downloaded.`);
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
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
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

app.whenReady().then(() => {
  startServer((port) => {
    createWindow(port);
    
    // Check for updates automatically in production packaged app
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
