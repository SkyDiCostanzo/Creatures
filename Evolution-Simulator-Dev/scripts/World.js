import { Creature } from "./Creature.js";
import { WorldGrid } from "./WorldGrid.js";
import { Data } from "./Data.js";
import { data, timers } from "./datas.js";
import { Timer } from "./Timer.js";
import * as Utils from "./Utils.js";

const creatureRadiusRatio = 0.3;
const generateNewCreaturesPercent = 0.1;
const maxNumOfCreaturesMultiplier = 5;

export class World {
  constructor(width, height, numOfCreatures) {
    this.creatures = [];
    this.creaturesCords = [];
    this.sprites = [];
    this.worldGrid = new WorldGrid();
    this.gridWidth = width;
    this.gridHeight = height;
    this.numOfCreatures = numOfCreatures;
    this.generateWorld(this.gridWidth, this.gridHeight, numOfCreatures);
    this.creatureGraphics = new PIXI.Graphics();
    this.dataNumOfCreatures = new Data();
  }

  pixelsToGridCords(position, worldDrawRectangle) {
    let tileWidth = worldDrawRectangle.width / this.gridWidth;
    let tileHeight = worldDrawRectangle.height / this.gridHeight;
    let gridX = (position.x - worldDrawRectangle.x) / tileWidth
    let gridY = (position.y - worldDrawRectangle.y) / tileHeight
    return {
      x: gridX,
      y: gridY
    }
  }

  addCreature(x, y, genes, adolescence = 1.0, energy = 0.5) {
    this.creatures.push(new Creature(this.worldGrid, x, y, genes, adolescence, energy));
    this.creaturesCords.push([x, y]);
  }

  killCreature(index) {
    this.creatures.splice(index, 1);
    this.creaturesCords.splice(index, 1);
  }

  generateCreatures(numOfCreatures) {
    let timer = new Timer()
    for (let i = 0; i < numOfCreatures; i++) {
      let creatureX = math.random(0, this.gridWidth);
      let creatureY = math.random(0, this.gridHeight);
      this.addCreature(creatureX, creatureY,
        {
          needsMutation: false,
          generateGenes: true,
          mutableGenes: {},
          neuralNet: {
            preGenerated: false,
            layerSizes: [],
          },
        });
    }
    console.log(`${timer.getTime()} ms to generate creatures`);
    timer.reset();
  }

  generateWorld(gridWidth, gridHeight, numOfCreatures) {
    this.worldGrid.generateGrid(gridWidth, gridHeight);
    this.generateCreatures(numOfCreatures);
  }

  drawCircle(graphics, x, y, radius, color) {
    graphics.beginFill(color);
    graphics.drawCircle(x, y, radius);
    graphics.endFill();
  }

  renderCreatureGraphics(x, y, width, height) {
    let creatureRadiusThreshhold = 1 / (0.4 * width / this.gridWidth)
    this.creatureGraphics.clear();
    // console.log(`${width} / ${this.gridWidth} * ${creatureRadiusRatio}`)
    for (let i = 0; i < this.creatures.length; i++) {
      let creature = this.creatures[i];
      let creatureStats = creature.getStatus();
      let creatureRadius = width / this.gridWidth * creatureStats.get("size");
      let creatureDirection = creature.getDirection();
      let creatureColor = creature.getColor();
      let creatureX = this.creaturesCords[i][0] / this.gridWidth * width;
      let creatureY = this.creaturesCords[i][1] / this.gridHeight * height;
      this.drawCircle(this.creatureGraphics, creatureX, creatureY, creatureRadius, creatureColor);
      // if (creatureRadius > 8) { this.creatureGraphics.lineStyle(1, 0x000000, 1) }
      let smallCircleColor = creature.getIndicatorColor();
      let smallCircleX = creatureX + 0.5 * creatureRadius * math.cos(creatureDirection);
      let smallCircleY = creatureY + 0.5 * creatureRadius * math.sin(creatureDirection);
      this.drawCircle(this.creatureGraphics, smallCircleX, smallCircleY, creatureRadius * 0.5, smallCircleColor);
      let sexCircleColor = creature.getSexColor();
      this.drawCircle(this.creatureGraphics, creatureX, creatureY, creatureRadius * 0.25, sexCircleColor);

      this.creatureGraphics.lineStyle(0);
      // console.log(`creature created at ${creatureX}, ${creatureY} with radius ${creatureRadius}`)
    }
  }

  render(app, worldDrawRectangle) {
    let x = worldDrawRectangle.x;
    let y = worldDrawRectangle.y;
    let width = worldDrawRectangle.width;
    let height = worldDrawRectangle.height;
    // console.log(`render world called`)
    let worldGridGraphics = this.worldGrid.renderGraphics(x, y, width, height);
    this.renderCreatureGraphics(x, y, width, height);
    app.stage.addChild(worldGridGraphics);
    app.stage.addChild(this.creatureGraphics);
  }

  getIndexIfTouchingCreature(x, y, radius, index) {
    for (let i = 0; i < this.creatures.length; i++) {
      if (!(i == index)) {
        let creature = this.creatures[i];
        let creatureX = this.creaturesCords[i][0] / this.gridWidth * width;
        let creatureY = this.creaturesCords[i][1] / this.gridHeight * height;
        let creatureDistance = math.distance([x, y], [creatureX, creatureY])
        if (creatureDistance <= radius + creature.getSize()) {
          return i;
        }
      }
    }
    return -1;
  }

  getCreatureAt(x, y) {
    // console.log(`${}`)
    for (let i = 0; i < this.creatures.length; i++) {
      let creature = this.creatures[i];
      let creatureX = creature.getX();
      let creatureY = creature.getY();
      let size = creature.getSize();
      // console.log(`${math.distance([x, y], [creatureX, creatureY]) <= size}\ndist: ${math.distance([x, y], [creatureX, creatureY])}\nsize: ${creature.getSize()}`)
      if (math.distance([x, y], [creatureX, creatureY]) <= size) {
        return creature;
      }
    }
    return false;
  }

  getNearestCreature(x, y, index) {
    if (this.creatures.length < 2) {
      return false;
    }
    let visionShiftInRadii = 2;
    let nearestCreature = false;
    let nearestCreatureDistance = this.gridWidth ** 2 + this.gridHeight ** 2;
    let lookerSize = this.creatures[index].getSize();
    let lookerDirection = this.creatures[index].getDirection();
    let xShifted = Utils.wrap(x + -math.cos(lookerDirection) * lookerSize * visionShiftInRadii, 0, this.gridWidth);
    let yShifted = Utils.wrap(y + -math.sin(lookerDirection) * lookerSize * visionShiftInRadii, 0, this.gridHeight);
    for (let i = 0; i < this.creatures.length; i++) {
      if (!(i == index)) {
        let creature = this.creatures[i];
        // creatureX + -math.cos(creature.getDirection()) * creature.getSize() * radiiSpawnBehindParent, creatureY + -math.sin(creature.getDirection()) * creature.getSize() * radiiSpawnBehindParent
        let creatureX = this.creaturesCords[i][0];
        let creatureY = this.creaturesCords[i][1];
        let xDiff = Utils.wrapDiff(creatureX, xShifted, this.gridWidth);
        let yDiff = Utils.wrapDiff(creatureY, yShifted, this.gridHeight);
        let creatureDistance = xDiff ** 2 + yDiff ** 2;
        if (creatureDistance <= nearestCreatureDistance) {
          nearestCreature = creature;
          nearestCreatureDistance = creatureDistance;
        }
      }
    }
    return nearestCreature;
  }

  makeBaby(creature) {
    let radiiSpawnBehindParent = 2;
    let pregnancy = creature.getPregnancy()
    for (let i = 0; i < pregnancy.babyGenes.length; i++) {
      let creatureX = Utils.clamp(creature.getX() + math.random(-1, 1), this.gridWidth)
      let creatureY = Utils.clamp(creature.getY() + math.random(-1, 1), this.gridHeight)
      // creatureX + 0.5 * creatureRadius * math.cos(creatureDirection), creatureY + 0.5 * creatureRadius * math.sin(creatureDirection)
      this.addCreature(creatureX + -math.cos(creature.getDirection()) * creature.getSize() * radiiSpawnBehindParent, creatureY + -math.sin(creature.getDirection()) * creature.getSize() * radiiSpawnBehindParent, pregnancy.babyGenes[i], pregnancy.adolescences[i], pregnancy.babyEnergy);
    }
    creature.processBirth()
    /*
    if (
      creatureX > this.gridWidth -1 || 
      creatureY > this.gridHeight -1 || 
      creatureX < 0 ||
      creatureY < 0 ||
      creatureX === null ||
      creatureY === null
    ) {
      console.log(`giving creature cords: ${creatureX}/${this.gridWidth -1}, ${creatureY}/${this.gridHeight -1}`)
    }
    // */
  }

  processBite(deltaTime, index) {
    // console.log(`processBite received ${index}, creature ${this.creatures[index]}`);
    let creature = this.creatures[index];
    let bittenCreature = creature.getNearestCreature();
    let biteStrength = creature.stat("biteStrength") * deltaTime / 1000;

    let eatenEnergy = bittenCreature.processBitten(biteStrength);
    creature.processBiteSucess(eatenEnergy);
  }

  tickCreatures(deltaTime) {
    this.creaturesSetInputs()
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      let creature = this.creatures[i];
      let creatureStatus = creature.tick(deltaTime);
      if (!creatureStatus.get("alive")) {
        this.killCreature(i);
      } else {
        this.creaturesCords[i] = [creature.getX(), creature.getY()]
        if (creature.getPregnancy().isPregnant) {
          this.makeBaby(creature);
        }
        if (creatureStatus.get("isBiting")) {
          this.processBite(deltaTime, i);
        }
      }

      let creatureGenes = creature.getGenes();
      data.avgSize.add(creatureGenes.mutableGenes.size);
      data.avgEnergyPercent.add(creature.getEnergyPercent());
      data.avgPlantPreference.add(creatureGenes.mutableGenes.plantPreference);
      data.adultPercent.add(creature.isAdult());
    }
  }

  creaturesSetInputs() {
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      let creature = this.creatures[i];
      let creatureX = this.creaturesCords[i][0];
      let creatureY = this.creaturesCords[i][1];
      if (isNaN(creatureX)) {
        console.log(`creature killed for NaN cords`)
        this.killCreature(i)
      } else {
        let inputs = {
          foodAt: this.worldGrid.foodAt(creatureX, creatureY),
          nearestCreature: this.getNearestCreature(creatureX, creatureY, i),
        }
        creature.setInputs(inputs);
      }
    }
  }

  tick(deltaTime) {
    if (this.creatures.length < this.numOfCreatures * generateNewCreaturesPercent) {
      this.generateCreatures(this.numOfCreatures - this.creatures.length)
      // console.log(`most died, I made more`);
      return;
    }
    this.tickCreatures(deltaTime)
    this.worldGrid.tickTiles(deltaTime)
    data.numOfCreatures.add(this.creatures.length);
    Object.values(data).forEach(data => { data.tick() });
  }
}