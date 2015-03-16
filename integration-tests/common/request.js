var assert = require('assert');
var utils = require('./utils');
var path = require('./path');

var request = {

    context: null,

    expectations: null,

    trueExpectations: null,

    falseExpectations: null,

    $new: function (path, action) {
        this.expectations = [];
        this.trueExpectations = [];
        this.falseExpectations = [];

        this.context = {
            action: action,
            path: path
        };

        return this;
    },

    create: function (path) {
        return this.$new(path, 'create');
    },

    get: function (path) {
        return this.$new(path, 'get');
    },

    update: function (path) {
        return this.$new(path, 'update');
    },

    delete: function (path) {
        return this.$new(path, 'delete');
    },

    params: function (params) {
        this.context.params = params;
        return this;
    },

    query: function () {
        var args = Array.prototype.slice.call(arguments);
        this.context.params.query = path.query.apply(path.query, args);
        return this;
    },

    expect: function (expected) {
        this.expectations.push(expected);
        return this;
    },

    expectTrue: function (expected) {
        this.trueExpectations.push(expected);
        return this;
    },

    expectFalse: function (expected) {
        this.falseExpectations.push(expected);
        return this;
    },

    expectError: function (error, message) {
        this.context.expectError = {
            error: error
        };
        if (message) {
            this.context.expectError.message = message;
        }
        return this;
    },

    send: function (done) {
        var self = this;
        var ctx = this.context;
        var runner = utils[ctx.action];
        runner.call(utils, ctx.path, ctx.params, function (err, result) {

            if (err) {
                if (ctx.expectError) {
                    err.error = err.httpStatus; // TODO: Use 'error' instead of 'httpStatus'
                    utils.matches(err, ctx.expectError);
                    return done(null, err);
                } else {
                    return done (err);
                }
            }

            assert.strictEqual(!(!err), false, 'No error');
            self.expectations.forEach(function (expectation) {
                utils.matches(result, expectation);
            });

            self.trueExpectations.forEach(function (expectation) {
                if (typeof (expectation) !== 'function') {
                    return;
                }
                assert.strictEqual(expectation(result), true, 'Expression should return \'true\'');
            });

            self.falseExpectations.forEach(function (expectation) {
                if (typeof (expectation) !== 'function') {
                    return;
                }
                assert.strictEqual(expectation(result), false, 'Expression should return \'false\'');
            });
            done(null, result);
        });
    }
};

module.exports = request;