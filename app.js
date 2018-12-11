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
            databaseURL: "https://mushroom-project-1544209434551.firebaseio.com/",
            projectId: "mushroom-project-1544209434551",
            storageBucket: "mushroom-project-1544209434551.appspot.com",
            messagingSenderId: "64814358483"
        });
        var ref = firebase.database().ref().child("mushrooms");
        $scope.mushrooms = $firebaseArray(ref);
        console.log($scope.mushrooms)

        $scope.$on('$viewContentLoaded', function() {
            initMap();
        });

    }

}());

function uploadFile(files) {
    var storageRef = firebase.storage().ref();
    var file = files[0];
    if (!file) return;
    var fileName = file.name.split('.'); //split the file on extension, for example mushroom.jpg will become ['mushroom','jpg'] to preserve the original extension
    fileName[0] = uuid(); // replace the filename with UUID for uniqueness of images
    fileName = fileName.join('.'); // join the array with a dot preserving the original extension and only replacing the first part of filename
    var mushroomRef = storageRef.child(fileName);
    var task = mushroomRef.put(file)
    task.then(_ => mushroomRef.getDownloadURL()).then(url => {

        document.querySelector('#imgUpload').setAttribute('src', url)
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, error => {
            console.log(getErrorMessage(error));
        });
    } else {
        // x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    console.log('Latitude: ' + position.coords.latitude +
        'Longitude: ' + position.coords.longitude);
    document.querySelector('input[type="file"]').style.display = '';
}

function getErrorMessage(error) {
    var errorMessage = '';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = 'An unknown error occurred.';
            break;
    }
    return errorMessage;
}


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

//generate RFC4122 compliant UUID v4
function uuid() {
    var uuid = '',
        i, random;
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;

        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += '-'
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}


// const database = firebase.firestore();

// Reference the document
// const myPost = database.collection('products').doc('CGl2Obsqagfm1DguguLS');

// // Listen to realtime changes 
// myPost.onSnapshot(doc => {

//     const data = doc.data();

// })