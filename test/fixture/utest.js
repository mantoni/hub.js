var test = require('utest');
test.Reporter = test.ConsoleReporter;

// Not shimed by Browserify:
process.exit = function () {};
