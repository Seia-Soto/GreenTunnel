# Seia-Soto/GreenTunnel

Bypassing DPIs.

> **Notice**
>
> This version of GreenTunnel is the fork version of the original repository.
> How to use is not same as upstream repository.

## Table of Contents

- [Credit](#Credit)
- [Usage](#Usage)
- [Development](#Development)
- [Changes](#Changes)

----

# Credit

Before starting, consider reading the original repository to understand how greentunnel works.

- [SadeghHayeri/GreenTunnel](https://github.com/SadeghHayeri/GreenTunnel)

# Usage

Install this repository first.

```bash
yarn add Seia-Soto/GreenTunnel
```

## Module

As module you can import this repository as module and can give it a JavaScript based config.

```js
import { proxy } from 'Seia-Soto/GreenTunnel'

const server = proxy.create({
  port: 8080,
  fragmentation: 64, // NOTE: fragmentation level (buffer length)
  spoofPacket: true, // NOTE: spoof pure-HTTP headers
  preventRedirect: true, // NOTE: prevent being redirected via DPI (HTTP 302 Found)
  dns: {
    type: 'https',
    options: {},
    client: undefined, // NOTE: provide your own DNS client
    cache: {
      type: 'lfu',
      options: {},
      client: undefined // NOTE: provide your own DNS cache client
    }
  }
})
  .then(server => console.log(server.address()))
```

For avoiding the server quits unexpectedly, we're providing a function.
In this case, all kind of `uncaughtException` errors will be handled by logger included in this repository. You can set `DEBUG` environment variable to print all messages from this package.

```js
import { utils } from 'Seia-Soto/GreenTunnel'

utils.indirectErrors()
```

## Components

You can see the options of each components.

### `cache`

DNS cache clients.

#### `lfu`

Enables LFU caching for DNS client.

```js
{
  max: 2048,
  maxAge: 1000 * 60 * 5
}
```

##### Refs

- https://www.npmjs.com/package/node-lfu-cache

### `dns`

DNS clients.

#### `native`

The native DNS resolver with default caching system.

```js
{
  resolvers: [
    '8.8.8.8'
  ]
}
```

##### Refs

- https://nodejs.org/api/dns.html#dns_dns_setservers_servers

#### `https`

The DNS-over-HTTPS resolver with default caching system.

```js
{
  url: 'https://cloudflare-dns.com/dns-query'
}
```

##### Refs

- https://github.com/little-core-labs/dns-over-http

# Development

The goal of current fork is making all things to be up-to-date and gaining performance.

## Environment

> Literally developed on Windows with Atom-Editor.

### Development system

- Node.JS v15 or later
- NPM v7 or later
- ESLint standard

### Target system

- Node.JS v14 LTS or later

## Scripts

### `yarn test`

Runs the server locally, on port 8080.

## Components

### Logger (`not customizable`)

I am using `debug` package as logger.
You can call default logger function from `src/utils/createLogger`.

- The content of `createLogger.js`:

```js
import debug from 'debug'
import pkg from '../../package.json'

export default domain => {
  if (domain) return debug(`${pkg.name}:${domain}`)

  return debug(pkg.name)
}
```

- Example usage:

```js
const debug = createLogger('component/function')

debug('message!')
```

### DNS Client (`opts.dns.client`)

We're providing you an option to use your own DNS client.
You can import your modules and use full advantage of self-programming.

By referring [native DNS client source code](/src/dns/native.js), you can know some resources your DNS client can use. Following is the structure of provided option object to your own DNS client.

```js
{
  options,
  cache: {
    options,
    type,
    client
  }
}
```

To initiate cache client, you need to call `opts.cache.client`.
The values will be fulfilled via `proxy.create` function automatically based on your options.
As you call the function, the correct cache client will have 3 functions by default: `get`, `set`, and `has`.
All sub functions requires `hostname` as first argument, except for function `set`: must be `set(key, value)`.
For cache clients, required sub-functions are only three functions, so they can have more sub-functions as they can.
Case by case, you may extend functionality by using `if statement`:

```js
if (opts.cache.type === 'lfu') ...
```

### DNS Cache Client (`opts.dns.cache.client`)

The basic of DNS cache client is hashmap. Most of required things for DNS cache client is also described on `DNS Client` section.
Please, refer if you need.

By referring [proxy.create source code](/src/proxy/create.js), you can know that what options are provided by default.
Following is the structure of provided option object to your own DNS cache client.

```js
{
  options,
  type,
  client: undefined
}
```

Skipping describing `opts.options`, as DNS cache client, need to have three difference function and expose it to DNS client: `get`, `set`, and `has`.
These functions are minimal requirement of DNS cache client and those are simple `key-value` hashmap system.
If your own DNS cache client already has and exposes all required functions, you can just return it without wrapper.

Let's think about the situation that your DNS cache client doesn't have some functions.
You can provide wrapper object like below:

```js
const obj = {}

return {
  get: key => obj[key],
  has: key => !(!obj[key]),
  set: (key, val) => {
    obj[key] = val
  }
}
```

### Plugins (`opts.plugins`)

> **Notice**
>
> The concept of plugins are not ready for production and may be able to hook everywhere you want.
> I am adding hook points as I update the source code.

Plugins are first introduced concept on my forked version of GreenTunnel and used to pre-hook or post-hook specific part of processing-logic.
To make changes easy as you can, plugins can be injected as you want.
Plugins are executed one by one.
So if your plugin is in lower priority (higher index in array), means that your plugin will be executed later and will receive already manipulated materials.
By default, related materials are given to plugin and plugin will pre or post process materials before my GreenTunnel process.
Plugins have one entry function called `execute` and some meta properties.
After developing plugin, you can push your plugins into right position of `opts.plugins.<hook>`.
For example, hooking `beforeInit` is easy as following if you developed a plugin for GreenTunnel (my fork):

```js
import * as myPlugin from '//somewhere-noone-knows////my-plugin'

const registerPlugin = opts => {
  opts.plugins.beforeInit = opts.plugins.beforeInit || []

  opts.plugins.beforeInit.push(myPlugin)
}
```

To develop a plugin correctly, you need to specify and expose some properties for GreenTunnel (fork) to recognize.

> **Warning**
>
> The things you need to expose can be have difference as version changes.

The basic of current plugin concept looks like:

```js
{
  execute: async (opts = {}, subject, args) => {
    console.log(args.hook) // NOTE: The name of hook point. EX) `beforeInit`

    return subject
  },
  name: 'The name of plugin'
}
```

Your plugin will receive three arguments by default. There is no expand of these argument unless [plugins/inject function](/src/plugins/inject.js) changes.
All injection is done by that function.
After your plugin processes the `subject` which your plugin need to manipulate and work with, your plugin need to return modified `subject` object as well.
The modified `subject` object will be passed to next plugin.

Now, you know what is the basic of GreenTunnel (fork) plugins and find the hook point you want to inject your code in following points.

#### beforeInit (`opts.plugins.beforeInit`)

The plugins that pushed to `opts.plugins.beforeInit` will be used to pre-process `opts` object given from user right after normalization of plugins and DNS clients array.

```js
{
  execute: async (opts = {}, subject, args) => {
    console.log(subject) // NOTE: Same as `opts` you provide when `proxy.create` function called.

    return subject
  }
}
```

- Ref: [proxy/create](/src/proxy/create)

#### afterInit (`opts.plugins.afterInit`)

The plugins that pushed to `opts.plugins.afterInit` will be used to post-process `opts` object given after normalization of plugins and things as well.
It is after that DNS client and cache clients are already initialized.

- Ref: [proxy/create](/src/proxy/create)

#### serverCreate (`opts.plugins.serverCreate`)

The plugins that pushed to `opts.plugins.serverCreate` will be used to post-process `Server` that accepts client connections.

- Ref:
  - [proxy/create](/src/proxy/create)
  - https://nodejs.org/api/net.html#net_net_createserver_options_connectionlistener

# Changes

All implemented changes will be listed here as possible.

## `1.7.5` (current)

- Fork created.

> Actually, no tag available for this release. (not a release actually)

## `1.8.0` (developing)

### Additions

- Add eslint-standard rules.
- Add options to customize DNS client and its cache client.
- Add DNS cache clients.
- Add DNS clients.
- Add HOST header obfuscation.
- Add 302 Found redirect prevention.
- Add plugin concept.
- Add `afterInit`, `beforeInit` and `serverCreate` hooking points.

### Changes

- Update ESLint package and rules.
- Update LICENSE and package.json file.
- Update packages.
- Change `ip` option to `bind`.
- Improve for loops to IL method.
- Change logging policy.

### Removals

- Remove tracking code that can track you on Google Analytics.
- Remove GUI and focus to CLI usage.
- Remove assets useless anymore.
- Remove function that setting system proxy.
- Remove things that do not affect on actual bypassing on CLI.
- Remove GitHub integrations.
- Remove useless duplicated parts in HTTP/HTTPS handler.
- Remove most of previous parts.
