/**
 * Created by Thomas on 29/11/2014.
 */

myApp.controller('AccountController', ['$scope', 'REST', 'mapService', 'sessionService', 'placesService', 'alertService',
    function($scope, REST, mapService, sessionService, placesService, alertService)
{
    // Carpooling creation menu
    $scope.confirm = true;
    $scope.vehicleChoice = true;
    $scope.roomChoice = true;
    $scope.luggageChoice = true;
    $scope.carPoolingChoice = true;
    $scope.isErrorVisible = false;
    $scope.placeholder = {};

    sessionService.loadInfos().then(function(){
        $scope.placeholder.address = sessionService.getInfos().address;
        sessionService.loadCampus().then(function(){
            $scope.placeholder.campus = sessionService.getCampus().name;
            $scope.path.CampusName = sessionService.getCampus();

        })
    })

    $scope.authToken = sessionService.getAuthToken();
    $scope.user = {};
    $scope.path = {};

    $scope.registrationLocation = function(loc){$scope.loc = loc;};

    $scope.registrationNext = function(user){
        var loc = placesService.getLoc();

        if (loc === undefined){
            alertService.displayMessage('Votre addresse n\'a pu être géolocalisée. Merci de préciser celle-ci. Si cela ne fonctionne pas, ' +
                  'le service peut être temporairement indisponible.');
            return;
        }

        $scope.user.Long = loc[0];
        $scope.user.Lat = loc[1];
        $scope.user.Address = placesService.getAddress();
        $scope.user = user;

        // Radio buttons fix
        $scope.user.MailNotifications = $scope.user.PhoneNotifications = $scope.user.Newsletter = "true";

        $scope.goTo('registrationNext');
    };

    $scope.goTo = function(url){
        urlf = '#/';
        urlf += (url === undefined) ? '' : url;
        window.location = urlf;
    };


    $scope.connection = function(auth){
        auth.password_sha512 = CryptoJS.SHA512(auth.Password).toString();
        auth.Password = undefined;

        REST.REST('POST', 'auth', auth).success(function(data){
            if(data.success == true){
                //$.cookie('authToken', data.authToken, { expires: 7 });
                sessionService.setAuthToken(data.authToken);
                $scope.authToken = data.authToken;
                alertService.displayMessage('Connexion réussie !');
                $scope.message = ''; // Clear previous error messages
                $scope.isErrorVisible = false;
                window.location = ''; // Call to $scope.goTo() doesn't reload the page
            }
            else if(data.reasons != undefined) {
                $scope.isErrorVisible = true;
                $scope.message = data.reasons;
            }

            else{
                $scope.isErrorVisible = true;
                $scope.message = "Les identifiants saisis sont incorrects ou ce nom d'utilisateur n'existe pas.";
            }


        });
    };

    $scope.registration = function(user) {
        $scope.user.Password = CryptoJS.SHA512($scope.user.PasswordNoHash).toString();

        $scope.user.PasswordNoHash = undefined; // Erase password
        $scope.user.MessagingParameters = 1;

        REST.REST('POST', 'register', $scope.user, 'application/json').success(function(data){
            if (data.success){
                alertService.displayMessage('Inscription réussie, vous allez bientôt recevoir un mail de validation afin de ' +
                      'valider votre compte et commencer à utiliser notre site');
                $scope.goTo();
                return;
            }
        });
    };

    $scope.search = function(path) {
        if(sessionService.getAuthToken() === undefined){
            window.location = '#/connection';
            $scope.isErrorVisible = true;
            $scope.message = 'Cette fonctionnalité requiert d\'etre connecté.';
            return;
        }

        var loc = placesService.getLoc();

        if (loc === undefined){
            alertService.displayMessage('Votre addresse n\'a pu être géolocalisée. Merci de préciser celle-ci. Si cela ne fonctionne pas, ' +
            'le service peut être temporairement indisponible.');
            return;
        }

        $scope.path.long = loc[0];
        $scope.path.lat = loc[1];

        $scope.path.radius = $('#rayon').slider("option", "value");

        var date = new Date(path.Date + 'T' + path.Time);

        date.setMinutes(date.getMinutes() + $('#battement').slider("option", "values")[0]);
        $scope.path.minMeetTime = date.toUTCString();
        date.setMinutes(date.getMinutes() -  $('#battement').slider("option", "values")[0] + $('#battement').slider("option", "values")[1]);
        $scope.path.maxMeetTime = date.toUTCString();

        mapService.drawCircle(loc, $scope.path.radius);
        $scope.path.idCampus = path.CampusName.idCampus;
        mapService.clearMarkers();

        REST.REST('POST', 'carpoolings/search', JSON.stringify($scope.path), 'json')
            .success(function(data){
                console.log(data);
                for (var i = 0; i < data.carPoolings.length; i++) {
                    var datum = data.carPoolings[i];
                    var loc = new MapService.gm.LatLng( datum.long, datum.lat);
                    MapService.addMarker(datum.address,loc,datum);
                }
            }).then(function(){
                //$scope.carPoolingChoice = false;
            });
    };

    $scope.changeCTA = function(value){
        $scope.path.CampusToAddress = (value === true || value === false) ? value.toString() : "false";
    };

    $scope.getVehicles = function(id){
        for(var i = 0; i < $scope.user.vehicles.length; ++i)
            if($scope.user.vehicles[i].idVehicle == id)
                return $scope.user.vehicles[i];
    };

    $scope.proposeNext = function(next){
        $scope.path.IdVehicle = (next.vehiculeSelected === undefined) ? $scope.path.IdVehicle : next.vehiculeSelected;
        $scope.path.Luggage = next.luggage;
        $scope.path.Room = next.room;


        REST.REST('POST', 'carpoolings', $scope.path, 'json')
            .success(function(data){
               if(data.success == true){
                   alertService.displayMessage('Le trajet a bien été ajouté');
                   window.location.reload();
               }else
                alertService.displayMessage("Une erreur est survenue, veuillez rééssayer.");
            });

    };

    $scope.loadVehicles = function(){
        return REST.REST('GET', 'vehicles')
            .success(function(data){
                $scope.user.vehicles = data.vehicles;
            });
    };

    $scope.propose = function(path){
        if(sessionService.getAuthToken() === undefined){
            window.location = '#/connection';
            $scope.isErrorVisible = true;
            $scope.message = 'Cette fonctionnalité requiert d\'etre connecté.';
            return;
        }
        var loc = placesService.getLoc();

        if (loc === undefined){
            alertService.displayMessage('Votre addresse n\'a pu être géolocalisée. Merci de préciser celle-ci. Si cela ne fonctionne pas, ' +
            'le service peut être temporairement indisponible.');
            return;
        }

        $scope.path.Price = 0;

        $scope.path.Long = loc[0];
        $scope.path.Lat = loc[1];

        $scope.path.Address = placesService.getAddress();

        var date = new Date(path.Date + 'T' + path.Time);
        $scope.path.MeetTime = date.toUTCString();

        if(sessionService.getInfos() === undefined){
            sessionService.loadInfos().then(function(){
                $scope.path.IdClient = sessionService.getInfos().idClient;
            });
        } else
            $scope.path.IdClient = sessionService.getInfos().idClient;


        $scope.path.IdCampus = path.CampusName.idCampus;

        if($scope.path.CampusToAddress === undefined)
            $scope.path.CampusToAddress = "false";

        $scope.loadVehicles().then(function(){
           if($scope.user.vehicles.length > 1){
               $scope.vehicleChoice = false;
           }
           else{
               $scope.path.IdVehicle = $scope.user.vehicles[0].idVehicle;
           }

        });

        $scope.roomChoice = false;
        $scope.luggageChoice = false;
        $scope.confirm = false;
    };

    $scope.join = function(carPooling){
        var req = {};
        sessionService.loadInfos().then(function(){
           req.IdClient = sessionService.getInfos().idClient;
           req.IdCarPooling = carPooling.idCarPooling;
           req.Accepted = false;
           REST.REST('POST', 'carpoolings/join', req, 'json')
               .success(function(){
                    alertService.displayMessage('Votre demande a bien été enregistré, vous serez prévenu une fois que votre participation a été' +
                            ' validée');
                    window.location.reload();
               });
        });



    };

}]);