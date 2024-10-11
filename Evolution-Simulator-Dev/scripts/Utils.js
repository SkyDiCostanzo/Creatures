export function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

export function clamp(number, max, min = 0) {
  // console.log(`clamp recieved: ${number}, ${max}, ${min}`)
  return Math.max(min, Math.min(number, max));
}

export function wrapAverage(arr, max) {
  let x = 0;
  let y = 0;
  arr.forEach((value) => {
    let scaledValue = value * 2 * math.pi / max;
    x += math.cos(scaledValue);
    y += math.sin(scaledValue);
  })
  return (math.atan2(y, x) + math.pi) * max / (2 * math.pi);
}

export function wrapDiff(num1, num2, max, min = 0) {
  let range = max - min;
  let diff = num1 - num2
  if ( diff > max) {
    diff -= range;
  }
  if ( diff < min) {
    diff += range;
  }
  return diff;
}

export function wrap(num, max, min = 0) {
  if (num > max) {
    return min + (num - max);
  }
  if (num < min) {
    return max + (num - min);
  }
  return num;
}

export function matrixToString(matrix) {
  // console.log(`matrixToString matrixSize: ${math.size(matrix)}`)
  let matrixSize = math.size(matrix)
  let output = ""
  for (let i = 0; i < math.subset(matrixSize, math.index(0)); i++) {
    output += "[ "
    let row = math.row(matrix, i)
    if (math.subset(matrixSize, math.index(1)) <= 1) {
      output += row
    } else { 
      for (let j = 0; j < math.subset(matrixSize, math.index(1)); j++) {
        output += math.column(row, j) + " "
      }
    }
    output += "] \n"
  }
  return output; 
}

export function colorGradient(firstColor, secondColor, percent) {
  let firstColorRGB = firstColor.toRgbArray();
  let secondColorRGB = secondColor.toRgbArray();

  let colorDiff = math.add(secondColorRGB, math.dotMultiply(-1, firstColorRGB))
  
  return math.add(firstColorRGB, math.dotMultiply(colorDiff, percent))
}

const graymult = 0.6;
export function desaturate(color, sat) {
  // let col = color.toRgbArray()
  // console.log(col)
  let gray = color.toRgbArray()[0] * 0.3086 + color.toRgbArray()[1] * 0.6094 + color.toRgbArray()[2] * 0.0820;
  
  let r = color.toRgbArray()[0] * sat + graymult * gray * (1-sat);
  let g = color.toRgbArray()[1] * sat + graymult * gray * (1-sat);
  let b = color.toRgbArray()[2] * sat + graymult * gray * (1-sat);
  // console.log(`${r}, ${g}, ${b}`)
  return new PIXI.Color([r, g, b])
}