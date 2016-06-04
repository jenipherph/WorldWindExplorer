/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */


/*global define*/

define([
    'model/util/Log',
    'model/earth/Terrain',
    'worldwind'],
    function (
        Log,
        Terrain,
        ww) {
        "use strict";

        /**
         * Constructs a viewpoint with eye position and target attributes.
         * @alias Viewpoint
         * @constructor
         * @param {Position} eye The position of eye in geographic coordiates.
         * @param {Terrain} target The terrain under the reticule (crosshairs.
         * @classdesc Represents the eye position and the target positon attributes.
         */
        var Viewpoint = function (eyePosition, targetTerrain) {
            if (!eyePosition) {
                throw new WorldWind.ArgumentError(
                    Log.error("Viewpoint", "constructor", "missingPosition"));
            }
            if (!targetTerrain) {
                throw new WorldWind.ArgumentError(
                    Log.error("Viewpoint", "constructor", "missingTerrain"));
            }
            this.eye = new WorldWind.Position(eyePosition.latitude, eyePosition.longitude, eyePosition.altitude);
            this.target = new Terrain();
            this.target.copy(targetTerrain);
        };

        /**
         * A Viewpoint with Number.NaN values.
         * @constant
         * @type {Viewpoint}
         */
        Viewpoint.INVALID = new Viewpoint(
            new WorldWind.Position(Number.NaN, Number.NaN, Number.NaN),
            Terrain.INVALID);

        /**
         * A Viewpoint with 0 values.
         * @constant
         * @type {Viewpoint}
         */
        Viewpoint.ZERO = new Viewpoint(WorldWind.Position.ZERO, Terrain.ZERO);

        /**
         * Sets this position to the latitude, longitude and elevation of a specified position.
         * @param {Position} viewpoint The viewpoint to copy.
         * @returns {Position} This position, set to the values of the specified position.
         * @throws {ArgumentError} If the specified position is null or undefined.
         */
        Viewpoint.prototype.copy = function (viewpoint) {
            if (!viewpoint) {
                throw new WorldWind.ArgumentError(
                    Log.error("Viewpoint", "copy", "missingViewpoint"));
            }
            this.eye.copy(viewpoint.eye);
            this.target.copy(viewpoint.target);

            return this;
        };

        /**
         * Indicates whether this viewpoint has the same values as a specified voiwpoint.
         * @param {Viewpoint} viewpoint The viewpoint to compare with this one.
         * @returns {Boolean} true if this viewpoint is equal to the specified one, otherwise false.
         */
        Viewpoint.prototype.equals = function (viewpoint) {
            return viewpoint
                && viewpoint.eye.equals(this.eye)
                && viewpoint.target.equals(this.target);
        };


        /**
         * Returns a string representation of this viewpoint.
         * @returns {String}
         */
        Viewpoint.prototype.toString = function () {
            return "(" + this.eye.latitude.toString() + "\u00b0, "
                + this.eye.longitude.toString() + "\u00b0, "
                + this.eye.altitude.toString() + "m, "
                + this.target.latitude.toString() + "\u00b0, "
                + this.target.longitude.toString() + "\u00b0, "
                + this.target.elevation.toString() + "m, "
                + this.target.aspect.toString() + "\u00b0, "
                + this.target.slope.toString() + "\u00b0)";
        };

        return Viewpoint;
    }
);
