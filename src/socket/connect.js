import net from 'net'

const connect = (opts = {}) => {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(opts, () => resolve(socket))
  })
}

export default connect
