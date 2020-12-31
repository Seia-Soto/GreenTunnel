import compileHeaders from './headers'

const compile = (response = {}) => {
  response.version = response.version || 'HTTP/1.1'
  response.statusCode = response.statusCode || 200
  response.headers = response.headers || {}
  response.payload = response.payload || ''

  let packet = ''

  packet += `${response.version} ${response.statusCode} ${response.statusMessgae}\r\n`

  packet += compileHeaders(response.headers)

  packet += '\r\n'
  packet += response.payload

  return packet
}

export default compile
