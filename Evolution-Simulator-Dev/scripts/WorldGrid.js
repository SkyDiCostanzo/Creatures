import { Tile } from "./Tile.js";
import { data, timers } from "./datas.js";
import * as Utils from "./Utils.js";

const perlinScaleA = 0.17;
const perlinScaleGridSizeScaler = 800;
const perlinScaleB = 0.9;
const perlinBMultiplier = 0.5;
const randomMultiplier = 0.1;
const perlinToFoodValueBias = 0.8;
const perlinToFoodValueScale = 0.7;

export class WorldGrid {
  constructor(width = 0, height = 0) {
    this.Tiles = [];
    this.width = width;
    this.height = height;
    this.graphics = new PIXI.Graphics();
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getIndex(x, y) {
    // console.log(`index: ${x}, ${y}`)
    return Utils.clamp(Math.floor(y), this.height - 1) * this.width + Utils.clamp(Math.floor(x), this.width - 1);
  }

  generateGrid(width, height) {
    this.width = width;
    this.height = height;
    for (let i = this.width * this.height; i > 0; i--) {
      // console.log(`${(i - 1) % this.width}/${this.width - 1}, ${math.floor((i >= this.width * this.height ? i - 1 : i) / this.width)}/${this.height - 1}`)
      let perlinScaleAScaled = perlinScaleA / (this.width * this.height) * perlinScaleGridSizeScaler;
      let perlinScaleBScaled = perlinScaleB / (this.width * this.height) * perlinScaleGridSizeScaler;
      let perlinAX = ((i - 1) % this.width) * perlinScaleAScaled;
      let perlinAY = math.floor((i >= this.width * this.height ? i - 1 : i) / this.width) * perlinScaleAScaled; // dont even ask me man, there was a small bug
      let perlinBX = (i % this.width) * perlinScaleBScaled;
      let perlinBY = math.floor((i >= this.width * this.height ? i - 1 : i) / this.width) * perlinScaleBScaled;
      let perlinValue = perlin.get(perlinAX, perlinAY) + perlin.get(perlinBX, perlinBY) * perlinBMultiplier + math.random(-1, 1) * randomMultiplier;
      this.Tiles.push(new Tile((perlinValue + perlinToFoodValueBias) * perlinToFoodValueScale))
    }
  }

  renderGraphics(gridX, gridY, width, height) {
    this.graphics.clear();
    let tileWidth = width / this.width; 
    let tileHeight = height / this.height; 
    let tileIndex = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        tileIndex = y * this.width + x;
        let tile = this.Tiles[tileIndex]
        // console.log(`tiles: ${x}/${this.width}, ${y}/${this.height}, ${tileIndex}/${this.Tiles.length}, ${tile}`)
        this.graphics.beginFill(tile.getColor());
        this.graphics.drawRect(gridX + x * tileWidth, gridY + y * tileHeight, tileWidth, tileHeight);
        this.graphics.endFill();
      }
    }
    return this.graphics;
  }

  tickTiles(deltaTime) {
    for(let i = 0; i < this.Tiles.length; i++) {
      let tile = this.Tiles[i];
      tile.tick(deltaTime);
      data.avgTileFood.add(this.Tiles[i].getFood());
    }
  }

  foodAt(x, y) {
    let index = this.getIndex(x, y);
    let tile = this.Tiles[index]
    if (tile == null) {
      console.log(`ERROR: food at ${index}/${this.Tiles.length - 1}`)
      console.log(`${x}/${this.width - 1}, ${y}/${this.height - 1}, ${index}/${this.Tiles.length - 1}`)
      return 0;
    }
    return tile.getFoodPercent()
  }

  eatAt(x, y, eatStrength) {
    let index = this.getIndex(x, y);
    let tile = this.Tiles[index]
    if (tile == null) {
      console.log(`ERROR: eat at ${index}/${this.Tiles.length - 1}`)
      console.log(`${x}/${this.width - 1}, ${y}/${this.height - 1}, ${index}/${this.Tiles.length - 1}`)
      return 0;
    }
    return this.Tiles[index].eat(eatStrength)
  }
}