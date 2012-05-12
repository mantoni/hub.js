function ErrorList(errors) {
  this.name     = 'ErrorList';
  var sep       = '\n  - ';
  this.message  = 'Multiple listeners err\'d:' + sep + errors.join(sep);
  this.errors   = errors;
}

ErrorList.prototype = Error.prototype;

module.exports = ErrorList;
