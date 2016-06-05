/* 
 * Copyright (c) 2016, Bruce Schubert.
 * The MIT License.
 */
"use strict";
require.config({
    baseUrl: 'js/',
    paths: {
        'QUnit': 'libs/qunit/qunit-1.21.0'
    },
    shim: {
        'QUnit': {
            exports: 'QUnit',
            init: function() {
                QUnit.config.autoload = false;
                QUnit.config.autostart = false;
            }
        }
    }
});

// require the unit tests.
require(
    ['QUnit','tests/solar/SolarCalculatorTest'],
    function(QUnit, SolarCalculatorTest ) {
        // run the tests.
        SolarCalculatorTest.run();
        // start QUnit.
        QUnit.load();
        QUnit.start();
    }
);



