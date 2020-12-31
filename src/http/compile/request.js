import compileHeaders from './headers'

const compile = (request = {}, spoof) => {
  request.version = request.version || 'HTTP/1.1'
  request.path = request.path || '/'
  request.method = request.method || 'GET'
  request.headers = request.headers || {}
  request.payload = request.payload || ''

  let packet = ''

  packet += request.method.toUpperCase()

  if (spoof) packet += '    '

  packet += ` ${request.path} ${request.version}\r\n`

  packet += compileHeaders(request.headers, spoof)

  packet += '\r\n'
  packet += request.payload

  return packet
}

export default compile
