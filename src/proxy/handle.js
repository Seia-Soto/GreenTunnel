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
      const ipPattern = /^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/i

      debug('proxying:', hostname, '/secured', secured)

      // NOTE: Connect to remote server;
      const remote = await connect({
        host: hostname,
        port: secured ? 443 : (port || 80),
        ip: ipPattern.test(hostname)
          ? undefined
          : await opts.dns.client(hostname) // NOTE: Query DNS;
      })

      // NOTE: If remote server send data to us;
      remote.on('data', buffer => {
        if (!secured && opts.preventRedirect) {
          const response = http.resolve.response(buffer)

          if (response.statusCode === '302') {
            debug('preventing redirect from DPI and sending same request again to:', hostname)

            return remote.write(data)
          }
        }

        connection.write(buffer)
      })

      if (secured) {
        if (opts.spoofPacket) {
          const request = http.resolve.request(data)

          data = http.compile.request(request, opts.spoofPacket)
        }

        // NOTE: If client trys to send data to remote;
        connection.once('data', initBuffer => {
          debug('appyling packet fragmentation:', hostname)

          for (let i = 0, l = initBuffer.length; i < l; i += opts.fragmentation) {
            remote.write(initBuffer.slice(i, i + opts.fragmentation))
          }

          connection.on('data', buffer => remote.write(buffer))
        })

        const packet = http.compile.response({
          statusMessgae: 'Connection Established'
        })

        connection.write(packet)
      } else {
        // NOTE: If client trys to send data to remote;
        connection.on('data', buffer => {
          const request = http.resolve.request(buffer)

          delete request.headers['proxy-connection']

          buffer = http.compile.request(request, opts.spoofPacket)

          remote.write(buffer)
        })

        const request = http.resolve.request(data)

        delete request.headers['proxy-connection']

        data = http.compile.request(request, opts.spoofPacket)

        for (let i = 0, l = data.length; i < l; i += opts.fragmentation / 2) {
          remote.write(data.slice(i, i + opts.fragmentation / 2))
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
