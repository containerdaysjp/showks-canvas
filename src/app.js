const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1024;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8080;

// Create a canvas for server-side drawing
const Canvas = require('canvas');
const canvas = new Canvas(1024, 1024);
const ctx = canvas.getContext('2d');

// Fill the background
ctx.fillStyle="white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Setup the express web app
// GET /
app.use(express.static(__dirname + '/public'));
// GET /canvas
app.get('/canvas', function (req, res) {
  res.type("png");
  let stream = canvas.createPNGStream();
  stream.pipe(res);
})

// socket.io connection handler
function onConnection(socket){
  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
    drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color);
    console.log(data);
  });
}

// Start listening with socket.io
io.on('connection', onConnection);

// Start listening on the port for HTTP request
http.listen(port, () => console.log('listening on port ' + port));

// Draw a line with color
function drawLine(context, x0, y0, x1, y1, color) {
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();
}
