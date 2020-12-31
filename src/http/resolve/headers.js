const resolveHeader = (headers = []) => {
  const data = {}

  for (let i = 0, l = headers.length; i < l; i++) {
    const [key, ...value] = headers[i].split(':')

    data[key.toLowerCase().trim()] = value.join(':').trim()
  }

  return data
}

export default resolveHeader
