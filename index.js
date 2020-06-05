'use strict'
const os = require('os')
const path = require('path')
const fs = require('fs')
const yargs = require('yargs/yargs')
const ini = require('ini')
const extend = require('deep-extend')

module.exports = rc
function rc (_name, _opts, _cb) {
  const [opts, cb] = _processOpts(_name, _opts, _cb)
  rcFiles(opts, (err, files) => {
    if (err) {
      return cb(err)
    }
    readFiles(files, (err, conf, loadedFiles) => {
      if (err) {
        return cb(err)
      }
      cb(null, conf, loadedFiles)
    })
  })
}

module.exports.read = readFiles
function readFiles (files, cb) {
  Promise.allSettled(files.map((filename) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, (err, content) => {
        if (err) {
          return reject(err)
        }
        resolve({ filename, content })
      })
    })
  }))
    .then((results) => {
      const out = {}
      const loaded = []
      for (const { status, value } of results) {
        if (status === 'rejected') {
          continue
        }
        try {
          const conf = ini.parse(value.content.toString('utf8'))
          extend(out, conf)
        } catch (e) {
          continue
        }
        loaded.push(value.filename)
      }
      cb(null, out, loaded)
    }, (err) => cb(err))
}

module.exports.files = rcFiles
function rcFiles (_name, _opts, _cb) {
  const [opts, cb] = _processOpts(_name, _opts, _cb)
  const files = []
  if (!opts.win) {
    files.push(path.join(opts.etc, opts.name, 'config'))
    files.push(path.join(opts.etc, opts.rcFile))
  }

  if (opts.home) {
    files.push(path.join(opts.home, '.config', opts.name, 'config'))
    files.push(path.join(opts.home, '.config', opts.rcFile))
    files.push(path.join(opts.home, `.${opts.name}`, 'config'))
    files.push(path.join(opts.home, opts.dotRCFile))
  }

  findUp(opts.cwd, opts.dotRCFile, (err, file) => {
    if (!err && file) {
      files.push(path.join(path.dirname(file), `.${opts.name}`, 'config'))
      files.push(file)
    }
    cb(null, files)
  })
}

function findUp (cwd, file, cb) {
  const rel = path.join(cwd, file)
  fs.access(rel, fs.constants.R_OK, (err) => {
    if (err) {
      if (path.dirname(cwd) !== cwd) {
        return findUp(path.dirname(cwd), file, cb)
      }
      return cb()
    }
    cb(null, rel)
  })
}

function _processOpts (_name, _opts, _cb) {
  let opts = _opts || {}
  let cb = _cb
  if (typeof _name === 'object' && typeof opts === 'function') {
    cb = opts
    opts = _name
  } else if (typeof _name === 'string' && typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  opts.name = opts.name || _name
  if (typeof opts.name !== 'string') {
    throw new TypeError(`Name must be a string, saw ${typeof opts.name}`)
  }

  if (typeof cb !== 'function') {
    throw new TypeError(`Callback is required, saw ${typeof cb}`)
  }

  opts.cwd = opts.cwd || process.cwd()
  opts.home = opts.home || os.homedir()
  opts.etc = opts.etc || '/etc'
  opts.win = typeof opts.windows === 'boolean' ? opts.windows : process.platform === 'win32'
  opts.rcFile = opts.rcFile || opts.name + 'rc'
  opts.dotRCFile = '.' + opts.rcFile

  return [opts, cb]
}

module.exports.cli = function cli (opts = {}) {
  const cli = yargs()
    .usage(opts.usage || '$0 [command] [opts]')
    .command('show [name]', 'print config', (yargs) => {
      yargs.demand('name')
      cli.option('json', {
        alias: 'j',
        describe: 'JSON display'
      })
    }, (argv) => {
      rc(argv, (err, conf) => {
        if (err) return console.error(err)

        if (argv.json) {
          console.log(JSON.stringify(conf))
        } else {
          console.log(ini.stringify(conf))
        }
      })
    })
    .command('files [name]', 'print config files', (yargs) => {
      yargs.demand('name')
      cli.option('json', {
        alias: 'j',
        describe: 'JSON display'
      })
    }, (argv) => {
      rc.files(argv, (err, files) => {
        if (err) return console.error(err)

        if (argv.json) {
          console.log(JSON.stringify(files))
        } else {
          for (const f of files) console.log(f)
        }
      })
    })
    .command('$0', 'help', {}, (argv) => {
      !argv.silent && cli.showHelp()
    })

  // set cols (limits the width, otherwise it goes too wide)
  cli.wrap(Math.min(cli.terminalWidth(), 120))

  // on fail callback
  if (typeof opts.fail === 'function') {
    cli.fail(opts.fail)
  }

  // Common arguments
  cli.option('cwd', {
    alias: 'D',
    describe: 'Directory',
    default: process.cwd()
  })
  cli.option('home', {
    alias: 'h',
    describe: 'Home',
    default: os.homedir()
  })
  cli.option('etc', {
    alias: 'e',
    describe: 'Etc',
    default: '/etc'
  })

  return cli
}
