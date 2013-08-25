/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var list = require('./list');


function TreeIterator(m, q) {
  this.m = m;
  this.q = q;
}

TreeIterator.prototype = {

  next: function () {
    if (this.m.length) {
      return this.m.pop().value;
    }
    var c = this.q.shift();
    if (!c.children.isEmpty()) {
      c.children.toArray(this.q);
    }
    return c.value;
  },

  hasNext: function () {
    return !!this.q.length;
  }

};


function nameRE(name) {
  return new RegExp('^' +
      name.replace(/\./g, '\\.').
           replace(/\*\*/g, '[%\\.]+').
           replace(/\*/g, '[%]+').
           replace(/%/g, 'a-zA-Z_0-9\\-\\:\\*') + '$');
}


function Node(name, value) {
  if (name) {
    this.name  = name;
    this.value = value;
    this.re    = nameRE(name);
    this.cmp   = name.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                     .replace(/\./g, '1')
                     .replace(/\*/g, '2');
  }
  this.children = list();
}

Node.prototype = {

  insert: function (child) {
    var i = this.children.iterator(), n;
    var name = child.name;
    while (i.hasNext()) {
      n = i.next();
      if (n.re.test(name)) {
        n.insert(child);
        return;
      }
    }
    if (name.indexOf('*') !== -1) {
      var re = child.re;
      i = this.children.iterator();
      while (i.hasNext()) {
        n = i.next();
        if (re.test(n.name)) {
          if (!child.parent) {
            i.insert(child);
            child.parent = this;
          }
          n.parent = child;
          child.children.push(n);
          i.remove();
        }
      }
      if (child.parent) {
        return;
      }
    }
    child.parent = this;
    var cmp = child.cmp;
    i = this.children.iterator();
    while (i.hasNext()) {
      n = i.next();
      if (cmp > n.cmp) {
        i.insert(child);
        return;
      }
    }
    this.children.push(child);
  }

};


function Tree() {
  this._root  = new Node();
  this._cache = {};
}

function iterator(q) {
  var m = [];
  var n = q[0].parent;
  if (n) {
    while (n.parent) {
      m.push(n);
      n = n.parent;
    }
  }
  return new TreeIterator(m, q);
}

Tree.prototype = {

  set: function (name, value) {
    var n = this._cache[name];
    if (n) {
      this._root.children.remove(n);
    }
    var node = new Node(name, value);
    this._cache[name] = node;
    this._root.insert(node);
  },

  iterator: function (name) {
    if (name) {
      var n = this._cache[name];
      if (!n) {
        if (name.indexOf('*') !== -1) {
          var re = nameRE(name);
          var q  = this._root.children.toArray();
          var m  = [];
          while (q.length) {
            n = q.shift();
            if (re.test(n.name)) {
              m.push(n);
            }
            if (!m.length && !n.children.isEmpty()) {
              n.children.toArray(q);
            }
          }
          if (m.length) {
            return iterator(m);
          }
        }
      }
      return iterator([n]);
    }
    return new TreeIterator([], this._root.children.toArray());
  },

  toString: function () {
    var s = '[object Tree]';
    var q = this._root.children.toArray();
    while (q.length) {
      var n = q.shift();
      s += '\n  ' + n.name + ' = ' + n.value;
      if (!n.children.isEmpty()) {
        n.children.toArray(q);
      }
    }
    return s;
  }

};

module.exports = function () {
  return new Tree();
};
