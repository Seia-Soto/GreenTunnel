import createLogger from './createLogger'

const debug = createLogger('error')

export default () => {
  process.on('uncaughtException', error => debug(error))
}
