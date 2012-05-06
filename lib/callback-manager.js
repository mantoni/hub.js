var ErrorList = require('./error-list');


function CallbackManager(callback, values) {
  this.count    = 0;
  this.callback = callback;
  this.values   = values;
}

CallbackManager.prototype.resolve = function () {
  if (this.errList) {
    if (this.errList.length === 1) {
      this.callback(this.errList[0]);
    } else {
      this.callback(new ErrorList(this.errList));
    }
  } else {
    this.callback(null, this.values);
  }
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
  return function (err, value) {
    if (err) {
      if (!self.errList) {
        self.errList = [err];
      } else {
        self.errList.push(err);
      }
    } else {
      self.values[index] = value;
    }
    self.count--;
    if (!self.count && self.isResolveable) {
      self.resolve();
    }
  };
};


module.exports = CallbackManager;
