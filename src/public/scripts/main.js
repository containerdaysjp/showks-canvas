'use strict';

$(document).ready(function() {
  let socket = io('/command');
  let canvas = document.getElementById('whiteboard');
  let context = canvas.getContext('2d');

  let selectedColor = 'black';
  let drawing = false;
  let saved = {};

  // Load initial image
  let image = new Image();
  image.onload = function() {
    context.drawImage(image, 0, 0);
  }; 
  image.src = '/canvas';

  // Load author information
  $.ajax('/author').done(function(data) {
    $('#authorUserName').find(".value").text(data.userName);
    $('#authorGitHubId').find(".value").text(data.gitHubId);
    // twitterId is optional
    if (data.twitterId !== undefined && data.twitterId !== "") {
      $('#authorTwitterId').find(".value").text(data.twitterId);
      $('#authorTwitterId').show();
    } else {
      $('#authorTwitterId').hide();
    }
    $('#authorComment').find(".value").text(data.comment);
  });

  // Start listening mouse events
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);

  // Start listening touch events
  canvas.addEventListener("touchstart", onTouchStart, false);
  canvas.addEventListener("touchmove", throttle(onTouchMove, 10), false);
  canvas.addEventListener("touchend", onTouchEnd, false);
  canvas.addEventListener("touchcancel", onTouchEnd, false);
  
  // Setup color picker
  let iroPicker = new window.iro.ColorPicker("#colorPicker", {
    width: 200,
    height: 200,
    color: {r: 255, g: 0, b: 0},
    markerRadius: 3
  });
  iroPicker.on('color:change', onColorChange);

  // socket.io drawing event handler
  socket.on('drawing', onDrawingEvent);

  // resize event handler
  window.addEventListener('resize', onResize, false);
  window.addEventListener('scroll', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 5;
    context.stroke();
    context.closePath();

    if (!emit) { return; }

    socket.emit('drawing', {
      x0: x0,
      y0: y0,
      x1: x1,
      y1: y1,
      color: color
    });
  }

  function getCanvasPoint(e) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function onMouseDown(e) {
    drawing = true;
    saved = getCanvasPoint(e);
  }

  function onMouseMove(e) {
    if (!drawing) { return; }
    let current = getCanvasPoint(e);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
    saved = current;
  }

  function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    let current = getCanvasPoint(e);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
  }

  function onTouchStart(e) {
    if (1 < e.touches.length) {
      drawing = false;
      return;
    }
    drawing = true;
    saved = getCanvasPoint(e.touches[0]);
  }

  function onTouchMove(e) {
    if (!drawing) { return; }
    e.preventDefault();
    let current = getCanvasPoint(e.touches[0]);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
    saved = current;
  }

  function onTouchEnd(e) {
    if (!drawing) { return; }
    drawing = false;
    let current = getCanvasPoint(e.touches[0]);
    drawLine(saved.x, saved.y, current.x, current.y, selectedColor, true);
  }

  function onColorUpdate(e) {
    selectedColor = e.target.className.split(' ')[1];
  }

  function onColorChange(color, changes) {
    selectedColor = color.hexString;
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return function() {
      let time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  // Replicate remote drawing to this canvas
  function onDrawingEvent(data) {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
    let wb = window.scrollY + window.innerHeight;
    let control = $('#control');
    let colorPicker = $('#colorPicker');
    if (control.height() <= wb) {
      colorPicker.css({top: control.height() - colorPicker.height()});
    } else {
      colorPicker.css({top: wb - colorPicker.height()});
    }
  }

});
