export default text => text
  .split('')
  .map(char => (Math.random() >= 0.5) ? char.toUpperCase() : char.toLowerCase())
  .join('')
