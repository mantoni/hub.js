/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

function tail(item) {
  return item.next ? tail(item.next) : item;
}

function Item(value, next, prev) {
  this.value = value;
  this.next  = next;
  this.prev  = prev;
}

Item.prototype = {

  removeAll: function () {
    if (this.next) {
      this.next.removeAll();
      this.next = null;
    }
  }

};


function Iterator(list) {
  this._list = list;
  this._item = list._head;
}

Iterator.prototype = {

  next: function () {
    this._item = this._item.next;
    return this._item.value;
  },

  hasNext: function () {
    return !!this._item.next;
  },

  insert: function (value) {
    var c = this._item;
    var i = new Item(value, c, c.prev);
    c.prev.next = i;
    c.prev = i;
    this._list.length++;
  },

  remove: function () {
    var c = this._item;
    c.prev.next = c.next;
    if (c.next) {
      c.next.prev = c.prev;
    }
    if (this._list._tail === c) {
      this._list._tail = c.prev;
    }
    this._item = c.prev;
    this._list.length--;
  }

};


function List() {
  this._head  = this._tail = new Item(null, null, null);
  this.length = 0;
}

List.prototype = {

  push: function (value) {
    this._tail = this._tail.next = new Item(value, null, this._tail);
    this.length++;
  },

  insert: function (value, before) {
    var i = new Iterator(this);
    while (i.hasNext()) {
      var v = i.next();
      if (v === before) {
        i.insert(value);
        return;
      }
    }
  },

  remove: function (value) {
    var i = new Iterator(this);
    while (i.hasNext()) {
      var v = i.next();
      if (v === value || v.fn === value) {
        i.remove();
        return;
      }
    }
  },

  removeAll: function () {
    this._head.removeAll();
    this._tail  = this._head;
    this.length = 0;
  },

  iterator: function () {
    return new Iterator(this);
  },

  isEmpty: function () {
    return !this._head.next;
  },

  toArray: function (a) {
    a = a || [];
    var i = this._head;
    while (i.next) {
      i = i.next;
      a.push(i.value);
    }
    return a;
  }

};

module.exports = function () {
  return new List();
};
