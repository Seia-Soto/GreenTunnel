import { createLogger } from '../utils'

const debug = createLogger('plugins/inject')

const injectPlugins = async (plugins, subject, args) => {
  debug('injecting', plugins.length, 'plugins to', args.hook)

  for (let i = 0, l = plugins.length; i < l; i++) {
    const plugin = plugins[i]

    debug('hooking', args.hook, 'with plugin:', plugin.name)

    subject = await plugin.entry.execute(plugin.opts, subject, args)
  }

  return subject
}

export default injectPlugins
