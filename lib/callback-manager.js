/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var util = require('./util');


function CallbackManager(callback, returnValues) {
  this.count        = 0;
  this.callback     = callback;
  this.returnValues = returnValues;
}

CallbackManager.prototype.resolve = function () {
  util.invokeCallback(this.callback, this.returnValues, this.errList);
};

CallbackManager.prototype.resolveable = function (errList) {
  if (errList) {
    this.errList = this.errList ? this.errList.concat(errList) : errList;
  }
  if (this.count) {
    this.isResolveable = true;
  } else {
    this.resolve();
  }
};

CallbackManager.prototype.createCallback = function (index) {
  this.count++;
  var self = this;
  return function (err, returnValue) {
    if (err) {
      if (!self.errList) {
        self.errList = [err];
      } else {
        self.errList.push(err);
      }
    } else {
      self.returnValues[index] = returnValue;
    }
    self.count--;
    if (!self.count && self.isResolveable) {
      self.resolve();
    }
  };
};


module.exports = CallbackManager;
