# readinirc

[![NPM Version](https://img.shields.io/npm/v/readinirc.svg)](https://npmjs.org/package/readinirc)
[![NPM Downloads](https://img.shields.io/npm/dm/readinirc.svg)](https://npmjs.org/package/readinirc)
[![test](https://github.com/wesleytodd/readinirc/workflows/test/badge.svg)](https://github.com/wesleytodd/readinirc/actions?query=workflow%3ATest)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/standard/standard)

Load rc files.

Compared to other rc file loaders, this one is more focused.  It does not load from cli flags, and does not support anything other than ini format.

## Usage

```
$ npm i readinirc
```

```javascript
const rc = require('rc-ini')

rc('my-app', (err, conf, files) => {
  if (err) {
    throw err
  }
  // Files which were loaded
  console.log(files)

  // The configuration itself
  console.log(conf)
})
```

### CLI

```
$ inirc help
inirc [command] [opts]

Commands:
  inirc show [name]   print config
  inirc files [name]  print config files
  inirc               help                                                                                     [default]

Options:
  --help      Show help                                                                                        [boolean]
  --version   Show version number                                                                              [boolean]
  --cwd, -D   Directory                                                                                   [default: "."]
  --home, -h  Home                                                                          [default: "/Users/username"]
  --etc, -e   Etc                                                                                      [default: "/etc"]
```
