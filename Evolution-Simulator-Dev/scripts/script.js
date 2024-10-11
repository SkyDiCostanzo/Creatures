import { World } from "./World.js";
import { NeuralNetwork } from "./NeuralNetwork.js";
import { Timer } from "./Timer.js";
import { data, timers } from "./datas.js";
import * as Utils from "./Utils.js";
// Create the application helper and add its render target to the page
let appWidth = window.innerWidth;
let appHeight = window.innerHeight;
let app = new PIXI.Application({ appWidth: appWidth, appHeight: appHeight, antialias: true });
app.resizeTo = window;

// const app = new PIXI.Application({ background: '#000000', resizeTo: window });

await app.init({ background: '#1099bb', resizeTo: window });

document.body.appendChild(app.canvas);

const debugFlag = false;

const worldDrawRectangle = new PIXI.Rectangle(0, 0, appWidth, appHeight)
const tileSize = 20;
const gridWidth = appWidth / tileSize;
const gridHeight = appHeight / tileSize;
const numOfCreaturesPerTile = 0.08; // 0.04
const numOfCreatures = debugFlag ? 2 : gridWidth * gridHeight * numOfCreaturesPerTile;
const world = new World(math.floor(gridWidth), math.floor(gridHeight), numOfCreatures);

let cursorCords = { x: undefined, y: undefined };

window.addEventListener('mousemove', (event) => {
  cursorCords = { x: event.clientX, y: event.clientY };
});
const basicText = new PIXI.Text('');
basicText.x = 50;
basicText.y = 100;

app.stage.eventMode = `static`;
app.stage.addEventListener('pointerdown', (e) => {
  let viewedCreature = world.getCreatureAt(cursorCords.x, cursorCords.y, worldDrawRectangle)
  // console.log(viewedCreature);
  let info = "";
  if (viewedCreature) {
    info = math.round(viewedCreature.getEnergyPercent() * 100)
  }
  let cursorGridCords = world.pixelsToGridCords(cursorCords, worldDrawRectangle)
  // console.log(cursorGridCords)
  basicText.text = `${info}`
})
// */


// const tps = debugFlag ? 2 : 200; // 10
let deltaTime = 200; //1000 / tps;

let pause = false;
let slowMode = false;
let slowModeMinTimePerTick = 200;
let timer = new Timer();
function run() {
  timer.reset();
  world.tick(deltaTime)
  world.render(app, worldDrawRectangle)
  if (!pause) {
    if (slowMode) {
      let timeToNextTick = Math.max(slowModeMinTimePerTick - timer.getTime(), 0);
      setTimeout(run, timeToNextTick)
    } else {
      setTimeout(run, 0);
    }
  }
}

function logData() {
  console.log('data:')
  for (const [key, value] of Object.entries(data)) {
    console.log(`${key}: ${value.getLatest()}`)
  }
}

document.addEventListener('keyup', function(event) {
  if (event.code == 'Space') {
    if (pause) {
      pause = false;
      run();
    } else {
      pause = true;
    }
  }

  if (event.code == 'KeyS') {
    slowMode = !slowMode;
  }
});

run()

/*
let readyToRun = true;

function run(deltaTime) {
  world.tick(deltaTime)
  world.render(app, worldDrawRectangle)
  // app.stage.addChild(basicText);
  readyToRun = true;
}

for (let i = 1000; i > 0; i--) {
  if (readyToRun) {
    readyToRun = false;
    // deltaTime = timer.getTime();
    run(deltaTime)
    // timer.reset()
  }
}
// */
/*
addEventListener("resize", (event) => {
  appWidth = window.innerWidth;
  appHeight = appWidth;
  app.resize();
});
// */


// setInterval(run, 1000 / tps)
// setInterval(logData, 10000)

/*
const layerSizes = [2, 3, 5, 2];
let testNet = new NeuralNetwork(layerSizes)

let testInput = math.ones(layerSizes[0], 1)
console.log(`Neural Net output:\n${Utils.matrixToString(testNet.process(testInput))}`)
// */







