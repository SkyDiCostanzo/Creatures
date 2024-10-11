export class Data {
  constructor(isAverage = false) {
    this.data = [];
    this.datumSum = 0;
    this.datumNum = 0;
    this.isAverage = isAverage;
  }

  add(value) {
    this.datumSum += value;
    this.datumNum++;
  }

  remove(value) {
    this.datumSum -= value;
    this.datumNum--;
  }

  getLatest() {
    return this.data[this.data.length - 1];
  }

  tick() {
    if (this.isAverage) {
      this.data.push(this.datumSum / this.datumNum) 
    } else {
      this.data.push(this.datumSum)
    }
    this.datumSum = 0;
    this.datumNum = 0;
  }
}