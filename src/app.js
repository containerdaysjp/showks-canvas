const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;
const THUMBNAIL_WIDTH = 256;
const THUMBNAIL_HEIGHT = 256;
const REFRESH_THRESHOLD = 5000;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const commandNamespace = io.of('/command');
const notificationNamespace = io.of('/notification');
const port = process.env.PORT || 8080;
const allowHost =
  process.env.ALLOW_HOST !== undefined &&
  process.env.ALLOW_HOST !== "" ?
  process.env.ALLOW_HOST : "http://localhost:3000";

// Create a canvas for server-side drawing
const { createCanvas, loadImage } = require('canvas')
const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const ctx = canvas.getContext('2d');
const thCanvas = createCanvas(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
const thCtx = thCanvas.getContext('2d');

var lastUpdated = 0;

// Fill the background
ctx.fillStyle="white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Setup the express web app

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", allowHost);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

// GET /
app.use(express.static(__dirname + '/public'));

// GET /canvas
app.get('/canvas', function (req, res) {
  res.type("png");
  let stream = canvas.createPNGStream();
  stream.pipe(res);
})

// GET /thumbnail
app.get('/thumbnail', function (req, res) {
  thCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, thCanvas.width, thCanvas.height);
  res.type("png");
  let stream = thCanvas.createPNGStream();
  stream.pipe(res);
})

// GET /author
app.get('/author', function (req, res) {
  res.type("json");
  res.send(JSON.stringify({
    name: "Koji Hatanaka",
    twitter: "@kojiha__",
    note: "This endpoint is to be implemented"
  }));
})

// socket.io connection handler
function onCommandConnection(socket) {
  console.log('Connected to command namespace.');

  // Receive and broadcast drawing event
  socket.on('drawing', (data) => {
    commandNamespace.emit('drawing', data);
    drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color);
    let updated = Date.now();
    let diff = updated - lastUpdated;
    if (REFRESH_THRESHOLD < diff || diff < 0) {
      notificationNamespace.emit('refresh', 1);
      lastUpdated = updated;
    }
  });
}

function onNotificationConnection(socket) {
  console.log('Connected to notification namespace.');
}

// Start listening socket.io
commandNamespace.on('connection', onCommandConnection);
notificationNamespace.on('connection', onNotificationConnection);

// Start listening on the port for HTTP request
http.listen(port, () => console.log('listening on port ' + port));

// Draw a line with color
function drawLine(context, x0, y0, x1, y1, color) {
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.stroke();
  context.closePath();
}
