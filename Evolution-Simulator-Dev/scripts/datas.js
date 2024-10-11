import { Data } from "./Data.js";
import { Timer } from "./Timer.js";

export const data = {
  avgTileFood: new Data(true),
  avgSize: new Data(true),
  avgEnergyPercent: new Data(true),
  avgPlantPreference: new Data(true),
  adultPercent: new Data(true),
  numOfCreatures: new Data(),
}

export const timers = {
  setInputs: new Timer(),
  processOutputs: new Timer(),
  calcNet: new Timer(),
  calcActiv: new Timer(),
  calcOther: new Timer(),
  mapInputs: new Timer(),
  miscInputs: new Timer(),
}
