/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define */

/**
 * The ReticuleLayer renders a reticule (e.g., reticule) in the center of the World Wind globe.
 * @exports ReticuleLayer
 * 
 * @param {Crosshairs} Crosshairs
 * @param {Compass} Crosshairs
 * @param {Constants} constants Provides image path.
 * @param {WorldWind} WorldWind
 * @returns {ReticuleLayer}
 */

define([
    'model/earth/Compass',
    'model/earth/Crosshairs',
    'model/Constants',
    'worldwind'],
    function (
        Compass,
        Crosshairs,
        constants,
        ww) {
        "use strict";

        /**
         * Constructs a reticule layer.
         * @alias ReticuleLayer
         * @constructor
         * @augments RenderableLayer
         * @classdesc Displays a reticule. Reticule layers cannot be shared among World Windows. Each World Window if it
         * is to have a reticule layer must have its own. See the MultiWindow example for guidance.
         */
        var ReticuleLayer = function () {
            WorldWind.RenderableLayer.call(this, "Crosshairs");

            // The compass has been superceded by the LocationWidget
            //this._compass = new Compass(Wmt.IMAGE_PATH);
            this._reticule = new Crosshairs(constants.IMAGE_PATH);

            // Put crosshairs on top of the globe
            this.addRenderable(this._reticule);
            //this.addRenderable(this._compass);
        };

        ReticuleLayer.prototype = Object.create(WorldWind.RenderableLayer.prototype);

        Object.defineProperties(ReticuleLayer.prototype, {
            /**
             * The reticule to display.
             * @type {Crosshairs}
             * @default {@link Reticule}
             * @memberof ReticuleLayer.prototype
             */
            reticule: {
                get: function () {
                    return this._reticule;
                },
                set: function (reticule) {
                    if (reticule && reticule instanceof Crosshairs) {
                        this.removeAllRenderables();
                        this.addRenderable(reticule);
                        this._reticule = reticule;
                    }
                }
            },
//            compass: {
//                get: function () {
//                    return this._compass;
//                },
//                set: function (compass) {
//                    if (compass && compass instanceof Compass) {
//                        this.removeAllRenderables();
//                        this.addRenderable(compass);
//                        this._compass = compass;
//                    }
//                }
//            }
        });

        return ReticuleLayer;
    }
);