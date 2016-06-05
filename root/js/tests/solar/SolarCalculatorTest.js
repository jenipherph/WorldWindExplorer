/* 
 * Copyright (c) 2016, Bruce Schubert.

 */

// Given these inputs:
//    year          = 2003;
//    month         = 10; (October)
//    day           = 17;
//    hour          = 12;
//    minute        = 30;
//    second        = 30;
//    timezone      = -7.0;
//    delta_ut1     = 0;
//    delta_t       = 67;
//    longitude     = -105.1786;
//    latitude      = 39.742476;
//    elevation     = 1830.14;
//    pressure      = 820;
//    temperature   = 11;
//    slope         = 30;
//    azm_rotation  = -10;
//    atmos_refract = 0.5667;
//    
// The output of this test should be:
//        Julian Day:    2452930.312847
//        L:             2.401826e+01 degrees   // Earth heliocentric longitude
//        B:             -1.011219e-04 degrees  // Earth heliocentric latitude
//        R:             0.996542 AU            // Earth radius vector 
//        H:             11.105902 degrees      // Observer hour angle
//        Delta Psi:     -3.998404e-03 degrees  // Nutation longitude 
//        Delta Epsilon: 1.666568e-03 degrees   // Nutation obliquity
//        Epsilon:       23.440465 degrees      // Ecliptic true obliquity 
//        Zenith:        50.111622 degrees      // Topocentric zenith angle
//        Azimuth:       194.340241 degrees     // Topocentric azimuth angle
//        Incidence:     25.187000 degrees      // Surface incidence angle
//        Sunrise:       06:12:43 Local Time
//        Sunset:        17:20:19 Local Time
//        

define(['model/sun/SolarCalculator', 'QUnit'],
    function (SolarCalculator, QUnit) {
        "use strict";
        var run = function () {
            var nearlyEquals = function(a, b, epsilon) {
                return Math.abs(a - b) <= Math.abs(epsilon);
            };
            test("getJD", function (assert) {// Passing in the QUnit.assert namespace

                var julianDates = [
                        {yr: 1987, mo: 1, dy: 27, jd: 2446822.5},
                        {yr: 1988, mo: 1, dy: 27, jd: 2447187.5},
                        {yr: 1999, mo: 1, dy: 1, jd: 2451179.5},
                        {yr: 2003, mo: 10, dy: 17, jd: 2452929.5}],
                    i, max, date, jd;

                for (i = 0, max = julianDates.length; i < max; i++) {
                    date = julianDates[i];
                    jd = SolarCalculator.getJD(date.yr, date.mo, date.dy);
                    assert.ok(nearlyEquals(date.jd, jd, 0.0), date.yr + '/' + date.mo + '/' + date.dy + " : " + date.jd + " ~= " + jd);
                }

            });
        };
        return {run: run};
    });

