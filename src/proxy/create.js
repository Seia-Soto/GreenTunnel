import net from 'net'
import { createLogger } from '../utils'
import handle from './handle'

const debug = createLogger('proxy/create')

const createProxy = (opts = {}) => {
  opts.port = opts.port || 8080
  opts.fragmentation = opts.fragmentation || 128

  debug('initiating with opts:', opts)

  const server = net.createServer({ pauseOnConnect: true }, handle(opts))

  server.on('error', error => debug('got an error:', error))

  return new Promise((resolve, reject) => {
    server.listen(opts.port, () => {
      const { address, port } = server.address()

      debug('listening on', address, 'port', port)

      resolve(server)
    })
  })
}

export default createProxy
