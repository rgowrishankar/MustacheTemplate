var assert = require('chai').assert;
var HandlebarHelper = require('../src/handlebar-helpers');
describe('handlebar-helper', function () {
    it('should correctly say that 40 > 30 using gt', function () {
        ret = HandlebarHelper.gt(40, 30)
        assert.equal(ret, true, '40 is greater than 30)');
        ret = HandlebarHelper.gt(30, 40)
        assert.equal(ret, false, '30 is not greater than 40)');
    });
    it('should correctly say that 30 < 40 using lt', function () {
        ret = HandlebarHelper.lt(30, 40)
        assert.equal(ret, true, '30 is less than 40)');
        ret = HandlebarHelper.lt(40, 30)
        assert.equal(ret, false, '40 is not less than 30)');
    });
    it('should correctly say that 30 = 30 using eq and ne', function () {
        ret = HandlebarHelper.eq(30, 30)
        assert.equal(ret, true, '30 is equal to 30)');
        ret = HandlebarHelper.ne(30, 30)
        assert.equal(ret, false, '30 is not ne 30)');
    });
    it('should correctly say that 40 != 30 using eq and ne', function () {
        ret = HandlebarHelper.eq(40, 30)
        assert.equal(ret, false, '40 is not equal to 30)');
        ret = HandlebarHelper.ne(40, 30)
        assert.equal(ret, true, '40 is ne 30)');
    });
    it('should correctly say that 30 >= 30 using gte', function () {
        ret = HandlebarHelper.gte(30, 30)
        assert.equal(ret, true, '30 is greater than or equal to 30)');
    });
    it('should correctly say that 30 <= 30 using lte', function () {
        ret = HandlebarHelper.lte(30, 30)
        assert.equal(ret, true, '30 is less than or equal to 30)');
    });
    it('should correctly say that 40 > 30 using gte', function () {
        ret = HandlebarHelper.gt(40, 30)
        assert.equal(ret, true, '40 is greater than 30)');
        ret = HandlebarHelper.gt(30, 40)
        assert.equal(ret, false, '30 is not greater than 40)');
    });
    it('should correctly say that 30 < 40 using lte', function () {
        ret = HandlebarHelper.lt(30, 40)
        assert.equal(ret, true, '30 is less than 40)');
        ret = HandlebarHelper.lt(40, 30)
        assert.equal(ret, false, '40 is not less than 30)');
    });
    it('should correctly split ip:port when delimiter is :', function () {
        ret = HandlebarHelper.split("10.10.10.10:400", ":")
        assert.equal('10.10.10.10', ret[0], 'ip address is 10.10.10.10')
        assert.equal('400', ret[1], 'port is 400')
    });
    it('should not correctly split ip:port when delimiter is empty', function () {
        ret = HandlebarHelper.split("10.10.10.10:400", "")
        assert.equal(0, ret.length, 'there is no split')
    });
    it('should not correctly split when delimiter is not string or data is not string', function () {
        ret = HandlebarHelper.split("10.10.10.10:400", 10)
        assert.equal(0, ret.length, 'there is no split')
        ret = HandlebarHelper.split(1000, "")
        assert.equal(0, ret.length, 'there is no split')
    });
});
