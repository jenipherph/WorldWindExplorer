/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

/**
 * @param {Knockout} ko
 * @param {Events} events Event constants.
 * @param {Log} log
 * @param {Publisher} publisher object
 * @param {Terrain} Terrain module
 * @param {Viewpoint} Viewpoint module
 * @param {WmtUtil} util object
 * @param {WorldWind} ww
 * @returns {Model}
 */
define([
    'knockout',
    'model/Events',
    'model/util/Log',
    'model/util/Publisher',
    'model/sun/SolarData',
    'model/sun/SolarPositionAlgorithm',
    'model/earth/Terrain',
    'model/earth/Viewpoint',
    'model/util/WmtUtil',
    'worldwind'],
    function (
        ko,
        events,
        log,
        publisher,
        SolarData,
        spa,
        Terrain,
        Viewpoint,
        util,
        ww) {
        "use strict";
        /**
         * Creates an EarthModel object from the given Earth object.
         * @constructor
         * @param {Earth} earth The earth globe.
         * @returns {EarthModel}
         */
        var EarthModel = function (earth) {
            // Mix-in Publisher capability (publish/subscribe pattern)
            publisher.makePublisher(this);
            var self = this;
            
            self.earth = earth;

            // Properties (available for non-subscribers)
            self.viewpoint = new Viewpoint(WorldWind.Position.ZERO, Terrain.ZERO);
            self.terrainAtMouse = new Terrain(0, 0, 0, 0, 0);
            self.applicationTime = new Date(0);
            self.sunlight = {};

            // Internals
            self.lastMousePoint = new WorldWind.Vec2();
            self.lastSolarTarget = new Terrain(0, 0, 0, 0, 0);
            self.lastSolarTime = new Date(0);
            self.SUNLIGHT_DISTANCE_THRESHOLD = 10000; // meters
            self.SUNLIGHT_TIME_THRESHOLD = 15; // minutes

            // Perform initial updates for time and sunlight
            self.updateAppTime(new Date());

            // ==================
            // Knockout ViewModel
            // ==================
            self.viewModel = {
                eyePosLatitude: ko.observable(self.viewpoint.eye.latitude),
                eyePosLongitude: ko.observable(self.viewpoint.eye.longitude),
                eyePosAltitude: ko.observable(self.viewpoint.eye.altitude),
                tgtPosLatitude: ko.observable(self.viewpoint.target.latitude),
                tgtPosLongitude: ko.observable(self.viewpoint.target.longitude),
                tgtPosElevation: ko.observable(self.viewpoint.target.elevation)
            };
        };


        /**
         * 
         * @param {Date} time
         */
        EarthModel.prototype.updateAppTime = function (time) {
            if (this.applicationTime.valueOf() === time.valueOf()) {
                return;
            }
            var self = this;

            // SUNLIGHT: 
            // Update the sunlight angles when the elapsed time has gone past the threshold (15 min)
            if (util.minutesBetween(this.lastSolarTime, time) > this.SUNLIGHT_TIME_THRESHOLD) {
//                if (this.processingSunlight) {
//                    // Cache the latest request. handleSunlight() will process the pending request.
//                    this.pendingSolarTime = time;
//                } else {
//                    // Set the processing flag so that we queue only the latest request.
//                    this.processingSunlight = true;
//                    SolarResource.sunlightAtLatLonTime(
//                        this.lastSolarTarget.latitude,
//                        this.lastSolarTarget.longitude,
//                        time,
//                        function (sunlight) {
//                            self.handleSunlight(sunlight);  // callback
//                        });
//                    this.lastSolarTime = time;
//                }
                this.updateSunlight(this.applicationTime, this.lastSolarTarget.latitude, this.lastSolarTarget.longitude);
            }
            log.info("Model", "updateAppTime", time.toLocaleString());

            this.applicationTime = time;
            this.fire(events.EVENT_TIME_CHANGED, time);
        };

        /**
         * Updates model propeties associated with the globe's view.
         */
        EarthModel.prototype.updateEyePosition = function () {
            var self = this,
                viewpoint = this.earth.getViewpoint(),
                target = viewpoint.target;

            // Initate a request to update the sunlight property when we've moved a significant distance
            if (!this.lastSolarTarget || this.lastSolarTarget.distanceBetween(target) > this.SUNLIGHT_DISTANCE_THRESHOLD) {
//                SolarResource.sunlightAtLatLonTime(target.latitude, target.longitude, new Date(),
//                    function (sunlight) {
//                        self.handleSunlight(sunlight);  // callback
//                    });
//                this.lastSolarTarget.copy(target);

                this.updateSunlight(this.applicationTime, target.latitude, target.longitude);
            }

            // Persist a copy of the new position in our model for non-subscribers
            this.viewpoint.copy(viewpoint);
            
            // Update the Knockout view model
//            log.info("Model", "updateEyePosition", viewpoint.eye.latitude.toString()+','+viewpoint.eye.longitude.toString());
            this.viewModel.eyePosLatitude(viewpoint.eye.latitude);
            this.viewModel.eyePosLongitude(viewpoint.eye.longitude);


            // Update viewpointChanged subscribers
            this.fire(events.EVENT_VIEWPOINT_CHANGED, viewpoint);
        };


        /**
         * Updates the terrainAtMouse property and fires a "mousedMoved" event.
         * 
         * @param {Vec2} mousePoint Mouse point or touchpoint coordiantes.
         */
        EarthModel.prototype.updateMousePosition = function (mousePoint) {
            if (mousePoint.equals(this.lastMousePoint)) {
                return;
            }
            this.lastMousePoint.copy(mousePoint);

            var terrain = this.earth.getTerrainAtScreenPoint(mousePoint);
            // Persist a copy of the terrain in our model for non-subscribers
            this.terrainAtMouse.copy(terrain);
            // Update subscribers
            this.fire(events.EVENT_MOUSE_MOVED, terrain);
        };


        /**
         * Callback function that receives sunlight data from a REST resource.
         * 
         * @param {Sunlight} sunlight JSON Sunlight object.
         */
        EarthModel.prototype.handleSunlight = function (sunlight) {
            this.sunlight = sunlight;
            // Reset our "processing flag"
            this.processingSunlight = false;
            //log.info("Model", "handleSunlight", "Sunrise: " + sunlight.sunriseTime + ", Sunset: " + sunlight.sunsetTime);

            // Update sunlightChanged subscribers
            this.fire(events.EVENT_SUNLIGHT_CHANGED, sunlight);

            // If there's a pending request, initiate another update
            if (this.pendingSolarTime) {
                var time = this.pendingSolarTime;
                delete this.pendingSolarTime;
                this.updateAppTime(time);
            }
        };

        EarthModel.prototype.updateSunlight = function (time, latitude, longitude) {
            var observer = {latitude: latitude, longitude: longitude, elevation: 0},
                sd = new SolarData(time, -(time.getTimezoneOffset() / 60), observer);

            spa.calculate(sd);

            // Topocentric local hour angle
            this.sunlight.azimuthAngle = {value: sd.azimuth.toString()};
            this.sunlight.localHourAngle = {value: sd.h_prime.toString()};
            this.sunlight.sunriseHourAngle = {value: sd.srha.toString()};
            this.sunlight.sunsetHourAngle = {value: sd.ssha.toString()};
            this.sunlight.sunriseTime = sd.sunrise;
            this.sunlight.sunsetTime = sd.sunset;

            this.lastSolarTime = time;
            this.lastSolarTarget.latitude = latitude;
            this.lastSolarTarget.longitude = longitude;
        }

        return EarthModel;
    }
);