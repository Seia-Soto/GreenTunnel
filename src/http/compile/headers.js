import * as obfuscate from '../../obfuscate'

const compileHeaders = (headers = {}, spoof) => {
  let data = ''

  const names = Object.keys(headers)

  for (let i = 0, l = names.length; i < l; i++) {
    const header = names[i]

    if (spoof) {
      data += `${obfuscate.string(header)}:${obfuscate.string(headers[header])}\r\n`
    } else {
      data += `${header}: ${headers[header]}\r\n`
    }
  }

  return data
}

export default compileHeaders
