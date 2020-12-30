import { proxy, utils } from '../src'

const init = async () => {
  utils.indirectErrors()

  await proxy.create()
}

init()
