var assert = require('chai').assert;

describe('logger', function () {
  afterEach(function () {
  });

  after (function(){
    delete require.cache[require.resolve('../src/logger')];
  });

  describe('#createLogger()', function () {
    it('should create logger with specified env var LOG_LEVEL=warn (40)', function () {
      process.env.LOG_LEVEL = 'warn';
      var log = require('../src/logger').createLogger();
      console.log(log.level);
      assert.equal(log.level, 'warn', 'should be at log level warn(40)');
    });

    it('should create logger with log level info(30) when no LOG_LEVEL specified', function () {
      delete process.env.LOG_LEVEL;
      var log = require('../src/logger').createLogger();
      assert.equal(log.level, 'info', 'should be at log level info(30)');
    });

    it('should create logger with log level info(30) when unknown LOG_LEVEL specified', function () {
      process.env.LOG_LEVEL = 'unknownLevelName';
      var log = require('../src/logger').createLogger();
      assert.equal(log.level, 'info', 'should be at log level info(30)');
    });
  });
});
