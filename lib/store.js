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

function Item(value) {
  this.value = value;
  this.next  = null;
}

Item.prototype = {

  remove: function (value) {
    if (!this.next) {
      return this;
    }
    if (this.next.value === value || this.next.value.fn === value) {
      this.next = this.next.next;
      return tail(this);
    }
    return this.next.remove(value);
  }

};


function Iterator(head) {
  this._ = head;
}

Iterator.prototype = {

  next: function () {
    this._ = this._.next;
    return this._.value;
  },

  hasNext: function () {
    return !!this._.next;
  }

};


function Store() {
  this._head = this._tail = new Item(null);
}

Store.prototype = {

  push: function (value) {
    this._tail = this._tail.next = new Item(value);
  },

  remove: function (value) {
    this._tail = this._head.remove(value);
  },

  iterator: function () {
    return new Iterator(this._head);
  },

  isEmpty: function () {
    return this._head === this._tail;
  },

  toArray: function () {
    var a = [];
    var i = this._head;
    while (i.next) {
      i = i.next;
      a.push(i.value);
    }
    return a;
  }

};

module.exports = function () {
  return new Store();
};
