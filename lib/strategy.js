exports.LAST = function (arr) {
  var i = arr.length - 1;
  while (i >= 0 && typeof arr[i] === 'undefined') {
    i--;
  }
  return arr[i];
};

exports.CONCAT = function (arr) {
  return arr;
};
