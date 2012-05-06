var ErrorList = require('./error-list');


exports.invokeCallback = function (callback, returnValues, errList) {
  if (errList) {
    callback(errList.length === 1 ? errList[0] : new ErrorList(errList));
  } else {
    callback(null, returnValues);
  }
};
