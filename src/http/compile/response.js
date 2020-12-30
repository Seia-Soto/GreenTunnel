const compile = (response = {}) => {
  response.version = response.version || 'HTTP/1.1'
  response.statusCode = response.statusCode || 200
  response.headers = response.headers || {}
  response.payload = response.payload || ''

  let packet = ''

  packet += `${response.version} ${response.statusCode} ${response.statusMessgae}\r\n`

  const headers = Object.keys(response.headers)

  for (let i = 0, l = headers.length; i < l; i++) {
    const header = headers[i]

    packet += `${header}: ${response.headers[header]}\r\n`
  }

  packet += '\r\n'
  packet += response.payload

  return packet
}

export default compile
