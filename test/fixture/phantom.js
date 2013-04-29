// http://stackoverflow.com/questions/14218670/why-are-null-and-undefined-of-the-type-domwindow
var toString = Object.prototype.toString;
Object.prototype.toString = function () {
  if (this === null) {
    return '[object Null]';
  }
  var value = toString.call(this);
  if (value === '[object DOMWindow]') {
    return '[object Undefined]';
  }
  return value;
}
