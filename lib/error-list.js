/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

function ErrorList(errors) {
  this.name     = 'ErrorList';
  var sep       = '\n  - ';
  this.message  = 'Multiple listeners err\'d:' + sep + errors.join(sep);
  this.errors   = errors;
}

ErrorList.prototype = Error.prototype;

module.exports = ErrorList;
