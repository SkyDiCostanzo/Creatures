import * as Utils from "./Utils.js";
// import * as data from "./data.js";

const inactiveColor = new PIXI.Color(0xff0000)
const foodColor = new PIXI.Color(0x498a4d)
const growthTimeout = 0;
const growPercentOfMax = 0.005; //0.02
const maxMaxFood = 55; // 75
const eatExponent = 1; // 1

export class Tile {
  constructor(maxFood = math.random(0.3, 1)) {
    this.maxFood = maxFood * maxMaxFood;
    this.food = this.maxFood;
    this.growthTimeout = 0;
  }

  getColor() {
    return Utils.desaturate(foodColor, this.getFoodPercent());
    /*
    if (this.growthTimeout <= 0) {
      return Utils.desaturate(foodColor, this.getFoodPercent());
    }
    return Utils.desaturate(inactiveColor, this.getFoodPercent())
    // */
  }

  getFood() {
    return this.food;
  }

  getFoodPercent() {
    return this.food / maxMaxFood;
  }

  eat(eatStrength) {
    let eatenFood = Utils.clamp((this.food * eatStrength / maxMaxFood) ** eatExponent, this.food)
    this.food -= eatenFood;
    this.growthTimeout = growthTimeout;
    return eatenFood;
  }

  tick(deltaTime) {
    this.growthTimeout -= deltaTime;
    if (this.growthTimeout <= 0) { this.growthTimeout = 0; }
    this.food = Utils.clamp(this.food + growPercentOfMax * this.maxFood * deltaTime / 1000, this.maxFood)
  }
}