(function() {

    angular
        .module('app', ['ngRoute', 'firebase'])
        .controller('MainController', ['$scope', '$firebaseArray', MainController])
        .config(AppConfig);

    function AppConfig($routeProvider) {
        $routeProvider.when('/', {
            controller: 'MainController as mainController',
            templateUrl: 'views/main.html'
        });
    }

    function MainController($scope, $firebaseArray) {
        firebase.initializeApp({
            apiKey: "AIzaSyCub7oG2LMQBoK6CisyZAQLlQtHSzAgvEk",
            authDomain: "mushroom-project-1544209434551.firebaseapp.com",
            databaseURL: "https://mushroom-project-1544209434551.firebaseio.com",
            projectId: "mushroom-project-1544209434551",
            storageBucket: "mushroom-project-1544209434551.appspot.com",
            messagingSenderId: "64814358483"
        });
        var ref = firebase.database().ref().child("geolocation");
        $scope.locations = $firebaseArray(ref);
        console.log($scope.messages)
    }

}());

// Automatically called by Google Maps, it has to have this particular name

function initMap() {
    var map = new google.maps.Map(document.querySelector('.map'), {
        center: { lat: 56.046467, lng: 12.694512 },
        zoom: 4
    });
var locations = [
    ['Stockholm', 59.329323, 18.068581],
    ['hello', 56.046467, 12.694512],
    ['Malmö', 55.604981, 13.003822],
    ['Ystad', 55.429505, 13.820031],
];



var infowindow = new google.maps.InfoWindow();

var marker, i;

for (i = 0; i < locations.length; i++) {
    marker = new google.maps.Marker({
        position: new google.maps.LatLng(locations[i][1], locations[i][2]),
        map: map
    });

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
            infowindow.setContent(locations[i][0]);
            infowindow.open(map, marker);
        }
    })(marker, i));
}
};
