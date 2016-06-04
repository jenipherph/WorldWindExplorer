/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/**
 * The LocationViewModel encapsulates the data representing globe's camera position, or "viewpoint".
 * I.e., the position under the cross hairs.
 * @param {ojcore} oj
 * @param {knockout} ko
 * @param {Explorer} explorer
 * @returns {LocationViewModel}
 */
define(['ojs/ojcore', 'knockout',
        'model/Explorer',
        'ojs/ojcollapsible', 'ojs/ojmasonrylayout'],
    function (oj, ko, explorer) {
        /**
         * Constructs a LocationViewModel.
         * @returns {LocationViewModel} A new instance.
         */
        function LocationViewModel() {
            var model = explorer.earthModel;
            var self = this;

            this.eyePosLatitude = model.viewModel.eyePosLatitude;
            this.eyePosLongitude = model.viewModel.eyePosLongitude;
        }

        return LocationViewModel;
    });
