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
  this.parents  = [];
}

Node.prototype = {

  pushUp: function (path, self) {
    if (this.name) {
      var i, l = this.parents.length;
      for (i = 0; i < l; i++) {
        this.parents[i].pushUp(path, true);
      }
      if (self) {
        path.push(this);
      }
    }
  },

  pushDown: function (path) {
    path.push(this);
    var i, l = this.children.length;
    for (i = 0; i < l; i++) {
      this.children[i].pushDown(path);
    }
  },

  addChildren: function (children) {
    var i, l = children.length;
    for (i = 0; i < l; i++) {
      var child = children[i];
      if (this.children.indexOf(child) === -1) {
        this.children.push(child);
      }
    }
  },

  insert: function (child) {
    if (this.name) {
      child.path.push(this);
    }
    var n, i = 0, l = this.children.length;
    if (l) {
      var name = child.name;
      while (i < l) {
        n = this.children[i];
        if (n.re && n.re.test(name)) {
          n.path.push(child);
          n.insert(child);
        }
        i++;
      }
      if (child.parents.length) {
        return;
      }
      var re = child.re;
      i = 0;
      var indexes = [];
      while (i < l) {
        n = this.children[i];
        if (re && re.test(n.name)) {
          n.path.insert(child, n);
          n.parents.push(child);
          child.children.push(n);
          child.parents.push(this);
          this.children[i] = child;
          indexes.push(i);
        }
        i++;
      }
      var base = this.children[indexes[0]];
      while (indexes.length > 1) {
        var idx = indexes.pop();
        base.addChildren(this.children[idx].children);
        this.children.splice(idx, 1);
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
//      if (cmp !== n.cmp) {
//        n.path.push(child);
//        n.path.push(child);
//        n.path.insert(child, n);
//      }
      i++;
    }
    if (!found) {
      this.children.push(child);
    }
  },

  removeFromParents: function (node) {
    if (this.name) {
      var i, l = this.parents.length;
      for (i = 0; i < l; i++) {
        this.parents[i].removeFromParents(node);
      }
      this.path.remove(node);
    }
  },

  removeFromChildren: function (node) {
    this.path.remove(node);
    var i, l = this.children.length;
    for (i = 0; i < l; i++) {
      this.children[i].removeFromChildren(node);
    }
  },

  remove: function () {
    var n = this.children, i, l = n.length;
    for (i = 0; i < l; i++) {
      n[i].removeFromChildren(this);
//      var p = n[i].parents;
//      remove(p, this);
//      p.push.apply(p, this.parents);
    }
/*
      var ii, ll = this.children.length;
      for (ii = 0; ii < ll; ii++) {
        var c = this.children[ii];
        if (n[i].re.test(c.name)) {
          
        }
      }
*/
//    }
    for (n = this.parents, i = 0, l = n.length; i < l; i++) {
      n[i].removeFromParents(this);
      var c = n[i].children;
      remove(c, this);
      c.push.apply(c, this.children);
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

  set: function (name, value) {
    var node = this._cache[name];
    if (node) {
      var i = node.path.iterator();
      while (i.hasNext()) {
        var p = this._root.children.indexOf(i.next());
        this._root.children.splice(p, 1);
      }
    }
    var path = list();
    node = new Node(name, value, path);
    this._cache[name] = node;
    this._root.insert(node);
    //node.pushUp(path);
    node.pushDown(path);
  },

  remove: function (name) {
    var node = this._cache[name];
    node.remove();
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
