const { ipcRenderer } = require('electron');

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

window.onload = function ()
{
    adjustSize();
};

ipcRenderer.on('connected', (event, data) =>
{
    updateCanvas(data);
});

ipcRenderer.on('drawing-data', (event, data) =>
{
    updateCanvas(data);
});

ipcRenderer.on('adjust-size', (event, data) =>
{
    adjustSize();
});

function adjustSize()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function updateCanvas(data)
{
    const img = new Image();

    img.onload = function ()
    {
        context.drawImage(img, 0, 0);
    };

    img.src = data;
}

