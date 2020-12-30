import resolveHeaders from './headers'

const resolveRequest = (packet = '') => {
  packet = packet.toString()

  const [request, payload] = packet.split('\r\n\r\n')
  const [identifier, ...headers] = request.split('\r\n')
  const [method, path, version] = identifier.split(' ')

  if (version.split('/')[0].toUpperCase() !== 'HTTP') {
    throw new Error('Invalid HTTP method')
  }

  const http = {
    version,
    path,
    method,
    payload
  }

  http.version = http.version.toUpperCase()
  http.method = http.method.toUpperCase()
  http.headers = resolveHeaders(headers)

  return http
}

export default resolveRequest
