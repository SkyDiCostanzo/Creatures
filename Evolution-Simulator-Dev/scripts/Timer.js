export class Timer {
  constructor() {
    this.time = Date.now();
    this.offset = 0;
  }

  getTime() {
    return this.offset + Date.now() - this.time;
  }

  reset() {
    this.time = Date.now();
    this.offset = 0;
  }

  pause() {
    this.offset = Date.now() - this.time;
  }

  start() {
    this.time = Date.now() - this.offset;
    this.offset = 0;
  }
}