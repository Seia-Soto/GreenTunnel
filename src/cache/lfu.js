import lfu from 'node-lfu-cache'

export default (opts = {}) => {
  opts.max = opts.max || 1024 * 2
  opts.maxAge = opts.maxAge || 1000 * 60 * 5

  const cache = lfu(opts)

  // NOTE: There is no need to normalize methods = set, get, has;
  return cache
}
