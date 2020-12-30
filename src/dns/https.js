import doh from 'dns-over-http'
import { createLogger } from '../utils'

const debug = createLogger('dns/https')

export default (opts = {}) => {
  const { options, cache } = opts

  options.url = options.url || 'https://cloudflare-dns.com/dns-query'

  const store = cache.client(cache.options)

  return hostname => {
    debug('try hitting cache for:', hostname)

    if (store.has(hostname)) return store.get(hostname)

    return new Promise((resolve, reject) => {
      debug('querying dns:', hostname)

      doh.query(options, [{ type: 'A', name: hostname }], (error, results) => {
        if (error) debug('error while querying', hostname, '>', error)

        const address = results.answers[0].data

        store.set(hostname, address)

        resolve(address)
      })
    })
  }
}
