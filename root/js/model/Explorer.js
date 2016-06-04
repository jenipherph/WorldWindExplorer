/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

/**
 * Explorer singleton and constants.
 *
 * @param {Constants} constants singleton
 * @param {Log} log singleton
 * @param {Messenger} messenger singleton
 * @param {Model} Model module
 * @param {Settings} settings singleton
 * @param {WorldWind} ww
 *
 * @returns {Explorer}
 *
 * @author Bruce Schubert
 */
define(['model/Constants',
        'model/util/Log',
        'model/util/Messenger',
        'model/Model',
        'model/util/Settings',
        'worldwind'],
    function (constants,
              log,
              messenger,
              Model,
              settings) {
        "use strict";
        /**
         * This is the top-level Explorer singleton.
         * @exports Explorer
         * @global
         */
        var Explorer = {
            /**
             * The Explorer version number.
             * @constant
             */
            VERSION: "0.1.0",
            /**
             * Prepares the singleton Explorer object for use.
             * @param {Earth} earth
             */
            initialize: function (earth) {
                // The WorldWindow (globe) provides the spatial input 
                this.earth = earth;
                this.wwd = earth.wwd;

                this.goToAnimator = new WorldWind.GoToAnimator(this.wwd);
                this.isAnimating = false;

                // Create the MVC Model on the primary globe
                this.model = new Model(this.earth);

                // Internal. Intentionally not documented.
                this.updateTimeout = null;
                this.updateInterval = 50;

                // Counters used to display conditional messages
                this.markerDnDCount = 0;

                // Setup to update each time the World Window is repainted.
                var self = this;
                this.wwd.redrawCallbacks.push(function () {
                    self.handleRedraw();
                });

                // Initialize the model with current time
                this.changeDateTime(new Date());

                // Setup to track the cursor position relative to the World Window's canvas. Listen to touch events in order
                // to recognize and ignore simulated mouse events in mobile browsers.
                window.addEventListener("mousemove", function (event) {
                    self.handleMouseEvent(event);
                });
                window.addEventListener("touchstart", function (event) {
                    self.handleTouchEvent(event);
                });

            },
            /**
             * Starts a drag-n-drop operation that creates the given marker on the globe at the drop point.
             * @param {Object} marker A marker node.
             */
            dropMarkerOnGlobe: function (marker) {
                var self = this,
                    onDropCallback;

                if (this.markerDnDCount < 1) {
                    this.markerDnDCount++;
                    messenger.infoGrowl("Click on the globe to place the marker.", "Instructions");
                }
                // This callback function is invoked when the DnD drop is completed. DnD updates the marker's lat/lon
                onDropCallback = function (marker) {
                    //self.model.markerManager.addMarker(marker);
                };
                // Start the DnD for the marker with the callback
                this.earth.dndController.armDrop(marker, onDropCallback);
            },
            /**
             *
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Object} params
             */
            identifyFeaturesAtLatLon: function (latitude, longitude, params) {
                var arg = params || {};

                if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                    log.error("Explorer", "identifyFeaturesAtLatLon", "Invalid Latitude and/or Longitude.");
                    return;
                }
                //geoMacResource.identifyPoint(latitude, longitude, arg.layerId, function (json) {
                //
                //});

            },
            /**
             * Centers the globe on the given lat/lon via animation.
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} eyeAltitude
             */
            lookAtLatLon: function (latitude, longitude, eyeAltitude) {
                if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                    log.error("Explorer", "lookAtLatLon", "Invalid Latitude and/or Longitude.");
                    return;
                }
                // TODO: Make AGL and MSL elevations a function of the model
                // TODO: Eye Position a property of the model
                // 
                var self = this,
                    eyeAltMsl = this.model.viewpoint.eye.altitude,
                    eyePosGrdElev = this.earth.terrainProvider.elevationAtLatLon(this.model.viewpoint.eye.latitude, this.model.viewpoint.eye.longitude),
                    tgtPosElev = this.earth.terrainProvider.elevationAtLatLon(latitude, longitude),
                    eyeAltAgl = eyeAltitude || Math.max(eyeAltMsl - eyePosGrdElev, 100),
                    tgtEyeAltMsl = Math.max(tgtPosElev + eyeAltAgl, 100);

                // HACK: Force the view to nadir to avoid bug where navigator looks at target at 0 MSL.
                // This will establish the crosshairs on the target.
                this.wwd.navigator.range = eyeAltMsl;
                this.wwd.navigator.tilt = 0;
                this.wwd.redraw();

                this.earth.goto(latitude, longitude, tgtEyeAltMsl, function () {
                    self.updateSpatialData();
                });
            },
            /**
             * Updates the model with the given time.
             * @param {Date} date
             */
            changeDateTime: function (date) {
                this.model.updateAppTime(date);
            },
            /**
             * Updates the model with the an adjusted time (+/- minutues).
             * @param {Number} minutes The number of minutes (+/-) added or subtracted from the current application time.
             */
            incrementDateTime: function (minutes) {
                var msCurrent = this.model.applicationTime.valueOf(),
                    msNew = msCurrent + (minutes * 60000);
                this.changeDateTime(new Date(msNew));
            },
            /**
             * Returns the terrain at the reticule.
             * @returns {Terrain} Explorer.model.viewpoint.target}
             */
            getTargetTerrain: function () {
                return this.model.viewpoint.target;
            },
            /**
             * Restores all the persistant data from a previous session.
             * This method must be called after World Wind has finished
             * updating. See the use Pace.on("done",...) in WmtClient.
             */
            restoreSession: function () {
                log.info('Explorer', 'restoreSession', 'Restoring the model and view.');
                //this.model.markerManager.restoreMarkers();
                this.restoreSessionView();
                // Update all time sensitive objects
                this.changeDateTime(new Date());

                // Force a refresh now that everything is setup.
                this.earth.redraw();
            },
            // Internal method
            restoreSessionView: function () {
                settings.restoreSessionSettings(this);
            },
            /**
             * Saves the current session to the persistent store.
             * See the call to window.onUnload(...) in WmtClient.
             */
            saveSession: function () {
                log.info('Explorer', 'saveSession', 'Saving the model and view.');
                this.saveSessionView();
                //this.model.markerManager.saveMarkers();
            },
            // Internal method.
            saveSessionView: function () {
                settings.saveSessionSettings(this);
            },
            /**
             * Updates the model with current globe viewpoint.
             */
            updateSpatialData: function () {
                var wwd = this.wwd,
                    mousePoint = this.mousePoint,
                    centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2);

                // Use the mouse point when we've received at least one mouse event. Otherwise assume that we're
                // on a touch device and use the center of the World Window's canvas.
                if (!mousePoint) {
                    this.model.updateMousePosition(centerPoint);
                } else if (wwd.viewport.containsPoint(mousePoint)) {
                    this.model.updateMousePosition(mousePoint);
                }
                // Update the viewpoint
                if (!this.isAnimating) {
                    this.model.updateEyePosition();
                }
            },
            handleRedraw: function () {
                var self = this;
                if (self.updateTimeout) {
                    return; // we've already scheduled an update; ignore redundant redraw events
                }

                self.updateTimeout = window.setTimeout(function () {
                    self.updateSpatialData();
                    self.updateTimeout = null;
                }, self.updateInterval);
            },
            handleMouseEvent: function (event) {
                if (this.isTouchDevice) {
                    return; // ignore simulated mouse events in mobile browsers
                }
                this.mousePoint = this.wwd.canvasCoordinates(event.clientX, event.clientY);
                this.wwd.redraw();
            },
            //noinspection JSUnusedLocalSymbols
            handleTouchEvent: function () {
                this.isTouchDevice = true; // suppress simulated mouse events in mobile browsers
                this.mousePoint = null;
            }
        };
        /**
         * Holds configuration parameters for WWE. Applications may modify these parameters prior to creating
         * their first Explorer objects. Configuration properties are:
         * <ul>
         *     <li><code>startupLatitude</code>: Initial "look at" latitude. Default is Ventura, CA.
         *     <li><code>startupLongitude</code>: Initial "look at" longitude. Default is Venura, CA.
         *     <li><code>startupLongitude</code>: Initial altitude/eye position. Default 0.
         *     <li><code>startupHeading</code>: Initial view heading. Default 0.
         *     <li><code>startupTilt</code>: Initial view tilt. Default 0.
         *     <li><code>startupRoll</code>: Initial view roll. Default 0.
         *     <li><code>viewControlOrientation</code>: horizontal or vertical. Default vertical.
         *     <li><code>showPanControl</code>: Show pan (left/right/up/down) controls. Default false.
         *     <li><code>showExaggerationControl</code>: Show vertical exaggeration controls. Default false.
         * </ul>
         */
        Explorer.configuration = {
            imageryDetailHint: (window.screen.width < 768 ? -0.1 : (window.screen.width < 1024 ? 0.0 : (window.screen.width < 1280 ? 0.1 : 0.2))),
            markerLabels: constants.MARKER_LABEL_NAME,
            startupLatitude: 34.29,
            startupLongitude: -119.29,
            startupAltitude: 1000000,
            startupHeading: 0,
            startupTilt: 0,
            startupRoll: 0,
            showPanControl: false,
            showExaggerationControl: false,
            showFieldOfViewControl: false,
            terrainSampleRadius: 30,
            viewControlOrientation: "vertical"
        };

        return Explorer;
    }
);