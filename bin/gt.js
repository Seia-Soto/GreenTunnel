#!/usr/bin/env node

const clear = require('clear')
const debug = require('debug')
const yargs = require('yargs')
const { Proxy, config, getLogger } = require('../src/index.cjs')

const logger = getLogger('cli')

const { argv } = yargs
  .usage('Usage: green-tunnel [options]')
  .usage('Usage: gt [options]')
  .alias('help', 'h')
  .alias('version', 'V')

  .option('ip', {
    type: 'string',
    describe: 'ip address to bind proxy server',
    default: '127.0.0.1'
  })
  .option('port', {
    type: 'number',
    describe: 'port address to bind proxy server',
    default: config.port
  })
  .option('https-only', {
    type: 'boolean',
    describe: 'Block insecure HTTP requests',
    default: config.httpsOnly
  })
  .option('dns-type', {
    type: 'string',
    choices: ['https', 'tls'],
    default: config.dns.type
  })
  .option('dns-server', {
    type: 'string',
    default: config.dns.server
  })
  .option('silent', {
    alias: 's',
    type: 'boolean',
    describe: 'run in silent mode',
    default: false
  })
  .option('verbose', {
    alias: 'v',
    type: 'string',
    describe: 'debug mode',
    default: ''
  })

  .example('$0')
  .example('$0 --ip 127.0.0.1 --port 8000')
  .example('$0 --dns-server https://doh.securedns.eu/dns-query')

async function main () {
  if (argv.verbose) {
    debug.enable(argv.verbose)
  }

  const proxy = new Proxy({
    ip: argv.ip,
    port: parseInt(argv.port, 10),
    httpsOnly: argv['https-only'],
    dns: {
      type: argv['dns-type'],
      server: argv['dns-server']
    },
    source: 'CLI'
  })

  const exitTrap = async () => {
    logger.debug('Caught interrupt signal')
    await proxy.stop()
    logger.debug('Successfully Closed!')

    if (!argv.silent) {
      clear()
    }

    process.exit(0)
  }

  const errorTrap = error => {
    logger.error(error)
  }

  process.on('SIGINT', exitTrap)
  process.on('unhandledRejection', errorTrap)
  process.on('uncaughtException', errorTrap)

  await proxy.start()

  if (!argv.silent && !argv.verbose) {
    clear()
  }
}

main()
  .catch(logger.error)
