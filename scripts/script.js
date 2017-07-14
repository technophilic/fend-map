/**
 * Created by Vineeth on 07-07-2017.
 */
var map;

/**
 * @description A function to retrieve data from 'zomato' 3rd party api.
 */
function getData() {
    $.ajax({
        url: 'https://developers.zomato.com/api/v2.1/search',
        headers: {
            "user-key": "91aa69a25fed30f84bd9be60d0d9e2f7", //Api keys of the zomato api
            "Accept": "application/json"
        },
        type: 'GET',
        data: {
            'q': 'Hotel',
            'lat': '13.0891',
            'lon': '80.2096',
            'sort': 'rating'
        },
        success: function(result) {
            ko.applyBindings(new AppViewModel(result)); //Bootstraps the knockout js framework
        },
        error: function(err) {
            console.log(err);
            Materialize.toast('Unable to fetch the data ,Sorry for the inconvenience caused.'); //Error handling
        }
    });
}

/**
 * @description A callback function which is called when maps api is loaded. This function initialises the map.
 */
function initMap() {
    var location = {
        lat: 13.0715,
        lng: 80.2415
    };
    map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 13
    });
    getData(); //fetch data from 3rd party api once the map is loaded
}

/**
 * @description A callback function which is called when maps api is loaded .
 * @param x{Array} - Array of all restaurants
 * @param ele{String} - filter word which was typed
 * @return {Array} - filtered restaurants
 */
function filterByName(x, ele) {
    return x.filter(function(i) {
        var isVisible = i.name.toLowerCase().search(ele) !== -1;
        i.visible(isVisible); // To hide the markers in the map if needed
        return isVisible;
    });
}

/**
 * @description A function to format the name of restaurants properly
 * @param x{String} - Unformatted name
 * @return {String} - Formatted name
 */
function processName(x) {
    var i = x.search(' - ');
    i = (i === -1) ? 0 : i + 3;
    return x.slice(i);
}

/**
 * @description A class representing a restaurant.
 * @param t{Object} - Object retrieved from ajax calls
 */
function Restaurant(t) {
    var self = this;
    this.lat = t.location.latitude;
    this.lon = t.location.longitude;
    this.address = t.location.address;
    this.name = processName(t.name);
    this.cuisines = t.cuisines;
    this.thumb = t.thumb;
    this.rating = t.user_rating.aggregate_rating;
    this.visible = ko.observable(true);
    this.website = t.url;
    this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(self.lat, self.lon),
        animation: google.maps.Animation.DROP,
        map: map,
        title: self.name
    });
    this.toggleMarker = ko.computed(function() {
        if (self.visible())
            self.marker.setMap(map);
        else
            self.marker.setMap(null);
    });
    this.infowindow = new google.maps.InfoWindow({
        content: '<div><h5 style="width: 200px;">' + self.name + '</h5><p><b>Cuisines :</b><span>' + self.cuisines + '</span></p><img src="' + self.thumb + '" alt=""><div><p style="width: 200px;">' + self.address + '</p><h4>' + self.rating + '<span style="font-size: medium">/5</span></h4><a href="' + self.website + '">More tasty information <i style="font-size: 13px;" class="material-icons">open_in_browser</i></a></div><small>Powered by Zomato <a href="https://developers.zomato.com/documentation#/">api</a></small></div>'
    });
    this.openWindow = function() {
        self.infowindow.open(map, self.marker);
        self.marker.setAnimation(google.maps.Animation.BOUNCE); //For the bouncing animation  on click
        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 700);
    };
    self.marker.addListener('click', self.openWindow);
}

/**
 * @description A class representing the data model of the whole application.
 * @param data{Array} - Array retrieved from ajax calls containing all restaurant objects
 */
function AppViewModel(data) {
    var self = this;
    this.allRestaurants = [];
    this.filter = ko.observable('');
    data.restaurants.forEach(function(res, i) {
        if (i >= 10)
            return;
        var t = res.restaurant;
        var resSchema = new Restaurant(t); //Instantiating objects of the restaurants class
        self.allRestaurants.push(resSchema);

    });
    this.filteredList = ko.observableArray(self.allRestaurants);
    this.filterList = ko.computed(function() { //Kicks off the filtering if input changes
        var f = self.filter().toLowerCase();
        self.filteredList(filterByName(self.allRestaurants, f));
    });
    this.resetFilter = function() {
        self.filter('');
    };
}

/**
 * @description A function to make the Website responsive.
 */
$(function() {
    var $navClick = $("#nav-click");
    var $sideBar = $('#slide-out');
    $navClick.sideNav();
    $('#search').focus(function() {
        if ($sideBar.css('transform') !== "matrix(1, 0, 0, 1, 0, 0)") //Workaround for a bug in the css framework.
            $navClick.sideNav('show');
    });
});

/**
 * @description A function to handle errors from maps api.
 */
function onError() {
    Materialize.toast('Unable to fetch the map ,Sorry for the inconvenience caused.'); //Error handling
}