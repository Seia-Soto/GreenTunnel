import * as http from '../http'
import { connect } from '../socket'
import { createLogger } from '../utils'

const debug = createLogger('proxy/handle')

export default (opts = {}) => {
  return connection => {
    connection.resume()

    connection.once('data', async data => {
      // NOTE: Pause the request to intercept;
      connection.pause()

      // NOTE: Convert buffers to string;
      const serialized = data.toString()
      // NOTE: Get the header of packet;
      const [method, path, version] = serialized.split('\r\n')[0].split(' ')
      // NOTE: Determine if the packet is HTTPS;
      const secured = method.toUpperCase() === 'CONNECT'

      // NOTE: Check if the request is valid;
      const valid =
        (http.methods.includes(method)) &&
        (version.split('/')[0].toUpperCase() === 'HTTP')
      if (!valid) return

      // NOTE: Prepare connection;
      const { hostname, port } = new URL(
        secured
          ? `https://${path}`
          : path
      )

      // NOTE: Validate domain;
      if (hostname.indexOf('.') < 0) return

      debug('proxying:', hostname, port)

      // NOTE: Connect to remote server;
      const remote = await connect({
        host: hostname,
        port: secured ? 443 : (port || 80)
      })

      // NOTE: If remote server send data to us;
      remote.on('data', buffer => {
        try {
          // NOTE: Give data to client without fragmentation;
          connection.write(buffer)
        } catch (error) {
          debug('error while receiving data:', error)
        }
      })

      // NOTE: If client trys to send data to remote;
      if (secured) {
        // NOTE: Apply fragmentation on initial HTTPS connection;
        connection.once('data', initBuffer => {
          debug('appyling packet fragmentation:', hostname)

          for (let i = 0, l = initBuffer.length; i < l; i += opts.fragmentation) {
            try {
              remote.write(initBuffer.slice(i, i + opts.fragmentation))
            } catch (error) {
              debug('error while sending data:', error)
            }
          }

          connection.on('data', buffer => remote.write(buffer))
        })
      } else {
        connection.on('data', buffer => {
          // NOTE: Remove 'proxy-connection' header;
          debug('removing proxy headers')

          const request = http.resolve.request(buffer)

          delete request.headers['proxy-connection']

          buffer = http.compile.request(request)

          remote.write(buffer)
        })
      }

      if (secured) {
        debug('sending connection established signal of:', hostname)

        try {
          const packet = http.compile.response({
            statusMessgae: 'Connection Established'
          })

          connection.write(packet)
        } catch (error) {
          console.error(error)
        }
      }

      // NOTE: Handle closings;
      const closeAll = () => {
        connection.end()
        remote.end()
      }

      connection.on('end', closeAll)
      connection.on('error', closeAll)
      remote.on('end', closeAll)
      remote.on('error', closeAll)

      connection.resume()
    })
  }
}
