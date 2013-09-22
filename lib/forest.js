/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var list = require('./list');

function remove(arr, obj) {
  var i = arr.indexOf(obj);
  if (i !== -1) {
    arr.splice(i, 1);
  }
}

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

function Node(name, value, path) {
  if (name) {
    this.name  = name;
    this.value = value;
    this.path  = path;
    this.re    = name.indexOf('*') === -1 ? null : nameRE(name);
    this.cmp   = name.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                     .replace(/\./g, '1')
                     .replace(/\*/g, '2');
  }
  this.children = [];
}

Node.prototype = {

  pushDown: function (path) {
    path.push(this);
    var i, l = this.children.length;
    for (i = 0; i < l; i++) {
      this.children[i].pushDown(path);
    }
  },

  addToPath: function (node) {
    var i = this.path.iterator();
    while (i.hasNext()) {
      if (node.cmp > i.next().cmp) {
        i.insert(node);
        return;
      }
    }
    this.path.push(node);
  },

  addToChildPaths: function (node) {
    this.addToPath(node);
    var j, l = this.children.length;
    for (j = 0; j < l; j++) {
      this.children[j].addToChildPaths(node);
    }
  },

  insert: function (child) {
    if (this.name) {
      child.path.push(this);
    }
    var n, i = 0, l = this.children.length;
    if (l) {
      var inserted = false;
      var name     = child.name;
      while (i < l) {
        n = this.children[i];
        if (n.re && n.re.test(name)) {
          n.addToPath(child);
          n.insert(child);
          inserted = true;
        }
        i++;
      }
      if (inserted) {
        return;
      }
      var re = child.re;
      i = 0;
      while (i < l) {
        n = this.children[i];
        if (re && re.test(n.name)) {
          child.children.push(n);
          this.children[i] = child;
          n.addToChildPaths(child);
          inserted = true;
        }
        i++;
      }
      if (inserted) {
        return;
      }
      i = 0;
    }
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
        n.path.push(child);
        child.path.push(n);
      }
      i++;
    }
    if (!found) {
      this.children.push(child);
    }
  },

  removeFromChildPaths: function (node) {
    this.path.remove(node);
    var i, l = this.children.length;
    for (i = 0; i < l; i++) {
      this.children[i].removeFromChildPaths(node);
    }
  },

  remove: function (child, depth) {
    var c = this.children, i = c.length, name = child.name;
    while (--i >= 0) {
      var n = c[i];
      if (n === child) {
        var cc = child.children, j = cc.length;
        while (--j >= 0) {
          cc[j].removeFromChildPaths(child);
          if (cc[j].path.size() > depth) {
            cc.splice(j, 1);
          }
        }
        c.splice.apply(c, [i, 1].concat(cc));
      } else {
        n.path.remove(child);
        if (n.re && n.re.test(name)) {
          n.remove(child, depth + 1);
        }
      }
    }
  }

};


function iterator(q) {
  var m = [];
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

  add: function (name, value) {
    var node = this._cache[name];
    if (node) {
      node.value = value;
    } else {
      var path = list();
      node = new Node(name, value, path);
      this._cache[name] = node;
      this._root.insert(node);
      node.pushDown(path);
    }
  },

  remove: function (name) {
    var node = this._cache[name];
    this._root.remove(node, 1);
    delete this._cache[name];
  },

  iterator: function (name) {
    if (name) {
      var node = this._cache[name];
      if (node) {
        return new PathIterator(node.path.iterator());
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
        if (n) {
          return iterator([n]);
        }
        return new TreeIterator([], []);
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
