let circularPawns = { green: [], red: [], yellow: [], blue: [] };
let dimensions = { green: {}, red: {}, yellow: {}, blue: {} };

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
    x: x + 25,
    y: y + 25,
    radius: 15,
  });
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
  dimensions["green"]["width"] = playBlockGreen.width;
  dimensions["green"]["height"] = playBlockGreen.height;

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
  dimensions["yellow"]["width"] = playBlockGreen.width;
  dimensions["yellow"]["height"] = playBlockGreen.height;

  //drawPlayBlockGrid(ctxPlayBlockYellow, leftLayer.offsetWidth, leftLayer.offsetWidth)
  ctxPlayBlockYellow.strokeStyle = "black";
  ctxPlayBlockYellow.lineWidth = 4;

  for (let i = 0; i <= playBlockYellow.width; i += playBlockYellow.width / 3) {
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

  for (let i = 0; i <= finishBlock.width; i += finishBlock.width / 3) {
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

  for (let i = 0; i <= playBlockRed.width; i += playBlockRed.width / 3) {
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

  for (let i = 0; i <= playBlockBlue.width; i += playBlockBlue.width / 6) {
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

function findXCoOrdinates(width, x) {
  let xArr = [];
  for (let i = 0; i < width; i += width / x) {
    xArr.push(Math.floor(i + 10));
  }
  return xArr;
}

function findYCoOrdinates(height, y) {
  let yArr = [];
  for (let i = 0; i < height; i += height / y) {
    yArr.push(Math.floor(i + 10));
  }
  return yArr;
}

// defining maps of each play block
let mapOfGreen = [[], [], []];

let greenWidth = dimensions.green.width;
let greenHeight = dimensions.green.height;
let xArr = findXCoOrdinates(greenWidth, 6);
let yArr = findYCoOrdinates(greenHeight, 3);

let i = 0;
while (i < xArr.length) {
  mapOfGreen[0].push({ x: xArr[i], y: yArr[0], ctx: ctxPlayBlockGreen });
  mapOfGreen[1].push({ x: xArr[i], y: yArr[1], ctx: ctxPlayBlockGreen });
  mapOfGreen[2].push({ x: xArr[i++], y: yArr[2], ctx: ctxPlayBlockGreen });
}

let mapOfBlue = mapOfGreen.map(eachRow => eachRow.map(square => square["ctx"] = ctxPlayBlockBlue));

let yellowWidth = dimensions.yellow.width;
let yellowHeight = dimensions.yellow.height;
let mapOfYellow = [[], [], [], [], [], []];
xArr = findXCoOrdinates(yellowWidth, 3);
yArr = findYCoOrdinates(yellowHeight, 6);

i = 0;
while (i < xArr.length) {
  mapOfYellow[0].push({ x: xArr[i], y: yArr[0], ctx: ctxPlayBlockYellow });
  mapOfYellow[1].push({ x: xArr[i], y: yArr[1], ctx: ctxPlayBlockYellow });
  mapOfYellow[2].push({ x: xArr[i], y: yArr[2], ctx: ctxPlayBlockYellow });
  mapOfYellow[3].push({ x: xArr[i], y: yArr[3], ctx: ctxPlayBlockYellow });
  mapOfYellow[4].push({ x: xArr[i], y: yArr[4], ctx: ctxPlayBlockYellow });
  mapOfYellow[5].push({ x: xArr[i++], y: yArr[5], ctx: ctxPlayBlockYellow });
}

let mapOfRed = mapOfYellow.map(eachRow => eachRow.map(square => square["ctx"] = ctxPlayBlockRed));

// build all possible paths
let greenTopPathInitial = mapOfGreen[0].slice(1)  
let greenTopPath = mapOfGreen[0]
// include only the middle square
let greenMiddlePath = mapOfGreen[1][0]
let greenMiddlePathFinal = mapOfGreen[1]
let greenBottomPath = mapOfGreen[2].reverse()

let yellowLeftPath = []
for(let i = 0; i < mapOfYellow.length; i++){
  yellowLeftPath.push(mapOfYellow[i][0])
}
yellowLeftPath = [...yellowLeftPath.reverse()]
// include only the middle square
let yellowTopPath = mapOfYellow[0][1]
let yellowMiddlePath = []
for(let i = 0; i < mapOfYellow.length; i++){
  yellowMiddlePath.push(mapOfYellow[i][1])
}
let yellowRightPath = []
for (let i = 0; i < mapOfYellow.length; i++){
  yellowRightPath.push(mapOfYellow[i][2])
}
let yellowRightPathInitial = yellowRightPath.slice(1)

let blueTopPath = mapOfBlue[0]
let blueMiddlePath = mapOfBlue[1][mapOfBlue.length - 1]
let blueMiddlePathFinal = mapOfBlue.reverse()
let blueBottomPath = mapOfBlue[2].reverse()
let blueBottomPathInitial = blueBottomPath.slice(1)

let redLeftPath = [...yellowLeftPath]
let redLeftPathInitial = redLeftPath.slice(1)
let redRightPath = [...yellowRightPath]
let redMiddlePath = mapOfRed[mapOfRed.length - 1][1]
let redMiddlePathFinal = yellowMiddlePath.reverse()

// build paths for each player
let pathOfPlayer1 = [greenTopPathInitial, yellowLeftPath, yellowMiddlePath, yellowRightPath, blueTopPath, blueMiddlePath, blueBottomPath, redRightPath, redMiddlePath, redLeftPath, greenBottomPath, greenMiddlePathFinal]

// game logic

// get the start button and check if game has started


// implement die logic

let diceValue = 6

// real logic begins here

function drawCircleBasedOnDiceValue(path){

}

function hideCircle(circle, ctx){
  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  // x, y, radius, startAngle, endAngle, antiClockwise = false by default
  ctx.arc(circle.x, circle.y, 15, 0, 2 * Math.PI, false); // full circle
  ctx.fill();
  ctx.stroke();
}

function isIntersect(point, circle) {
  console.log("here")
  console.log("calc", Math.sqrt((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2))
  return Math.sqrt((point.x-circle.x) ** 2 + (point.y - circle.y) ** 2) <= circle.radius;
}

homeBlockGreen.addEventListener('click', (e) => {
  const rect = homeBlockGreen.getBoundingClientRect()
  const mousePoint = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  circularPawns["green"].forEach(circle => {
    if (isIntersect(mousePoint, circle)) {
      //hide the circle at the home block and draw it at the position according to the die's value
      hideCircle(circle, ctxHomeBlockGreen)
      drawCircleBasedOnDiceValue(pathOfPlayer1)
    }
  });
});