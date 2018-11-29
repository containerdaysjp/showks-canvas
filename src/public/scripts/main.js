'use strict';

const COLORPICKER_LENGTH = 200;
const COLORPICKER_BOTTOM_MARGIN = 20;

$(document).ready(function() {
  let socket = io('/command');
  let canvas = document.getElementById('whiteboard');
  let context = canvas.getContext('2d');
  let control = $('#control');
  let colorPicker = $('#colorPicker');

  let selectedColor = '#356eae';
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
    let authorGitHubId = $('#authorGitHubId');
    let gitHubIdValue = authorGitHubId.find(".value");
    gitHubIdValue.text(data.gitHubId);
    authorGitHubId.on("click", function() {
      window.open('https://github.com/' + gitHubIdValue.text());
    });
  // twitterId is optional
    if (data.twitterId !== undefined && data.twitterId !== "") {
      let authorTwitterId = $('#authorTwitterId'); 
      let twitterIdValue = authorTwitterId.find(".value");
      twitterIdValue.text(data.twitterId);
      authorTwitterId.on("click", function() {
        window.open('https://twitter.com/' + twitterIdValue.text());
      });
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
    width: COLORPICKER_LENGTH,
    height: COLORPICKER_LENGTH,
    color: selectedColor,
    markerRadius: 3
  });
  iroPicker.on('color:change', onColorChange);
  iroPicker.on('mount', onResize());

  // socket.io drawing event handler
  socket.on('drawing', onDrawingEvent);

  // resize event handler
  window.addEventListener('resize', onResize, false);
  window.addEventListener('scroll', onResize, false);

  function drawLine(data, emit) {
    draw.line(context, data.x0, data.y0, data.x1, data.y1, data.color);
    if (!emit) { return; }
    // Notify the server of drawing
    socket.emit('drawing', data);
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
    drawLine({
      x0: saved.x,
      y0: saved.y,
      x1: current.x,
      y1: current.y,
      color: selectedColor
    }, true);
    saved = current;
  }

  function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    let current = getCanvasPoint(e);
    drawLine({
      x0: saved.x,
      y0: saved.y,
      x1: current.x,
      y1: current.y,
      color: selectedColor
    }, true);
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
    drawLine({
      x0: saved.x,
      y0: saved.y,
      x1: current.x,
      y1: current.y,
      color: selectedColor
    }, true);
    saved = current;
  }

  function onTouchEnd(e) {
    if (!drawing) { return; }
    drawing = false;
    let current = getCanvasPoint(e.touches[0]);
    drawLine({
      x0: saved.x,
      y0: saved.y,
      x1: current.x,
      y1: current.y,
      color: selectedColor
    }, true);
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
    drawLine(data);
  }

  // make the canvas fill its parent
  function onResize() {
    let wb = $(window).scrollTop() + $(window).height();
    let top = control.height() <= wb ?
      control.height() - COLORPICKER_LENGTH :
      wb - COLORPICKER_LENGTH;
    top -= COLORPICKER_BOTTOM_MARGIN;
    colorPicker.css({ top: top });
  }

});
