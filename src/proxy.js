import net from 'net'
import handleRequest from './handlers/request'
import DNSOverTLS from './dns/tls'
import DNSOverHTTPS from './dns/https'
import config from './config'
import getLogger from './logger'

const logger = getLogger('proxy')

export default class Proxy {
  constructor (customConfig) {
    this.config = { ...config, ...customConfig }
    this.server = undefined
    this.initDNS()
  }

  initDNS () {
    this.dns = this.config.dns.type === 'https'
      ? new DNSOverHTTPS(this.config.dns.server)
      : new DNSOverTLS(this.config.dns.server)
  }

  async start (options = {}) {
    this.server = net.createServer({ pauseOnConnect: true }, clientSocket => {
      handleRequest(clientSocket, this).catch(err => {
        logger.debug(String(err))
      })
    })

    this.server.on('error', err => {
      logger.error(err.toString())
    })

    this.server.on('close', () => {
      logger.debug('server closed')
    })

    await new Promise(resolve => {
      this.server.listen(this.config.port, this.config.ip, () => resolve())
    })

    const { address, port } = this.server.address()
    logger.debug(`server listen on ${address} port ${port}`)
  }

  async stop () {
    if (this.server) {
      this.server.close()
    }
  }
}
