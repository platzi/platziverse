'use strict'

const jwt = require('jsonwebtoken')

function sign (payload, secret, callback) {
  jwt.sign(payload, secret, callback)
}

function verify (token, secret, callback) {
  jwt.verify(token, secret, callback)
}

module.exports = {
  sign,
  verify
}
