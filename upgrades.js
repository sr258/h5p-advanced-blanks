var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.AdvancedBlanks'] = (function () {
  return {
    /**
     * Move disableImageZooming from behaviour to media
     *
     * @param {object} parameters Parameters
     * @param {function} finished Callback.
     * @param {object} extras Extras.
     */
    1: {
      1: {
        contentUpgrade: function (parameters, finished, extras) {
          // Overly cautious here like H5P core team
          if (parameters) {
            const newMedia = {
              // Copy old disableImageZooming or set default
              disableImageZooming: parameters.behaviour && parameters.behaviour.disableImageZooming || false,
            };

            // Remove old disableImageZooming
            delete parameters.behaviour.disableImageZooming;

            if (parameters.media) {
              // Copy old media instance parameters
              newMedia.type = parameters.media
            };

            parameters.media = newMedia
          }

          finished(null, parameters, extras);
        }
      }
    }
  };
})();
