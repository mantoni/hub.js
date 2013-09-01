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
    this.re    = name.indexOf('*') === -1 ? null : nameRE(name);
    this.cmp   = name.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                     .replace(/\./g, '1')
                     .replace(/\*/g, '2');
  }
  this.children = list();
  this.siblings = list();
  this.parents  = list();
}

Node.prototype = {

  up: function (path, self) {
    if (this.name) {
      var i = this.parents.iterator();
      while (i.hasNext()) {
        i.next().up(path, true);
      }
      if (self) {
        path.push(this);
      }
    }
  },

  self: function (path) {
    var i = this.siblings.iterator();
    while (i.hasNext()) {
      path.push(i.next());
    }
  },

  down: function (path) {
    path.push(this);
    var i = this.children.iterator();
    while (i.hasNext()) {
      i.next().down(path);
    }
  },

  insert: function (tree, child) {
    var n, i;
    if (!this.children.isEmpty()) {
      var name = child.name;
      var re   = child.re;
      i = this.children.iterator();
      while (i.hasNext()) {
        n = i.next();
        if (n.re && n.re.test(name)) {
          tree._cache[n.name].push(child);
          n.insert(tree, child);
        }
        if (re && re.test(n.name)) {
          tree._cache[n.name].insert(child, n);
          i.insert(child);
          n.parents.remove(this);
          n.parents.push(child);
          child.children.push(n);
          i.remove();
          child.parents.push(this);
        }
      }
      if (!child.parents.isEmpty()) {
        return;
      }
    }
    child.parents.push(this);
    var cmp   = child.cmp;
    var found = false;
    i = this.children.iterator();
    while (i.hasNext()) {
      n = i.next();
      if (!found && cmp > n.cmp) {
        found = true;
        i.insert(child);
      }
      if (cmp !== n.cmp) {
        tree._cache[n.name].push(child);
        child.siblings.push(n);
        n.siblings.push(child);
      }
    }
    if (!found) {
      this.children.push(child);
    }
  }

};


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


function PathIterator(i) {
  this._i = i;
}
PathIterator.prototype = {

  hasNext: function () {
    return this._i.hasNext();
  },

  next: function () {
    return this._i.next().value;
  }

};


function Tree() {
  this._root  = new Node();
  this._cache = {};
}

Tree.prototype = {

  set: function (name, value) {
    var c = this._cache[name];
    if (c) {
      var i = c.iterator();
      while (i.hasNext()) {
        this._root.children.remove(i.next());
      }
    }
    var node = new Node(name, value);
    var path = list();
    this._cache[name] = path;
    this._root.insert(this, node);
    node.up(path);
    node.self(path);
    node.down(path);
  },

  iterator: function (name) {
    if (name) {
      var path = this._cache[name];
      if (path) {
        return new PathIterator(path.iterator());
      }
      if (name.indexOf('*') !== -1) {
        var re = nameRE(name);
        var q  = this._root.children.toArray();
        var m  = [];
        var n;
        while (q.length) {
          n = q.shift();
          if (re.test(n.name) || n.re.test(name)) {
            m.push(n);
          }
          if (!m.length && !n.children.isEmpty()) {
            n.children.toArray(q);
          }
        }
        if (m.length) {
          return iterator(m);
        }
        return iterator([n]);
      }
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
