const compileHeaders = (headers = {}) => {
  let data = ''

  const names = Object.keys(headers)

  for (let i = 0, l = headers.length; i < l; i++) {
    const header = names[i]

    data += `${header}: ${headers[header]}\r\n`
  }

  return data
}

export default compileHeaders
