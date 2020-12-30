import { Resolver } from 'dns'
import { createLogger } from '../utils'

const debug = createLogger('dns/native')

export default (opts = {}) => {
  const { options, cache } = opts
  const resolver = new Resolver()
  const store = cache.client(cache.options)

  if (options.resolvers) resolver.setServers(options.resolvers)

  return hostname => {
    debug('try hitting cache for:', hostname)

    if (store.has(hostname)) return store.get(hostname)

    return new Promise((resolve, reject) => {
      debug('querying dns:', hostname)

      resolver.resolve(hostname, (error, addresses) => {
        if (error) debug('error while querying', hostname, '>', error)

        store.set(hostname, addresses[0])

        resolve(hostname)
      })
    })
  }
}
