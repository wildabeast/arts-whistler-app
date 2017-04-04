// Code for platform detection
var isMaterial = Framework7.prototype.device.ios === false;
var isIos = Framework7.prototype.device.ios === true;
var map, fetchEventsState, events;

// Add the above as global variables for templates
Template7.global = {
  material: isMaterial,
  ios: isIos,
};

// A stringify helper
// Need to replace any double quotes in the data with the HTML char
//  as it is being placed in the HTML attribute data-context
function stringifyHelper(context) {
  var str = JSON.stringify(context);
  return str.replace(/"/g, '&quot;');
}

// Finally, register the helpers with Template7
Template7.registerHelper('stringify', stringifyHelper);

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

if (!isIos) {
  // Change class
  $$('.view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
  // And move Navbar into Page
  $$('.view .navbar').prependTo('.view .page');
}

// Initialize app
var myApp = new Framework7({
  material: isIos? false : true,
  template7Pages: true,
  precompileTemplates: true,
  swipePanel: 'left',
  swipePanelActiveArea: '30',
  swipeBackPage: true,
  animateNavBackIcon: true,
  pushState: !!Framework7.prototype.device.os,
});

// Add view
var mainView = myApp.addView('.view-main', {
  // Because we want to use dynamic navbar, we need to enable it for this view:
  dynamicNavbar: true,
  domCache: true,
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function deviceIsReady() {
  console.log('Device is ready!');

  fetchEvents();
});

$$(document).on('click', '.panel .discover-link', function discoverLink() {
  // Only change route if not already on the index
  //  It would be nice to have a better way of knowing this...
  var indexPage = $$('.page[data-page=index]');
  if (indexPage.hasClass('cached')) {
    mainView.router.load({
      pageName: 'index',
      animatePages: false,
      reload: true,
    });
  }
});

$$(document).on('click', '.panel .events-link', function eventsLink() {
  // @TODO fetch the favorites (if any) from localStorage
  //var favorites = JSON.parse(localStorage.getItem('favorites'));

  mainView.router.load({
    template: myApp.templates.events,
    animatePages: false,
    context: {
      events: events,
      fetchEventsState: fetchEventsState
    },
    reload: true,
  });
});

$$(document).on('click', '.panel .culturemap-link', function culturemapLink() {
  mainView.router.load({
    template: myApp.templates.culturemap,
    animatePages: false,
    context: {
      events: null
    },
    reload: true,
  });
});

myApp.onPageInit('culturemap', function(page) {

  console.log('culturemap init');
  var div = document.getElementById("map_canvas");

  //if (typeof map === 'undefined') {
    // Initialize the map view
    map = plugin.google.maps.Map.getMap(div);

    // Wait until the map is ready status.
    map.addEventListener(plugin.google.maps.event.MAP_READY, onMapReady);
  //}

});

$$(document).on('click', '.panel .about-link', function aboutLink() {
  mainView.router.load({
    template: myApp.templates.about,
    animatePages: false,
    context: {
      events: null
    },
    reload: true,
  });
});

$$('.panel-left').on('panel:opened', function () {
    if (typeof map != 'undefined') {
      console.log('setting clickable to false');
      map.setClickable(false);
    }
});
$$('.panel-left').on('panel:closed', function () {
    if (typeof map != 'undefined') {
      console.log('setting clickable to true');
      map.setClickable(true);
    }
});

function onMapReady() {

  // Move to the position with animation
  map.animateCamera({
    target: {lat: 50.117774, lng: -122.9544902},
    zoom: 17,
    tilt: 60,
    bearing: 140,
    duration: 5000
  }, function() {

    // Add a maker
    map.addMarker({
      position: {lat: 50.117774, lng: -122.9544902},
      title: "Arts Whistler",
      snippet: "Its the home base.",
      animation: plugin.google.maps.Animation.BOUNCE
    }, function(marker) {

      // Show the info window
      // marker.showInfoWindow();

      // Catch the click event
      marker.on(plugin.google.maps.event.INFO_CLICK, function() {

        // To do something...
        alert("Hello world!");

      });
    });
  });
}

function fetchEvents() {
  fetchEventsState = 'pending';
  $$.ajax({
    url: 'js/events.json',
    success: function searchSuccess(resp) {
      var result = eval('(' + resp + ')');
      events = result.events;
      fetchEventsState = 'success';
    },
    error: function searchError(xhr, err) {
      fetchEventsState = 'failure';
      console.log(err);
    }
  });
}
