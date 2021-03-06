'use strict';

myApp.controller('MapController', ['$scope', 'mapService', mapController]);

function mapController($scope, mapService){
    mapService.displayMap();

    $scope.path = function(loc){
        mapService.changeLocation(loc);
        mapService.drawCircle(loc, 3);

        console.log(mapService.getRadius());
        mapService.changeCircleRadius(0.5);

        console.log(mapService.getRadius());
        mapService.computeRoute(loc);
        mapService.displayMap();
    };
}
/* Directives */

myApp.directive('googlePlaces', function(placesService){
        return {

            // Remplace l'input google-places par un nouveau (dynamique, permettant l'autocomplete)
            restrict:'EA',
            replace:true,
            scope:{
                'path' : '&gpPath'
            },
            template: '<input id="google_places_ac" name="google_places_ac" type="text" class="input-block-level searchMap"/>',
            controller: 'MapController',

            link: function($scope, elm, attrs){
                // Activation de l'autocomplétion (Google Maps gère lui-même la liste)
                // Utilisation du selecteur jQuery $('#google_places_ac') en attendant de trouver mieux
                var autocomplete = new google.maps.places.Autocomplete($('#google_places_ac')[0], {});

                // A chaque changement de lieu (clic sur le lieu), déclechement de l'évènement
                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    // place contient le lieu choisi (type GeoCoderResult)
                    var place = autocomplete.getPlace();

                    // On sauvegarde dans la variable loc du scope un tableau contenant latitude et longitude
                    // du lieu selectionné (pour pouvoir l'utiliser dans map($scope)
                    var loc = [place.geometry.location.lat(),place.geometry.location.lng()];

                    if(attrs.gpPath === "path"){
                        $scope.path(loc);
                        placesService.setLoc(loc);
                        placesService.setAddress(elm[0].value);
                    }
                    else {
                        placesService.setLoc(loc);
                        placesService.setAddress(elm[0].value);
                    }

                });
            }
        }
    });