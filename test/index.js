'use strict'
const { suite, test, beforeEach } = require('mocha')
const assert = require('assert')
const path = require('path')
const fs = require('fs-extra')
const pkg = require('../package.json')
const rc = require('..')

const FIX = path.join(__dirname, 'fixtures')
const TMP = path.join(__dirname, '__tmp')
const HOME = path.join(TMP, 'home')
const ETC = path.join(TMP, 'etc')
const NAME = 'inirctest'

suite(pkg.name, () => {
  beforeEach(async () => {
    try {
      await fs.remove(TMP)
    } catch (e) {}
  })
  test('name is required', () => {
    assert.throws(() => {
      rc()
    })
  })
  test('callback is required', () => {
    assert.throws(() => {
      rc(NAME)
    })
  })
  test('pass name in options', (cb) => {
    assert.throws(() => {
      rc({ name: NAME })
    })
    assert.doesNotThrow(() => {
      rc({ name: NAME }, cb)
    })
  })

  test('find global files', (cb) => {
    rc.files({
      name: NAME,
      cwd: TMP,
      home: HOME,
      etc: ETC
    }, (err, files) => {
      if (err) {
        return cb(err)
      }
      assert.deepStrictEqual(files, [
        path.join(TMP, 'etc', NAME, 'config'),
        path.join(TMP, 'etc', `${NAME}rc`),
        path.join(TMP, 'home', '.config', NAME, 'config'),
        path.join(TMP, 'home', '.config', `${NAME}rc`),
        path.join(TMP, 'home', `.${NAME}`, 'config'),
        path.join(TMP, 'home', `.${NAME}rc`)
      ])
      cb()
    })
  })

  test('find global and local files', (cb) => {
    fs.copy(path.join(FIX, 'all'), TMP, {
      recursive: true
    }, (err) => {
      if (err) {
        return cb(err)
      }
      rc.files({
        name: NAME,
        cwd: TMP,
        home: HOME,
        etc: ETC
      }, (err, files) => {
        if (err) {
          return cb(err)
        }
        assert.deepStrictEqual(files, [
          path.join(TMP, 'etc', NAME, 'config'),
          path.join(TMP, 'etc', `${NAME}rc`),
          path.join(TMP, 'home', '.config', NAME, 'config'),
          path.join(TMP, 'home', '.config', `${NAME}rc`),
          path.join(TMP, 'home', `.${NAME}`, 'config'),
          path.join(TMP, 'home', `.${NAME}rc`),
          path.join(TMP, `.${NAME}`, 'config'),
          path.join(TMP, `.${NAME}rc`)
        ])
        cb()
      })
    })
  })

  test('read local rc files', (cb) => {
    fs.copy(path.join(FIX, 'localonly'), TMP, {
      recursive: true
    }, (err) => {
      if (err) {
        return cb(err)
      }
      rc.read([
        path.join(TMP, `.${NAME}rc`)
      ], (err, conf) => {
        if (err) {
          return cb(err)
        }
        assert.deepStrictEqual(conf, {
          foo: 'bar'
        })
        cb()
      })
    })
  })

  test('read all rc files', (cb) => {
    fs.copy(path.join(FIX, 'all'), TMP, {
      recursive: true
    }, (err) => {
      if (err) {
        return cb(err)
      }
      rc({
        name: NAME,
        cwd: TMP,
        home: HOME,
        etc: ETC
      }, (err, conf) => {
        if (err) {
          return cb(err)
        }
        assert.deepStrictEqual(conf, {
          etc: { config: true, rc: true },
          home: { config: true, configrc: true, rc: true },
          config: true,
          rc: true
        })
        cb()
      })
    })
  })
})
