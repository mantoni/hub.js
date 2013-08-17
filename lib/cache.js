/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var list = require('./list');


function CacheIterator(i) {
  this.i  = i;
  this.ii = null;
}

CacheIterator.prototype = {

  hasNext: function () {
    if (this.ii && this.ii.hasNext()) {
      return true;
    }
    if (this.i.hasNext()) {
      this.ii = this.i.next().iterator();
      return this.ii.hasNext();
    }
    return false;
  },

  next: function () {
    return this.ii.next();
  }

};

function Cache() {
  this._list = list();
}

Cache.prototype = {

  push: function (list) {
    this._list.push(list);
  },

  remove: function (list) {
    this._list.remove(list);
  },

  removeAll: function () {
    var i = this._list.iterator();
    while (i.hasNext()) {
      i.next().removeAll();
    }
    this._list.removeAll();
  },

  iterator: function () {
    return new CacheIterator(this._list.iterator());
  },

  isEmpty: function () {
    return this._list.isEmpty();
  },

  toArray: function () {
    var a = [];
    var i = this._list.iterator();
    while (i.hasNext()) {
      a = a.concat(i.next().toArray());
    }
    return a;
  }

};

module.exports = function () {
  return new Cache();
};
