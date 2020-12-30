import resolveHeaders from './headers'

const resolveRequest = (packet = '') => {
  packet = packet.toString()

  const [request, payload] = packet.split('\r\n\r\n')
  const [identifier, ...headers] = request.split('\r\n')
  const [version, statusCode, ...statusMessage] = identifier.split(' ')

  if (version.split('/')[0].toUpperCase() !== 'HTTP') {
    throw new Error('Invalid HTTP method')
  }

  const http = {
    version,
    statusCode,
    statusMessage,
    payload
  }

  http.version = http.version.toUpperCase()
  http.statusMessage = http.statusMessage.join(' ').toUpperCase()
  http.headers = resolveHeaders(headers)

  return http
}

export default resolveRequest
