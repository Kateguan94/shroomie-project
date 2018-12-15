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
                resetUserImg[i].src = 'https://graph.facebook.com/104651290584023/picture';
            }
            var userImg = document.querySelectorAll('.userImg').src = 'https://graph.facebook.com/104651290584023/picture';
            console.log(userImg);
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
        // console.log($scope.formValid, $scope.geolocationAvailable)
    } // returns true when valid        

    $scope.$on('$routeChangeSuccess', _ => {
        var path = $location.path();
        if (path === '/my-profile') {
            var myProfileDisplay = document.querySelector('#myProfile')
            setTimeout(getUserInfo, 1000)
            // myProfileDisplay.style.display = '';
            $scope.showMyProfile = true;
            $scope.$applyAsync();
            // myProfileDisplay.classList.remove('ng-hide');
            // console.log(myProfileDisplay);
        } else {
            $scope.showMyProfile = false;
            $scope.$applyAsync();
        }
    });
    initMap($scope);

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
    //console.log(user)
    if (user) {
        user.providerData.forEach(function(profile) {
            //write user to firebase
            firebase.database().ref('mushrooms/' + user.uid).set({
                facebookId: profile.uid,
                facebookName: profile.displayName,
                facebookAvatar: profile.photoURL
            });
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
    user.delete().then(function() {
        // User deleted.
        //redirect to main page
        window.location.hash = '#!'
    }).catch(function(error) {
        console.log(error)
        alert(error);
    });
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
    var userId = firebase.auth().currentUser.uid;
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
    // var mushroomCollection = firebase.firestore().collection('mushrooms').doc(uuid())
    // await mushroomCollection.set({
    //     name: document.querySelector('input[data-input="name"]').value,
    //     image: imageUrl,
    //     description: document.querySelector('textarea').value
    // });
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
        zoom: 5
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

var container = document.querySelector('.container')
var myMushroomTileTemplate = document.querySelector('.myMushroomTile');
myMushroomTileTemplate.remove();

function getUserInfo() {
    var myUserId = firebase.auth().currentUser.uid;
    firebase.database().ref('mushrooms/').orderByChild('userId').equalTo(myUserId).once("value")
        .then(function(snapshot) {
            var myMushrooms = snapshot.val();
            if (!myMushrooms) {
                //if no result found, create div element with text "You haven't uploaded any mushrooms."
                var div = document.createElement('div');
                div.textContent = 'You haven\'t uploaded any mushrooms.';
                container.append(div);
            } else {
                container.textContent = '';
                var myMushroomList = Object.keys(myMushrooms).map(i => myMushrooms[i]);
                console.log(myMushroomList)
                myMushroomList.forEach(myMushroom => {
                    var myMushroomTile = myMushroomTileTemplate.cloneNode(true);
                    myMushroomTile.querySelector('.uploadedMushroom').src = myMushroom.image;
                    myMushroomTile.querySelector('.mushroomName').textContent = myMushroom.name;
                    var time = new Date(myMushroom.timestamp);
                    myMushroomTile.querySelector('.description').textContent = myMushroom.description;
                    myMushroomTile.querySelector('.createTime').textContent = 'Created at : ' + new Date(myMushroom.timestamp).toDateString();
                    container.appendChild(myMushroomTile);

                });
            }

        });
}