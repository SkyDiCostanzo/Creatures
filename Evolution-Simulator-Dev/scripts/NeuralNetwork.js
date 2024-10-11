import * as Utils from "./Utils.js";
import { data, timers } from "./datas.js";

const weightMax = 4
const mutationStandardDeviationSmallness = 32
const mutationStandardDeviation = (2 * weightMax) / mutationStandardDeviationSmallness 

export class NeuralNetwork {
  constructor(parameters) {
    if (parameters.preGenerated) {
      this.weights = parameters.weights;
      this.biases = parameters.biases;
    } else {
      this.weightShapes = this.generateWeightShapes(parameters.layerSizes);
      this.weights = this.generateWeights(this.weightShapes);
      this.biases = this.generateBiases(parameters.layerSizes);
    }
    this.mutate()
    /*
    console.log(`weights: `)
    console.log(`weights raw: ${this.weights.length}`)
    this.weights.forEach(weights => {
      // console.log(`weight: ${weights}`)
      console.log(Utils.matrixToString(weights))
    })
    // */
    /*
    console.log(`biases: `)
    console.log(this.biases)
    this.biases.forEach(bias => {
      console.log(Utils.matrixToString(bias))
    })
    // */
  }

  static cross(baseNet, mateNet) {
    for (let i = 0; i < baseNet.weights.length; i++) {
      math.forEach(baseNet.weights[i], (weights, index) => {
        if (math.pickRandom[false, true]) {
          let mathIndex = math.index(index[0], index[1])
          math.subset(weights, mathIndex, math.subset(mateNet.weights[i], mathIndex));
        }
      })
    }
    for (let i = 0; i < baseNet.biases.length; i++) {
      math.forEach(baseNet.biases[i], (biases, index) => {
        if (math.pickRandom[false, true]) {
          let mathIndex = math.index(index[0], index[1])
          math.subset(biases, mathIndex, math.subset(mateNet.biases[i], mathIndex));
        }
      })
    }
  }

  getWeights() {
    return this.weights;
  }

  getBiases() {
    return this.biases;
  }

  generateWeightShapes(layerSizes) {
    let weightShapes = new Array(layerSizes.length - 1)
    for (let i = 0; i < weightShapes.length; i++) {
      weightShapes[i] = new Array(layerSizes[i+1], layerSizes[i])
    }
    return weightShapes;
  }

  generateWeights(weightShapes) {
    let weights = new Array(weightShapes.length)
    for (let i = 0; i < weights.length; i++) {
      weights[i] = math.map(math.zeros(weightShapes[i][0], weightShapes[i][1]), (value) => { 
        // return Utils.gaussianRandom() 
        return math.random(-weightMax / 2, weightMax / 2)
      })
    }
    return weights;
  }

  generateBiases(layerSizes) {
    let biases = new Array(layerSizes.length - 1)
    for (let i = 0; i < biases.length; i++) {
      // biases[i] = math.zeros(layerSizes[i+1], 1)
      biases[i] = math.map(math.zeros(layerSizes[i+1], 1), (value) => { return Utils.gaussianRandom() })
    }
    return biases;
  }

  mutate() {
    this.weights.forEach(weights => {
      math.forEach(weights, (value, index) => {
        let newValue = Utils.clamp(Utils.gaussianRandom(value, mutationStandardDeviation), weightMax, -weightMax)
        math.subset(weights, math.index(index[0], index[1]), newValue);
      })
    })
    this.biases.forEach(biases => {
      math.forEach(biases, (value, index) => {
        let newValue = Utils.clamp(Utils.gaussianRandom(value, mutationStandardDeviation), weightMax, -weightMax)
        math.subset(biases, math.index(index[0], index[1]), newValue);
      })
    })
  }

  activation(x) {
    // Piecewise Linear Unit https://arxiv.org/pdf/1809.09534.pdf
    let a = 0.1;
    let c = 0.8;

    // console.log(`input:\n${Utils.matrixToString(x)}`)
    return math.map(x, (value, index) => {
      return math.max(a * (value+c)-c, math.min(a * (value-c)+c, value))
    })
    // console.log(`output:\n${Utils.matrixToString(x)}`)
    
    /*
    // Hyperbolic Tangent
    let eToPowerDoubleX = math.exp(math.dotMultiply(2, x))
    // console.log(`hyperbolic tangent: ${eToPowerDoubleX}`)
    return math.dotMultiply(math.add(eToPowerDoubleX, -1), math.dotPow(math.add(eToPowerDoubleX, 1), -1))
    // */
    /*
    // Logistic Function
    return math.dotMultiply(1, math.dotPow(math.add(1, math.exp(math.dotMultiply(-1, x))), -1));
    // */
  }

  run(a) {
    for (let i = 0; i < this.weights.length; i++) {
      // console.log(`W[${i}]${this.weights[i]}\nW[${i}]*a${math.multiply(this.weights[i], a)}\nb[${i}]${this.biases[i]}`)
      // console.log(`pre:\n${Utils.matrixToString(a)}`)
      a = math.add(math.multiply(this.weights[i], a), this.biases[i])
      a = this.activation(a)
      // console.log(`post:\n${Utils.matrixToString(a)}`)
      // a = this.activation(math.add(math.multiply(this.weights[i], a), this.biases[i]))
    }
    return a;
  }
}