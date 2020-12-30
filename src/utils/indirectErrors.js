export default () => {
  process.on('uncaughtException', error => console.error(error))
}
