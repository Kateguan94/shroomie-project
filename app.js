angular
    .module('app', ['ngRoute', 'firebase'])
    .controller('MainController', ['$scope', '$firebaseArray', '$location', MainController])
    .controller('MyProfileController', ['$scope', '$firebaseArray', MyProfileController])
    .config(AppConfig);

function AppConfig($routeProvider) {
    $routeProvider.when('/', {
        // controller: 'MainController as mainController',
    }).when('/my-profile', {
        // controller: 'MyProfileController as myProfileController',
    });
}

var initialized = false;

function MainController($scope, $firebaseArray, $location) {
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
        console.log('auth changed', user);
        if (user) {

            var userId = firebase.auth().currentUser.uid;
            firebase.database().ref('/mushrooms/' + userId).once('value').then(function(snapshot) {
                var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
                console.log(username)
                // console.log($firebaseArray(snapshot))
            });

            var mushrooms = firebase.database().ref().child("mushrooms").child(userId)
            console.log($firebaseArray(mushrooms))


            // User is signed in.
            hideLoginScreen();
        } else {
            // No user is signed in.
            showLoginScreen();
        }
    });
    $scope.formValid = false;
    $scope.geolocationAvailable = false;
    // firebase.firestore().collection('mushrooms').get().then(querySnapshot => {
    //     $scope.mushrooms = [];
    //     querySnapshot.forEach(doc => {
    //         $scope.mushrooms.push(doc.data());
    //     });
    // });
    var ref = firebase.database().ref().child("mushrooms");
    $scope.mushrooms = $firebaseArray(ref);

    var form = document.querySelector('form');

    form.oninput = _ => {
        $scope.formValid = form.checkValidity();
        //manually trigger $digest loop
        $scope.$applyAsync();
        console.log($scope.formValid, $scope.geolocationAvailable)
    } // returns true when valid        

    $scope.$on('$routeChangeSuccess', _ => {
        var path = $location.path();
        if (path === '/my-profile') {
            document.querySelector('#myProfile').style.display = '';
            $scope.showMyProfile = true;
        } else {
            $scope.showMyProfile = false;
        }
    });
    initMap();
    // $scope.$on('$viewContentLoaded', function() {
    //     initMap();
    // });

    $scope.updatePost = _ => updatePost($scope);

}

function MyProfileController($scope, $firebaseArray) {

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
        console.log(user);
        logOutButton.style.display = '';

        // logOutButton.append('Log Out');
        // document.querySelector('#userLogin').appendChild(logOutButton);
        // logOutButton.onclick = logOut;

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
    firebase.auth().signOut().then(function() {
        // document.querySelector('#uploadForm').style.display = 'none';
        // document.querySelector('#loginSection').style.display = '';

        console.log('hi');
        // Sign-out successful.
    }).catch(function(error) {
        // An error happened.
    });
}

function checkUser() {
    //check if any user is signed in
    var user = firebase.auth().currentUser;
    if (user) {
        hideLoginScreen()
    } else {
        showLoginScreen()
    }
    console.log(user)
    if (user) {
        user.providerData.forEach(function(profile) {
            // function writeUserData(specificUID, name, email, PhotoURL) {
            firebase.database().ref('mushrooms/' + user.uid).set({
                facebookId: profile.uid,
                facebookName: profile.displayName,
                facebookAvatar: profile.photoURL
            });
            // }
            // // console.log("Sign-in provider: " + profile.providerId);
            // console.log("  Provider-specific UID: " + profile.uid);
            // console.log("  Name: " + profile.displayName);
            // console.log("  Email: " + profile.email);
            // console.log("  Photo URL: " + profile.photoURL);
        });
    }
}

function showLoginScreen() {
    document.querySelector('#uploadForm').style.display = 'none';
    document.querySelector('#loginSection').style.display = '';
}

function hideLoginScreen() {
    document.querySelector('#uploadForm').style.display = '';
    document.querySelector('#loginSection').style.display = 'none';
}



function deleteUser() {
    var user = firebase.auth().currentUser;
    console.log(user);
    user.delete().then(function() {
        // User deleted.
    }).catch(function(error) {
        // An error happened.
    });
}


async function updatePost(angularScope) {
    angularScope.uploadInProgress = 20;
    angularScope.$applyAsync();
    var location = await getLocation(angularScope);
    angularScope.uploadInProgress = 60;
    angularScope.$applyAsync();
    //Reference the document
    var imageUrl = await uploadPicture();
    angularScope.uploadInProgress = 100;
    angularScope.$applyAsync();
    var newMushroomId = firebase.database().ref().child('mushrooms').push().key;
    var userId = firebase.auth().currentUser.uid;
    await firebase.database().ref().update({
        ['/mushrooms/' + newMushroomId]: {
            name: document.querySelector('input[data-input="name"]').value,
            image: imageUrl,
            description: document.querySelector('textarea').value,
            lat: location.coords.latitude,
            long: location.coords.longitude,
            userId: userId
        }
    });
    angularScope.uploadInProgress = 0;
    angularScope.$applyAsync();
    console.log(angularScope.uploadInProgress)
    document.forms[0].reset();
    document.querySelector('#imgUpload').removeAttribute('src');
    // var mushroomCollection = firebase.firestore().collection('mushrooms').doc(uuid())
    // await mushroomCollection.set({
    //     name: document.querySelector('input[data-input="name"]').value,
    //     image: imageUrl,
    //     description: document.querySelector('textarea').value
    // });
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

function initMap() {
    var map = new google.maps.Map(document.querySelector('.map'), {
        center: { lat: 56.046467, lng: 12.694512 },
        zoom: 4
    });
    var locations = [

        // ['Stockholm', 59.329323, 18.068581],
        // ['hello', 56.046467, 12.694512],
        // ['Malmö', 55.604981, 13.003822],
        // ['Ystad', 55.429505, 13.820031],
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

function getUserInfo() {
    document.querySelector('#myProfile').style.display = '';

}