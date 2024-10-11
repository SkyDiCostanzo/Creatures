import * as Utils from "./Utils.js";
import { NeuralNetwork } from "./NeuralNetwork.js";
import { WorldGrid } from "./WorldGrid.js";
import { Timer } from "./Timer.js";
import { data, timers } from "./datas.js";

const accelerationMultiplier = 1; // 10
const maxVelocity = 1;
/*
const lowEnergyColor = new PIXI.Color(0x7a726f);
const maxEnergy = 100;
const eatThreshhold = 0.0;
const eatStrengthMultiplier = 10;
const maxEatStrength = 10;
const eatCostMultiplier = 0.2;
const eatEnergyGainMultiplier = 1;
const moveCostMultiplier = 6;
const energyLossMetabolismMultiplier = 1; // 1
// */

// const energyPerMass = 800000; // joules/kg
// const energyPerKiloGrass = 4000000; // joules/kg
// const energyPerKiloFat = 37000000; // joules/kg


const eatThreshold = 0.0;
const biteThreshold = 0.5;
const mateThreshold = 0.0;
const birthThreshold = 0.0;
const sprintThreshold = 0.5;
const eatStrengthPerMass = 75; // 75
const biteStrengthPerMass = 250; // 2
// const maxEatStrength = 10;
const eatCostMultiplier = 0; // 0.05
const biteCostMultiplierPerMass = 5; // 20
const eatEnergyGainMultiplier = 1.0; // 1
const biteEnergyGainMultiplier = 1.0; // 0.5
const basePreference = 0.0;
const mateEnergyThreshold = 0.0;
const mateHealthThreshold = 0.0;

const metabolismMultiplierPerMass = 0.5; // 2.5
const metabolismPower = 0.75;
const maxEnergyPerMass = 150; // 355
const maxHealthPerMass = 355;
const moveCostMultiplier = 4.7; // 2.7
const accMultiplier = 1000;
const fricAcc = -0.2;
const sprintMaxSpeedMultiplier = 1.5;
const sprintMetabolismMultiplier = 2;
const rotateCostMultiplierPerMass = 1;
const rotateSpeedMultiplier = math.pi;
// const maxSpeedPerMass = 3.5;
const maxSpeedPerSize = 3.25; //3.25
const maxSpeedPerSizeExponent = 0.6;
const maxAngularVelocity = 2 * math.pi;
const minSize = 0.15;
const creatureVisionInRadii = 20;
const healPercent = 0.1;
const healThreshholdPercent = 0.5;

const oldThreshold = 600000;
const ageDivisor = 10000;

const timeSinceMax = 10000;
const timeSinceInputMax = 2;
const maxInputValue = 4;
const maxNearestCreatureDistanceInputValue = 2.0;
const minNearestCreatureDistanceInputValue = -1.0;

const creatureNeuralNetworkNumOfNeurons = [15, 8, 8, 7];
const memoryLength = 4;
creatureNeuralNetworkNumOfNeurons[0] += memoryLength;
creatureNeuralNetworkNumOfNeurons[creatureNeuralNetworkNumOfNeurons.length - 1] += memoryLength;

const creatureSaturation = 100;
const creatureValue = 100;
const bitingColor = new PIXI.Color(0xFF0000);
const matingColor = new PIXI.Color(0xe68ae4);
const matingColorUpTime = 500;
const noEnergyColor = new PIXI.Color(0xFFFFFF);
const fullEnergyColor = new PIXI.Color(0x000000);
const transparentColor = new PIXI.Color([1, 0, 0, 0]);

const mutationStandardDeviationSmallness = 32
const mutableGeneMaxMin = {
  size: {
    max: 2.0,
    min: 0.3,
    default: 0.3,
    blendOdds: 0.5,
  },
  colorH: {
    max: 360,
    min: 0,
    wrap: true,
    blendOdds: 0.1,
  },
  numOfBabies: {
    max: 4,
    min: 1,
    default: 2,
  },
  percentMaxSizeOfBabies: {
    max: 0.5,
    min: 0.1,
    default: 0.5,
  },
  percentOfMaxEnergyInBabies: {
    max: 1.0,
    min: 0.3,
    default: 0.5,
  },
  percentOfMaxEnergyLeftAfterPregnancy: {
    max: 1.0,
    min: 0.0,
    default: 0.3,
  },
  plantPreference: {
    max: 1.0,
    min: 0.0,
    default: 0.5,
    blendOdds: 0.2,
  },
  plantPreferenceYoung: {
    max: 1.0,
    min: 0.0,
    default: 0.5,
    blendOdds: 0.2,
  },
}


export class Creature {
  constructor(worldGrid, x = 0, y = 0, genes, adolescence, energy = 0.5) {
    this.worldGrid = worldGrid;

    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = math.sqrt(math.pow(this.velocityX, 2) + math.pow(this.velocityY, 2));
    this.direction = 0;
    this.acc = 0;
    this.angularVelocity = 0;

    this.isTouchingCreature = false;

    this.genes = genes;
    this.genes.neuralNet.layerSizes = creatureNeuralNetworkNumOfNeurons;
    this.neuralNet = new NeuralNetwork(this.genes.neuralNet);
    if (this.genes.needsMutation) { this.mutate() }
    if (this.genes.generateGenes) { this.generateGenes() }

    this.genes.neuralNet.weights = this.neuralNet.getWeights();
    this.genes.neuralNet.biases = this.neuralNet.getBiases();
    this.genes.neuralNet.preGenerated = true;

    this.color = new PIXI.Color({
      h: math.round(this.genes.mutableGenes.colorH),
      s: creatureSaturation,
      v: creatureValue,
    })

    this.memory = Array(memoryLength).fill(0);
    this.inputs = math.zeros(this.genes.neuralNet.layerSizes[0], 1)
    this.extraValues = {
      nearestCreature: false,
      matingCreature: false,
      hasMated: false,
      timeSince: {
        givingBirth: timeSinceMax,
        biting: timeSinceMax,
        gettingBitten: timeSinceMax,
        mating: timeSinceMax,
      }
    }

    this.setStats(adolescence, energy);
    this.pregnancy = {
      babyGenes: this.generateBabyGenes(),
    }
    this.setPregnancy();

    this.age = 0;
  }

  updateStats(deltaTime) {
    this.stats.set("size", this.genes.mutableGenes.size * this.stat("adolescence"));
    this.stats.set("mass", math.pi * this.stat("size") ** 2);
    this.stats.set("maxEnergy", maxEnergyPerMass * this.stat("mass"));
    this.stats.set("maxHealth", maxHealthPerMass * this.stat("mass"));
    this.stats.set("rotateCostMult", rotateCostMultiplierPerMass * this.stat("mass"));
    let sprintMetabolismMult = this.stat("isSprinting") ? sprintMetabolismMultiplier : 1;
    this.stats.set("metabolismCostMult", metabolismMultiplierPerMass * math.pow(this.stat("mass"), metabolismPower) * sprintMetabolismMult);
    let sprintmaxSpeedMult = this.stat("isSprinting") ? sprintMaxSpeedMultiplier : 1;
    this.stats.set("maxSpeed", (maxSpeedPerSize * this.stat("size") * this.stat("health") * sprintmaxSpeedMult * this.stat("ageMult") ** maxSpeedPerSizeExponent));
    this.stats.set("eatStrength", eatStrengthPerMass * this.stat("mass"));
    this.stats.set("biteStrength", biteStrengthPerMass * this.stat("mass") * this.stat("ageMult"));
    this.stats.set("biteCost", biteCostMultiplierPerMass * this.stat("mass"));
    this.stats.set("healPercent", this.stat("ageMult") * healPercent);

    this.stats.set("plantPreference", this.isAdult() ? this.genes.mutableGenes.plantPreference : this.genes.mutableGenes.plantPreferenceYoung);
    let halfPi = math.pi / 2
    let baseEatMult = math.sin(this.stat("plantPreference") * halfPi) ** 2
    let baseBiteMult = 1 - baseEatMult;
    this.stats.set("eatGainMult", eatEnergyGainMultiplier * baseEatMult * (1 - basePreference) + basePreference);
    this.stats.set("biteGainMult", biteEnergyGainMultiplier * baseBiteMult * (1 - basePreference) + basePreference);

    for (const [key, value] of Object.entries(this.extraValues.timeSince)) {
      this.extraValues.timeSince[key] = Utils.clamp(value + deltaTime, timeSinceMax);
    }
    // if (this.isAdult) { this.age += deltaTime; }
    this.age += deltaTime;
    /* if (this.age > this.stat("oldThreshold")) {
      this.stats.set("ageMult", ageDivisor / (this.age - this.stat("oldThreshold") + ageDivisor)); // ageMult is (1/n) where n increases by 1 every ageDivisor
    } */
  }

  setStats(adolescence, energy) {
    this.stats = new Map();
    this.stats.set("color", math.round(this.genes.mutableGenes.colorH))
    this.stats.set("alive", true);
    this.stats.set("isBiting", false);
    this.stats.set("tryingToBite", false);
    this.stats.set("tryingToBirth", false);
    this.stats.set("canMate", false);
    this.stats.set("healPercent", healPercent);
    this.stats.set("ageMult", 1);
    this.stats.set("oldThreshold", (oldThreshold * this.genes.mutableGenes.size) ** 0.5);
    this.stats.set("isSprinting", false);

    this.stats.set("adolescence", adolescence)
    this.stats.set("size", this.genes.mutableGenes.size * this.stat("adolescence"));
    this.stats.set("mass", math.pi * math.pow(this.stat("size"), 2));
    this.stats.set("maxHealth", maxHealthPerMass * this.stat("mass"));
    this.stats.set("health", 1);
    this.updateStats(0);

    this.stats.set("energy", this.stat("maxEnergy") * energy)
  }

  setPregnancy() {
    let energyForPregnancy = 0;
    let adolescences = [];
    this.pregnancy.babyGenes.forEach((babyGenes) => {
      let size = this.genes.mutableGenes.percentMaxSizeOfBabies * this.genes.mutableGenes.size;
      if (size < minSize) { size = minSize }
      let adolescence = size / babyGenes.mutableGenes.size;
      adolescences.push(adolescence);
      let baseEnergy = maxEnergyPerMass * math.pi * (size ** 2);
      let startingEnergy = baseEnergy * this.genes.mutableGenes.percentOfMaxEnergyInBabies
      energyForPregnancy += baseEnergy + startingEnergy;
    })
    let energyLeftAfterPregnancy = this.genes.mutableGenes.percentOfMaxEnergyLeftAfterPregnancy * this.stat("maxEnergy");

    this.pregnancy.isPregnant = false;
    this.pregnancy.babyEnergy = this.genes.mutableGenes.percentOfMaxEnergyInBabies;
    this.pregnancy.adolescences = adolescences;
    this.pregnancy.energyPregnacyThreshold = energyForPregnancy + energyLeftAfterPregnancy;
    this.pregnancy.energyForPregnancy = energyForPregnancy;
  }

  getGenes() {
    return this.genes;
  }

  getStatus() {
    return this.stats;
  }

  getColor() {
    return this.color;
  }

  getIndicatorColor() {
    if (this.stat("isBiting")) { return bitingColor; }
    if (this.extraValues.timeSince.mating <= matingColorUpTime) { return matingColor; }

    let energyPercent = !this.isAdult() ? this.stat("energy") / this.stat("maxEnergy") : this.stat("energy") / this.pregnancy.energyPregnacyThreshold
    return Utils.colorGradient(noEnergyColor, fullEnergyColor, energyPercent)
    // return Utils.colorGradient(noEnergyColor, fullEnergyColor, this.stat("health"))
  }

  getSexColor() {
    if (this.age > oldThreshold) { return noEnergyColor }
    //canMate
    if (this.extraValues.hasMated) { return matingColor; }
    return transparentColor;
  }

  getMated() {
    return this.extraValues.hasMated;
  }

  getEnergy() {
    return this.stat("energy");
  }

  getEnergyPercent() {
    return this.stat("energy") / this.stat("maxEnergy");
  }

  getDirection() {
    return this.direction;
    // let direction = math.atan(this.velocityY / this.velocityX)
    return math.atan(this.velocityY / this.velocityX)
  }

  getX() {
    if (isNaN(this.x)) {
      console.log(
        `data NaN:
        speed: ${this.speed},
        acc: ${accMultiplier * this.acc},
        maxSpeed: ${this.stat("maxSpeed")},
        velocityX: ${this.velocityX},
        velocityY: ${this.velocityY},
        angularVelocity: ${this.angularVelocity},
      `)
    }
    // console.log(`creature getX called: ${this.x}`)
    return this.x;
  }

  getY() {
    return this.y;
  }

  getSize() {
    return this.stat("size");
  }

  getHealth() {
    return this.stat("health");
  }

  getTimeSinceBiting() {
    return this.extraValues.timeSince.biting;
  }

  getNearestCreature() {
    return this.extraValues.nearestCreature;
  }

  isAdult() {
    return this.stat("adolescence") >= 1.0;
  }

  getPredator() {
    return 1 - this.stat("plantPreference");
  }

  stat(stat) {
    return this.stats.get(stat)
  }

  getPregnancy() {
    return this.pregnancy;
  }

  getGenesCopy() {
    let genes = {
      mutableGenes: {},
      needsMutation: true,
      generateGenes: false,
      neuralNet: {
        preGenerated: this.genes.neuralNet.preGenerated,
        layerSizes: { ...this.genes.neuralNet.layerSizes },
        weights: math.map(this.genes.neuralNet.weights, (value) => { return math.map(value, (val) => { return val }) }),
        biases: math.map(this.genes.neuralNet.biases, (value) => { return math.map(value, (val) => { return val }) }),
      }
    };
    for (let [key, value] of Object.entries(this.genes.mutableGenes)) {
      genes.mutableGenes[key] = value;
    };
    return genes;
  }

  generateBabyGenes() {
    let babyGenes = [];
    for (let i = 0; i < this.genes.mutableGenes.numOfBabies; i++) {
      let genes = this.getGenesCopy()
      genes.needsMutation = true;
      genes.generateGenes = false;
      babyGenes.push(genes);
    }
    return babyGenes;
  }

  generateGenes() {
    for (let [key, value] of Object.entries(mutableGeneMaxMin)) {
      if (value.default != null) {
        this.genes.mutableGenes[key] = value.default;
      } else {
        this.genes.mutableGenes[key] = math.random(value.min, value.max);
      }
      // console.log(`mutated ${key} from ${value} to ${this.genes.mutableGenes[key]}`)
    }
    this.genes.generateGenes = false;
  }

  mutate() {
    this.neuralNet.mutate();
    for (let [key, value] of Object.entries(this.genes.mutableGenes)) {
      let maxMin = mutableGeneMaxMin[key]
      let mutationStandardDeviation = (maxMin.max - maxMin.min) / mutationStandardDeviationSmallness;
      if (maxMin.wrap) {
        this.genes.mutableGenes[key] = Utils.wrap(Utils.gaussianRandom(value, mutationStandardDeviation), maxMin.max, maxMin.min)
      } else {
        this.genes.mutableGenes[key] = Utils.clamp(Utils.gaussianRandom(value, mutationStandardDeviation), maxMin.max, maxMin.min)
      }
      // console.log(`mutated ${key} from ${value} to ${this.genes.mutableGenes[key]}`)
    }
  }

  move(deltaTime, tileWidth, tileHeight) {
    /*
    console.log(`creature position premove: ${this.x}, ${this.y}`)
    console.log(
    `data premove:
      speed: ${this.speed},
      acc: ${accMultiplier * this.acc},
      maxSpeed: ${this.stat("maxSpeed")},
      velocityX: ${this.velocityX},
      velocityY: ${this.velocityY},
      angularVelocity: ${this.angularVelocity},
      deltaTime: ${deltaTime},
    `)
    // */
    let effectiveAngularVelocity = this.angularVelocity > maxAngularVelocity ? maxAngularVelocity : this.angularVelocity;
    this.direction += this.angularVelocity * deltaTime / 1000;
    if (this.direction > 2 * math.pi) {
      this.direction -= 2 * math.pi
    }
    if (this.direction < 0) {
      this.direction += 2 * math.pi
    }
    // let effectiveAcc = this.acc >= 0 ? this.acc : min(fricAcc, this.acc);
    // console.log(effectiveAcc)
    this.speed = Utils.clamp(this.speed + this.acc * deltaTime / 1000, this.stat("maxSpeed"), 0);
    this.velocityX = this.speed * math.cos(this.direction);
    this.velocityY = this.speed * math.sin(this.direction);

    this.x += this.velocityX * deltaTime / 1000;
    this.y += this.velocityY * deltaTime / 1000;
    /*
    console.log(
    `data postmove:
      speed: ${this.speed},
      acc: ${this.acc},
      maxSpeed: ${this.stat("maxSpeed")},
      velocityX: ${this.velocityX},
      velocityY: ${this.velocityY},
      deltaTime: ${deltaTime},
    `)
    // */
    if (this.x > tileWidth) {
      this.x -= tileWidth
    }
    if (this.x < 0) {
      this.x += tileWidth
    }
    if (this.y > tileHeight) {
      this.y -= tileHeight
    }
    if (this.y < 0) {
      this.y += tileHeight
    }
  }

  nearestCreatureInputs(nearestCreature) {
    let distanceAdjusted = maxNearestCreatureDistanceInputValue;
    let directionRelative = 0;
    let colorDiff = 1;
    let age = 0;
    let relativeSize = 0;
    let predator = 0;

    if (nearestCreature) {
      let nearestCreatureDistance = math.distance([this.x, this.y], [nearestCreature.getX(), nearestCreature.getY()]) - nearestCreature.getSize();
      if (nearestCreatureDistance < 0) { nearestCreatureDistance = 0; }
      distanceAdjusted = Utils.clamp(
        math.log(nearestCreatureDistance / this.stat("size"), creatureVisionInRadii) * maxNearestCreatureDistanceInputValue,
        maxNearestCreatureDistanceInputValue,
        minNearestCreatureDistanceInputValue
      )
      predator = nearestCreature.getPredator() ** 2;

      let nearestCreatureDirection = math.atan((nearestCreature.getY() - this.y) / (nearestCreature.getX() - this.x));
      directionRelative = Utils.wrapDiff(nearestCreatureDirection, this.direction, math.pi, -math.pi) / 2;

      colorDiff = Utils.wrapDiff(nearestCreature.stat("color"), this.stat("color"), 360) / 360;
      // age = nearestCreature.stat("adolescence") - 1 + (1 - nearestCreature.stat("ageMult"));
      age = (nearestCreature.stat("adolescence") == 1) * 1;
      relativeSize = Utils.clamp(0.4 * nearestCreature.getSize() / this.stat("size"), maxInputValue, -maxInputValue)
    }

    return {
      distance: distanceAdjusted,
      direction: directionRelative,
      predator: predator,
      colorDiff: colorDiff,
      age: age,
      relativeSize: relativeSize,
    }
  }

  setInputs(inputs) {
    this.extraValues.nearestCreature = inputs.nearestCreature;
    let nearestCreature = this.nearestCreatureInputs(inputs.nearestCreature);

    this.isTouchingCreature = nearestCreature.distance <= 0;

    let timeSince = {}
    for (const [key, value] of Object.entries(this.extraValues.timeSince)) {
      timeSince[key] = timeSinceInputMax * (1 - math.log(value + 1, timeSinceMax + 1))
    }

    let inputsArr = [
      1,
      Utils.clamp(this.getEnergyPercent(), maxInputValue, -maxInputValue),
      this.stat("health") / this.stat("maxHealth"),
      this.speed / this.stat("maxSpeed"),
      inputs.foodAt,
      nearestCreature.distance,
      nearestCreature.direction,
      nearestCreature.predator,
      this.isTouchingCreature * 1,
      nearestCreature.colorDiff,
      nearestCreature.age,
      nearestCreature.relativeSize,
      this.stat("adolescence") - 1 + (1 - this.stat("ageMult")), // negative if young, positive if old
      timeSince.givingBirth,
      timeSince.gettingBitten,
      this.extraValues.hasMated * 1,
    ]

    /*
    inputsArr.forEach((value, index) => {
      if (math.abs(value) > 4) {
        console.log(`At ${this.x}, ${this.y}
    ageMult: ${this.stat("ageMult")}
    maxEnergy: ${this.stat("maxEnergy")}
    maxSpeed: ${this.stat("maxSpeed")}
    Input[${index}]: ${value}`)
      }
    })
    // */
    inputsArr = inputsArr.concat(this.memory);

    /* Inputs
    constant
    energyPercent
    healthPercent
    speed
    foodAtCurrentTile
    nearestCreatureDistance
    nearestCreatureDirection (relative to current facing)
    nearestCreature meat preference
    nearestCreatureIsTouching
    colorDiff,
    nearestCreature IsAnAdult,
    nearestCreatureRelativeSize,
    age
    timeSinceGivingBirth
    hasMated
    memory x 4
    */
    /* maybe add?
    
    */

    // console.log(`creature old inputs:\n${Utils.matrixToString(this.inputs)}`)
    // console.log(`creature position: ${this.x}, ${this.y}`)

    this.inputs = math.map(this.inputs, (value, index) => {
      return inputsArr[math.subset(index, math.index(0))];
    })

    // console.log(`creature new inputs:\n${Utils.matrixToString(this.inputs)}`)
  }

  processOutputs(deltaTime) {
    let outputMatrix = this.neuralNet.run(this.inputs)
    let outputMatrixSize = math.subset(math.size(outputMatrix), math.index(0))
    let outputs = new Array(outputMatrixSize)
    for (let i = 0; i < outputMatrixSize; i++) {
      outputs[i] = math.subset(outputMatrix, math.index(i, 0))
    }
    // console.log(`outputs:\n${Utils.matrixToString(outputMatrix)}`)
    /* Outputs
    acceleration
    angularVelocity
    eat
    bite
    mate
    birth
    sprint
    memory x 4
    */

    this.memory = outputs.slice(outputs.length - this.memory.length, outputs.length);

    this.acc = accelerationMultiplier * outputs[0];
    this.angularVelocity = outputs[1] * rotateSpeedMultiplier;

    this.stats.set("isBiting", false);
    this.stats.set("tryingToBite", false);
    this.stats.set("tryingToBirth", false);
    this.stats.set("canMate", false);
    this.stats.set("isSprinting", false);

    if (this.isAdult() && this.getEnergyPercent() > mateEnergyThreshold && this.stat("health") > mateHealthThreshold) {
      this.stats.set("canMate", true);
      if (!this.extraValues.hasMated && outputs[4] > mateThreshold && this.isTouchingCreature) {
        this.mate(this.extraValues.matingCreature || this.extraValues.nearestCreature);
      } else {
        this.extraValues.matingCreature = false;
      }
    }
    if (outputs[6] > sprintThreshold) {
      this.stats.set("isSprinting", true);
    }
    if (outputs[2] > eatThreshold && !this.stat("isSprinting")) {
      this.eat(deltaTime)
    }
    if (outputs[3] > biteThreshold && outputs[3] > outputs[2]) {
      this.stats.set("tryingToBite", true);
      if (this.isTouchingCreature) {
        this.bite(deltaTime);
      }
    } else {
      // if (outputs[5] > birthThreshold) {
      if (outputs[5] > birthThreshold && this.extraValues.hasMated) {
        this.stats.set("tryingToBirth", true);
      }
    }

    this.move(deltaTime, this.worldGrid.getWidth(), this.worldGrid.getHeight());
    // console.log(`outputAcc: ${outputs[0] * accelerationMultiplier}\acc: ${this.acc}`)
  }

  eat(deltaTime) {
    let eatStrength = this.stat("eatStrength") * deltaTime / 1000
    let eatEnergyCost = eatCostMultiplier * eatStrength;
    let eatEnergy = this.stat("eatGainMult") * this.worldGrid.eatAt(this.x, this.y, eatStrength);
    // console.log(`eatStrength: ${eatStrength * deltaTime / 1000}\neatEnergy: ${eatEnergy}\neatCost: ${eatEnergyCost}\neatTotal: ${eatEnergy - eatEnergyCost}`)
    this.changeEnergy(eatEnergy - eatEnergyCost)
  }

  bite(deltaTime) {
    let biteEnergyCost = this.stat("biteCost") * deltaTime / 1000;
    this.stats.set("isBiting", true);
    // console.log(`biteCost: ${biteEnergyCost}`)
    this.changeEnergy(-biteEnergyCost)
  }

  processBiteSucess(eatenEnergy) {
    // console.log(`biteSucess: ${eatenEnergy}`)
    this.changeEnergy(this.stat("biteGainMult") * eatenEnergy)
  }

  processBitten(biteStrength) {
    let bittenCreatureHealthPoints = this.stat("health") * this.stat("maxHealth");
    let bittenPercent = 0;
    let bonusEnergy = 0;
    if (biteStrength > bittenCreatureHealthPoints) {
      bittenPercent = this.stat("health");
      bonusEnergy = this.stat("energy");
    } else {
      bittenPercent = biteStrength / bittenCreatureHealthPoints;
    }
    this.changeHealth(-bittenPercent);
    this.extraValues.timeSince.gettingBitten = 0;
    // console.log(`biteStrength: ${biteStrength}/${bittenCreatureHealthPoints} (${bittenPercent})\nhealth: ${this.stat("health")}\nenergy: ${bittenPercent * this.stat("mass") * maxEnergyPerMass + bonusEnergy}/${this.stat("maxEnergy")}`)
    return bittenPercent * this.stat("mass") * maxEnergyPerMass + bonusEnergy;
  }

  processMate(matingCreature) {
    if (this.extraValues.hasMated) { return; }

    this.extraValues.matingCreature = matingCreature;
  }

  processBirth() {
    this.babyGenes = this.generateBabyGenes();
    this.setPregnancy();
  }

  heal(deltaTime) {
    if (/*!this.stat("isBiting") && */this.stat("energy") > healThreshholdPercent * (this.getEnergyPercent())) {
      let deltaHeal = this.stat("healPercent") * deltaTime / 1000;
      if (deltaHeal + this.stat("health") > 1) {
        deltaHeal = 1 - this.stat("health");
      }
      this.changeHealth(deltaHeal);
      this.changeEnergy(-deltaHeal * this.stat("mass") * maxEnergyPerMass)
    }
  }

  changeHealth(amount) {
    this.stats.set("health", this.stat("health") + amount);
    if (this.stat("health") <= 0) {
      this.stats.set("alive", false);
    }
    this.stats.set("health", Utils.clamp(this.stat("health"), 1, 0));
  }

  changeEnergy(amount) {
    this.stats.set("energy", this.stat("energy") + amount);

    if (this.stat("energy") <= 0) {
      this.stats.set("alive", false);
      return;
    }
  }

  grow(deltaTime) {
    let deltaEnergy = this.stat("energy") - this.stat("maxEnergy");
    let newSize = math.sqrt((deltaEnergy / (maxEnergyPerMass * math.pi)) + this.stat("size") ** 2);
    let newAdolescence = Utils.clamp(newSize / this.genes.mutableGenes.size, 1.0);
    // this clamp technically gets rid of some energy, but I dont want to do the math rn
    this.stats.set("adolescence", newAdolescence);
    Utils.clamp(this.stat("energy"), this.stat("maxEnergy"), 0)
    this.changeEnergy(-deltaEnergy);
  }

  mate(matingCreature) {
    // if (!matingCreature.stat("canMate")) { return; }
    let matingGenes = matingCreature.getGenes();
    let babyGenes = this.pregnancy.babyGenes;
    for (let i = 0; i < babyGenes.length; i++) {
      for (const [key, value] of Object.entries(babyGenes[i].mutableGenes)) {
        if (mutableGeneMaxMin[key].blendOdds && math.random() < mutableGeneMaxMin[key].blendOdds) {
          if (mutableGeneMaxMin[key].wrap) {
            babyGenes[i].mutableGenes[key] = Utils.wrapAverage([babyGenes[i].mutableGenes[key], matingGenes.mutableGenes[key]], mutableGeneMaxMin[key].max);
          } else {
            babyGenes[i].mutableGenes[key] = math.mean([babyGenes[i].mutableGenes[key], matingGenes.mutableGenes[key]])
          }
        } else if (math.pickRandom([false, true])) {
          babyGenes[i].mutableGenes[key] = matingGenes.mutableGenes[key];
        }
      }
      NeuralNetwork.cross(babyGenes[i].neuralNet, matingGenes.neuralNet);
    }
    this.extraValues.hasMated = true;
    this.extraValues.timeSince.mating = 0;
    this.setPregnancy();
    this.extraValues.matingCreature = false;
    matingCreature.processMate(this);
  }

  giveBirth(deltaTime) {
    this.pregnancy.isPregnant = true;
    this.stats.set("energy", this.stat("energy") - this.pregnancy.energyForPregnancy);
    this.extraValues.timeSince.givingBirth = 0;
    this.extraValues.hasMated = false;
    this.extraValues.matingCreature = false;
  }

  calculateEnergy(deltaTime) {
    let deltaPos = this.speed * deltaTime / 1000;
    let moveCost = moveCostMultiplier * deltaPos * this.acc / 1000 * accMultiplier * this.stat("mass");
    let rotateCost = this.stat("rotateCostMult") * math.abs(this.angularVelocity) * deltaTime / 1000;
    let metabolismCost = this.stat("metabolismCostMult") * deltaTime / 1000;
    this.changeEnergy(-(moveCost + metabolismCost + rotateCost));
    if (this.stat("health") < 1) {
      this.heal(deltaTime)
    } else if (!this.isAdult() && this.stat("energy") > this.stat("maxEnergy")) {
      this.grow(deltaTime)
    } else if (this.stat("energy") > this.pregnancy.energyPregnacyThreshold && this.stat("tryingToBirth")) {
      this.giveBirth(deltaTime)
    }
    // console.log(`moveCost: ${moveCost}\nmetabolismCost: ${metabolismCost}\nenergy: ${this.getEnergyPercent()}`)
  }

  tick(deltaTime) {
    this.processOutputs(deltaTime);
    this.calculateEnergy(deltaTime);
    this.updateStats(deltaTime);
    return this.stats;
  }
}