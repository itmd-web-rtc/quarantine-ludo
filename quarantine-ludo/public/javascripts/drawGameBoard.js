let circularPawns = {"green": [], "red": [], "yellow": [], "blue": []}

function createHomeSquaresAndPawns(ctx, x, y, color) {
  ctx.beginPath();
  ctx.strokeStyle = "grey";
  ctx.fillStyle = "white";
  ctx.lineWidth = 5;
  ctx.fillRect(x, y, 50, 50);

  ctx.strokeStyle = "black";
  ctx.fillStyle = color;
  // x, y, radius, startAngle, endAngle, antiClockwise = false by default
  ctx.arc(x + 25, y + 25, 15, 0, 2 * Math.PI, false); // full circle
  ctx.fill();
  ctx.stroke();
  circularPawns[color].push({
      "x": x + 25, 
      "y": y + 25,
      "radius": 15  
  })
}
// function to clean clode later
// function drawGrid(ctx, width, height, noOfRows, noOfCols){
//   ctx.strokeStyle = "black";
//   ctx.lineWidth = 4;
//   for (let i = 0; i <= width; i += width / noOfRows) {
//     ctx.beginPath();
//     ctx.moveTo(i, 0);
//     ctx.lineTo(i, width);
//     ctx.stroke();
//   }

//   for (let i = 0; i <= height; i += height / noOfCols) {
//     ctx.moveTo(0, i);
//     ctx.lineTo(width, i);
//     ctx.stroke();
//   }
// }

//left-layer
let homeBlockGreen = document.querySelector("#home-block-green");
let ctxHomeBlockGreen = homeBlockGreen.getContext("2d");
let homeBlockRed = document.querySelector("#home-block-red");
let ctxHomeBlockRed = homeBlockRed.getContext("2d");
let playBlockGreen = document.querySelector("#play-block-green");
let ctxPlayBlockGreen = playBlockGreen.getContext("2d");

//middle-layer 
let playBlockYellow = document.querySelector("#play-block-yellow");
let ctxPlayBlockYellow = playBlockYellow.getContext("2d");
let finishBlock = document.querySelector("#finish-block");
let ctxFinishBlock = finishBlock.getContext("2d");
let playBlockRed = document.querySelector("#play-block-red");
let ctxPlayBlockRed = playBlockRed.getContext("2d");

//right-layer block
let homeBlockYellow = document.querySelector("#home-block-yellow");
let ctxHomeBlockYellow = homeBlockYellow.getContext("2d");
let playBlockBlue = document.querySelector("#play-block-blue");
let ctxPlayBlockBlue = playBlockBlue.getContext("2d");
let homeBlockBlue = document.querySelector("#home-block-blue");
let ctxHomeBlockBlue = homeBlockBlue.getContext("2d");

function drawLeftLayer() {
  let leftLayer = document.querySelector("#left-layer");
  homeBlockGreen.width = leftLayer.offsetWidth;
  homeBlockGreen.height = (40 * leftLayer.offsetHeight) / 100;
  
  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockGreen, 50, 35, "green");

  // outlined square X: 175, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockGreen, 175, 35, "green");

  // outlined square X: 50, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockGreen, 50, 125, "green");

  // outlined square X: 175, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockGreen, 175, 125, "green");

  playBlockGreen.width = leftLayer.offsetWidth;
  playBlockGreen.height = (20 * leftLayer.offsetHeight) / 100;
  
  //drawPlayBlockGrid(ctxPlayBlockGreen, leftLayer.offsetWidth, leftLayer.offsetWidth)
  
  ctxPlayBlockGreen.strokeStyle = "black";
  ctxPlayBlockGreen.lineWidth = 4;

  for (let i = 0; i <= playBlockGreen.width; i += playBlockGreen.width / 6) {
    ctxPlayBlockGreen.beginPath();
    ctxPlayBlockGreen.moveTo(i, 0);
    ctxPlayBlockGreen.lineTo(i, playBlockGreen.width);
    ctxPlayBlockGreen.stroke();
  }

  for (let i = 0; i <= playBlockGreen.height; i += playBlockGreen.height / 3) {
    ctxPlayBlockGreen.moveTo(0, i);
    ctxPlayBlockGreen.lineTo(playBlockGreen.width, i);
    ctxPlayBlockGreen.stroke();
  }

  homeBlockRed.width = leftLayer.offsetWidth;
  homeBlockRed.height = (40 * leftLayer.offsetHeight) / 100;
  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockRed, 50, 35, "red");

  // outlined square X: 175, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockRed, 175, 35, "red");

  // outlined square X: 50, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockRed, 50, 125, "red");

  // outlined square X: 175, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockRed, 175, 125, "red");
}
drawLeftLayer();

function drawMiddleLayer() {
  let middleLayer = document.querySelector("#middle-layer");
  playBlockYellow.width = middleLayer.offsetWidth;
  playBlockYellow.height = (40 * middleLayer.offsetHeight) / 100;
  
  //drawPlayBlockGrid(ctxPlayBlockYellow, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctxPlayBlockYellow.strokeStyle = "black";
  ctxPlayBlockYellow.lineWidth = 4;

  for (
    let i = 0;
    i <= playBlockYellow.width;
    i += playBlockYellow.width / 3
  ) {
    ctxPlayBlockYellow.beginPath();
    ctxPlayBlockYellow.moveTo(i, 0);
    ctxPlayBlockYellow.lineTo(i, playBlockYellow.width);
    ctxPlayBlockYellow.stroke();
  }

  for (
    let i = 0;
    i <= playBlockYellow.height;
    i += playBlockYellow.height / 6
  ) {
    ctxPlayBlockYellow.moveTo(0, i);
    ctxPlayBlockYellow.lineTo(playBlockYellow.width, i);
    ctxPlayBlockYellow.stroke();
  }

  finishBlock.width = middleLayer.offsetWidth;
  finishBlock.height = (20 * middleLayer.offsetHeight) / 100;
  
  //drawPlayBlockGrid(ctxPlayBlockYellow, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctxFinishBlock.strokeStyle = "black";
  ctxFinishBlock.lineWidth = 4;

  for (
    let i = 0;
    i <= finishBlock.width;
    i += finishBlock.width / 3
  ) {
    ctxFinishBlock.beginPath();
    ctxFinishBlock.moveTo(i, 0);
    ctxFinishBlock.lineTo(i, finishBlock.width);
    ctxFinishBlock.stroke();
  }

  for (let i = 0; i <= finishBlock.height; i += finishBlock.height / 3) {
    ctxFinishBlock.moveTo(0, i);
    ctxFinishBlock.lineTo(finishBlock.width, i);
    ctxFinishBlock.stroke();
  }

  playBlockRed.width = middleLayer.offsetWidth;
  playBlockRed.height = (40 * middleLayer.offsetHeight) / 100;
  //drawPlayBlockGrid(ctxPlayBlockRed, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctxPlayBlockRed.strokeStyle = "black";
  ctxPlayBlockRed.lineWidth = 4;

  for (
    let i = 0;
    i <= playBlockRed.width;
    i += playBlockRed.width / 3
  ) {
    ctxPlayBlockRed.beginPath();
    ctxPlayBlockRed.moveTo(i, 0);
    ctxPlayBlockRed.lineTo(i, playBlockRed.width);
    ctxPlayBlockRed.stroke();
  }

  for (let i = 0; i <= playBlockRed.height; i += playBlockRed.height / 6) {
    ctxPlayBlockRed.moveTo(0, i);
    ctxPlayBlockRed.lineTo(playBlockRed.width, i);
    ctxPlayBlockRed.stroke();
  }
}

drawMiddleLayer();

function drawRightLayer() {
  let rightLayer = document.querySelector("#right-layer");
  homeBlockYellow.width = rightLayer.offsetWidth;
  homeBlockYellow.height = (40 * rightLayer.offsetHeight) / 100;
  
  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockYellow, 50, 35, "yellow");

  // outlined square X: 175, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockYellow, 175, 35, "yellow");

  // outlined square X: 50, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockYellow, 50, 125, "yellow");

  // outlined square X: 175, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockYellow, 175, 125, "yellow");

  playBlockBlue.width = rightLayer.offsetWidth;
  playBlockBlue.height = (20 * rightLayer.offsetHeight) / 100;
 
  //drawPlayBlockGrid(ctxPlayBlockBlue, leftLayer.offsetWidth, playBlockBlue.height)
  ctxPlayBlockBlue.strokeStyle = "black";
  ctxPlayBlockBlue.lineWidth = 4;

  for (
    let i = 0;
    i <= playBlockBlue.width;
    i += playBlockBlue.width / 6
  ) {
    ctxPlayBlockBlue.beginPath();
    ctxPlayBlockBlue.moveTo(i, 0);
    ctxPlayBlockBlue.lineTo(i, playBlockBlue.width);
    ctxPlayBlockBlue.stroke();
  }

  for (let i = 0; i <= playBlockBlue.height; i += playBlockBlue.height / 3) {
    ctxPlayBlockBlue.moveTo(0, i);
    ctxPlayBlockBlue.lineTo(playBlockBlue.width, i);
    ctxPlayBlockBlue.stroke();
  }

  homeBlockBlue.width = rightLayer.offsetWidth;
  homeBlockBlue.height = (40 * rightLayer.offsetHeight) / 100;
  

  // outlined square X: 50, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockBlue, 50, 35, "blue");

  // outlined square X: 175, Y: 35, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockBlue, 175, 35, "blue");

  // outlined square X: 50, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockBlue, 50, 125, "blue");

  // outlined square X: 175, Y: 125, width/height 50
  createHomeSquaresAndPawns(ctxHomeBlockBlue, 175, 125, "blue");
}

drawRightLayer();
