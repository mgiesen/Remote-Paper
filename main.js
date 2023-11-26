const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

let mainWindow;
let mirrorWindow;
let server;
let wss;

function startServer()
{
    const expressApp = express();
    server = http.createServer(expressApp);
    wss = new WebSocket.Server({ server, path: '/ws' });

    // Client Frontend zur Verfügung stellen
    expressApp.use(express.static(path.join(__dirname, 'client')));

    // WebSocket-Verbindung verarbeiten.
    wss.on('connection', (ws) =>
    {
        console.log('WebSocket-Verbindung geöffnet');
        mirrorWindow.show();

        ws.on('message', (msg) =>
        {
            msg = JSON.parse(msg);

            if (msg.event == 'drawing')
            {
                mirrorWindow.webContents.send('drawing-data', msg.payload);
            }
            else if (msg.event == 'resize')
            {
                mirrorWindow.setSize(msg.payload[0], msg.payload[1]);
                mirrorWindow.webContents.send('adjust-size');
            }
            else if (msg.event == 'clear')
            {
                mirrorWindow.webContents.send('clear-drawing');
            }
            else
            {
                console.log(msg);
            }
        });

        ws.on('close', () =>
        {
            console.log('WebSocket-Verbindung geschlossen');
            mirrorWindow.hide();
        });

    });

    server.on('error', (error) =>
    {
        mirrorWindow.webContents.send('server-error');
    });

    server.listen(8080, () =>
    {
        mirrorWindow.webContents.send('server-success');
    });
}

function createMainWindow()
{
    mainWindow = new BrowserWindow({
        width: 425,
        height: 425,
        resizable: false,
        maximizable: false,
        show: false,
        icon: 'images/app_icon.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile('main.html');

    if (false)
    {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.once('dom-ready', () =>
    {
        mainWindow.show();
    });

    mainWindow.on('closed', () =>
    {
        mainWindow = null;
        app.quit();
    });
}

function createMirrorWindow()
{
    mirrorWindow = new BrowserWindow({
        width: 500,
        height: 500,
        resizable: false,
        maximizable: false,
        show: false,
        icon: 'images/draw_icon.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    mirrorWindow.setMenu(null);
    mirrorWindow.loadFile('mirror/mirror.html');

    if (false)
    {
        mirrorWindow.webContents.openDevTools();
    }

    mirrorWindow.on('closed', () =>
    {
        mirrorWindow = null;
    });
}

app.on('ready', async () =>
{
    createMainWindow();
    await createMirrorWindow();
    startServer();
});

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin')
    {
        app.quit();
    }
});

app.on('activate', () =>
{
    if (mainWindow === null)
    {
        createWindow();
    }
});

process.on('SIGINT', () =>
{
    if (server)
    {
        server.close(() =>
        {
            console.log('Server wurde geschlossen.');
            process.exit(0);
        });
    }
    else
    {
        process.exit(0);
    }
});
