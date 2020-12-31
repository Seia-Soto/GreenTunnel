import net from 'net'
import * as cache from '../cache'
import * as dns from '../dns'
import { createLogger } from '../utils'
import handle from './handle'

const debug = createLogger('proxy/create')

const createProxy = (opts = {}) => {
  // NOTE: App;
  opts.port = opts.port || 8080
  opts.spoofPacket = opts.spoofPacket || true
  opts.preventRedirect = opts.preventRedirect || true
  opts.fragmentation = opts.fragmentation || 64
  // NOTE: DNS client;
  opts.dns = opts.dns || {}
  opts.dns.type = opts.dns.type || 'https'
  opts.dns.options = opts.dns.options || {}
  // NOTE: DNS cache;
  opts.dns.cache = opts.dns.cache || {}
  opts.dns.cache.type = opts.dns.cache.type || 'lfu'
  opts.dns.cache.options = opts.dns.cache.options || {}

  debug('initiating with opts:', opts)

  opts.dns.cache.client = opts.dns.cache.client || cache[opts.dns.cache.type] || cache.lfu
  opts.dns.client = opts.dns.client || (dns[opts.dns.type] || dns.native)(opts.dns)

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
