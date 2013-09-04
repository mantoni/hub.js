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
    if (c.children.length) {
      this.q = this.q.concat(c.children);
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
  this.children = [];
  this.siblings = [];
  this.parents  = [];
}

Node.prototype = {

  up: function (path, self) {
    if (this.name) {
      var i, l = this.parents.length;
      for (i = 0; i < l; i++) {
        this.parents[i].up(path, true);
      }
      if (self) {
        path.push(this);
      }
    }
  },

  self: function (path) {
    var i, l = this.siblings.length;
    for (i = 0; i < l; i++) {
      path.push(this.siblings[i]);
    }
  },

  down: function (path) {
    path.push(this);
    var i, l = this.children.length;
    for (i = 0; i < l; i++) {
      this.children[i].down(path);
    }
  },

  insert: function (tree, child) {
    var n, i = 0, l = this.children.length;
    if (l) {
      var name = child.name;
      var re   = child.re;
      while (i < l) {
        n = this.children[i];
        if (n.re && n.re.test(name)) {
          tree._cache[n.name].push(child);
          n.insert(tree, child);
        }
        if (re && re.test(n.name)) {
          tree._cache[n.name].insert(child, n);
          n.parents.push(child);
          child.children.push(n);
          child.parents.push(this);
          this.children[i] = child;
        }
        i++;
      }
      if (child.parents.length) {
        return;
      }
      i = 0;
    }
    child.parents.push(this);
    var cmp   = child.cmp;
    var found = false;
    while (i < l) {
      n = this.children[i];
      if (!found && cmp > n.cmp) {
        found = true;
        this.children.splice(i, 0, child);
        l++;
      }
      if (cmp !== n.cmp) {
        tree._cache[n.name].push(child);
        child.siblings.push(n);
        n.siblings.push(child);
      }
      i++;
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
        var p = this._root.children.indexOf(i.next());
        this._root.children.splice(p, 1);
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
        var q  = this._root.children.slice();
        var m  = [];
        var n;
        while (q.length) {
          n = q.shift();
          if (re.test(n.name) || n.re.test(name)) {
            m.push(n);
          }
          if (!m.length && n.children.length) {
            q = q.concat(n.children);
          }
        }
        if (m.length) {
          return iterator(m);
        }
        return iterator([n]);
      }
    }
    return new TreeIterator([], this._root.children.slice());
  },

  toString: function () {
    var s = '[object Tree]';
    var q = this._root.children.slice();
    while (q.length) {
      var n = q.shift();
      s += '\n  ' + n.name + ' = ' + n.value;
      if (n.children.length) {
        q = q.concat(n.children);
      }
    }
    return s;
  }

};

module.exports = function () {
  return new Tree();
};
