angular
    .module('app', ['ngRoute', 'firebase'])
    .controller('MainController', ['$scope', '$firebaseArray', '$location', MainController])
    .config(AppConfig);

function AppConfig($routeProvider) {
    $routeProvider.when('/', {})
        .when('/my-profile', {});
}

var initialized = false;

function MainController($scope, $firebaseArray, $location) {
    window.$scope = $scope;
    console.log('level completed - troy 2000')
    if (initialized) return;
    initialized = true;
    firebase.initializeApp({
        apiKey: "AIzaSyCub7oG2LMQBoK6CisyZAQLlQtHSzAgvEk",
        authDomain: "mushroom-project-1544209434551.firebaseapp.com",
        databaseURL: "https://mushroom-project-1544209434551.firebaseio.com/",
        projectId: "mushroom-project-1544209434551",
        storageBucket: "mushroom-project-1544209434551.appspot.com",
        messagingSenderId: "64814358483"
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            hideLoginScreen();
            // console.log('auth changed', user);
            document.querySelector('#welcome').textContent = ('Welcome ' + user.displayName + '!');
            var resetUserImg = document.querySelectorAll('.userImg');
            for (var i = 0; i < resetUserImg.length; i++) {
                resetUserImg[i].src = user.photoURL;
            }
        } else {
            // No user is signed in.
            showLoginScreen();
        }
    });
    $scope.formValid = false;
    $scope.geolocationAvailable = false;

    var ref = firebase.database().ref().child("mushrooms");
    $scope.mushrooms = $firebaseArray(ref);

    $scope.$watch('mushrooms', _ => {
        $scope.filterMushrooms();
    }, true);

    $scope.filterMushrooms = _ => {
        var inputValue = $scope.search;
        if (!inputValue) {
            $scope.filteredMushrooms = $scope.mushrooms;
        } else {
            $scope.filteredMushrooms = $scope.mushrooms.filter(mushroom => {
                if (mushroom.name.includes(inputValue))
                    return true;
                else return false;
            });
        }
    };

    var form = document.querySelector('form');

    form.oninput = _ => {
        $scope.formValid = form.checkValidity();
        //manually trigger $digest loop
        $scope.$applyAsync();
    } // returns true when valid        

    $scope.$on('$routeChangeSuccess', _ => {
        var path = $location.path();
        if (path === '/my-profile') {
            var myProfileDisplay = document.querySelector('#myProfile')
            setTimeout(_ => getUserInfo($scope), 1000); // await firebase to load
            $scope.showMyProfile = true;
            $scope.$applyAsync();
        } else {
            $scope.showMyProfile = false;
            $scope.$applyAsync();
        }
    });
    initMap($scope);

    $scope.updatePost = _ => updatePost($scope);
    $scope.removeMushroom = mushroomId => {

        firebase.database().ref('mushrooms/' + mushroomId).remove();
    }

}


var loginButton = document.querySelector('#loginButton')
var logOutButton = document.querySelector('#logOutButton');

//redirect to facebook login
function login() {
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        logOutButton.style.display = '';
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
    });
}

function logOut() {
    firebase.auth().signOut();
}

function showLoginScreen() {
    document.querySelector('#uploadForm').style.display = 'none';
    document.querySelector('#loginSection').style.display = '';
}

function hideLoginScreen() {
    document.querySelector('#uploadForm').style.display = '';
    document.querySelector('#loginSection').style.display = 'none';
}


function getMushroomPost() {
    var user = firebase.auth().currentUser;
    firebase.database().ref('mushrooms/').orderByChild('userId').equalTo(user.uid).once("value")
        .then(function(snapshot) {
            console.log(snapshot.val());
        });
}

function clearUserProfile() {
    var myUserId = firebase.auth().currentUser.providerData[0].uid;
    firebase
        .database()
        .ref('mushrooms/')
        .orderByChild('userId')
        .equalTo(myUserId)
        .on('value', snapshot => {
            snapshot.forEach(function(child) {
                firebase.database().ref('mushrooms/' + child.key).remove();
            });
        });
    window.location.hash = '#!'
}

async function updatePost(angularScope) {
    angularScope.uploadInProgress = 1;
    angularScope.$applyAsync();
    await delay(50);
    angularScope.uploadInProgress = 40;
    angularScope.$applyAsync();
    var location = await getLocation(angularScope);
    angularScope.uploadInProgress = 80;
    angularScope.$applyAsync();
    //Reference the document
    var imageUrl = await uploadPicture();
    angularScope.uploadInProgress = 100;
    angularScope.$applyAsync();
    var newMushroomId = firebase.database().ref().child('mushrooms').push().key;

    var userId = firebase.auth().currentUser.providerData[0].uid;
    var sessionsRef = firebase.database().ref("sessions");
    await firebase.database().ref().update({
        ['/mushrooms/' + newMushroomId]: {
            name: document.querySelector('input[data-input="name"]').value,
            image: imageUrl,
            description: document.querySelector('textarea').value,
            lat: location.coords.latitude,
            long: location.coords.longitude,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userId: userId
        }
    });
    angularScope.uploadInProgress = 0;
    angularScope.$applyAsync();
    console.log(angularScope.uploadInProgress)
    var form = document.forms[0];
    form.reset(); // clear the form
    form.oninput(); // invoke the onclick function manually to trigger angular $digest
    document.querySelector('#imgUpload').removeAttribute('src');

}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getLocation(angularScope) {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                resolve(position);
                showPosition(position, angularScope)
            }, error => {
                reject(error);
                angularScope.geolocationAvailable = false;
                console.log(getErrorMessage(error));
            });
        } else {
            // show that the browser doesn't support geolocation 
        }
    });
}

function showPosition(position, angularScope) {
    angularScope.geolocationAvailable = true;
    //manually trigger $digest loop
    angularScope.$applyAsync();
    console.log('Latitude: ' + position.coords.latitude +
        'Longitude: ' + position.coords.longitude);
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
//The submit button is disabled
//name is required
//picture is required 
//validate form in from input
//if form is valid, then enable the submit button
//if the button is clicked for the first time, disabled the submit button and show error message
//else disable the submit button, send the picture and wait for response
//get the picture URL and send the name and description and picture URL to database
//clear form

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



async function uploadPicture() {
    var files = document.querySelector('input[type="file"]').files;
    var storageRef = firebase.storage().ref();
    var file = files[0];
    if (!file) return;
    var fileName = file.name.split('.'); //split the file on extension, for example mushroom.jpg will become ['mushroom','jpg'] to preserve the original extension
    fileName[0] = uuid(); // replace the filename with UUID for uniqueness of images
    fileName = fileName.join('.'); // join the array with a dot preserving the original extension and only replacing the first part of filename
    var mushroomRef = storageRef.child(fileName);
    await mushroomRef.put(file);
    return mushroomRef.getDownloadURL();
}

function showChosenImg(files) {
    var file = files[0];
    if (!file) return;
    var reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = function(event) {
        document.querySelector('#imgUpload').setAttribute('src', event.target.result)
    };

}

// Automatically called by Google Maps, it has to have this particular name

function initMap(angularScope) {
    var map = new google.maps.Map(document.querySelector('.map'), {
        center: { lat: 56.049580999999996, lng: 12.7216703 },
        zoom: 10
    });

    angularScope.$watch('filteredMushrooms', _ => {
        showMushroomsOnTheMap(map, angularScope.filteredMushrooms);
    }, true);
};

var mapMarkers = [];

function showMushroomsOnTheMap(map, mushrooms) {
    var infowindow = new google.maps.InfoWindow();

    clearAllMarkers();
    mushrooms.forEach(mushroom => {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(mushroom.lat, mushroom.long),
            map: map
        });
        mapMarkers.push(marker)

        google.maps.event.addListener(marker, 'click', function showMarkerBubble() {
            infowindow.setContent(mushroom.name + ' - ' + mushroom.description);
            infowindow.open(map, marker);

        });
    });
}

function clearAllMarkers() {
    mapMarkers.forEach(marker => marker.setMap(null));
    mapMarkers = [];
}

function getUserInfo(angularScope) {
    var myUser = firebase.auth().currentUser
    if (!myUser) return;
    var myUserId = myUser.providerData[0].uid;
    document.querySelector('#userName').textContent = myUser.displayName + '\'s mushrooms: ';
    angularScope.$watch('mushrooms', _ => {
        console.log(angularScope.mushrooms);
        angularScope.myMushrooms = angularScope.mushrooms.filter(mushroom => mushroom.userId === myUserId);
        angularScope.$applyAsync();
    }, true);
}