// Code for platform detection
var isMaterial = Framework7.prototype.device.ios === false;
var isIos = Framework7.prototype.device.ios === true;
var map, fetchEventsState, events, locations;

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
  fetchLocations();
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

$$(document).on('click', '.events-link', function eventsLink() {
  // @TODO fetch the favorites (if any) from localStorage
  //var favorites = JSON.parse(localStorage.getItem('favorites'));

  mainView.router.load({
    template: myApp.templates.events,
    animatePages: false,
    context: events,
    reload: true,
  });
});

$$(document).on('click', '.culturemap-link', function culturemapLink() {
  mainView.router.load({
    template: myApp.templates.culturemap,
    animatePages: false,
    reload: true
  });
});

$$(document).on('click', '.about-link', function aboutLink() {
  mainView.router.load({
    template: myApp.templates.about,
    animatePages: false,
    context: {
      events: null
    },
    reload: true,
  });
});

$$(document).on('click', '.events-back', function eventsBack() {
  myApp.showPreloader();
  fetchEvents(events.index - 1, function() {
    myApp.hidePreloader();
    mainView.router.load({
      template: myApp.templates.events,
      animatePages: false,
      context: events,
      reload: true,
    });
  });
});

$$(document).on('click', '.events-forward', function eventsBack() {
  myApp.showPreloader();
  fetchEvents(events.index + 1, function() {
    myApp.hidePreloader();
    mainView.router.load({
      template: myApp.templates.events,
      animatePages: false,
      context: events,
      reload: true,
    });
  });
});

myApp.onPageInit('culturemap', function(page) {

  var div = document.getElementById("map_canvas");

  //if (typeof map === 'undefined') {
    // Initialize the map view
    map = plugin.google.maps.Map.getMap(div);

    // Wait until the map is ready status.
    map.addEventListener(plugin.google.maps.event.MAP_READY, onMapReady);
  //}

});

$$('.panel-left').on('panel:opened', function () {
    if (typeof map != 'undefined') {
      map.setClickable(false);
    }
});
$$('.panel-left').on('panel:closed', function () {
    if (typeof map != 'undefined') {
      map.setClickable(true);
    }
});

function onMapReady() {

  // Move to the position with animation
  map.moveCamera({
    target: {lat: 50.117774, lng: -122.9544902},
    zoom: 15
  }, function() {

    locations.forEach(function(loc) {
      map.addMarker({
        position: { lat: loc.lat, lng: loc.long},
        title: loc.title
      })
    });

  });
}

function fetchEvents(index=0, cb) {
  fetchEventsState = 'pending';
  $$.ajax({
    url: 'http://artswhistler.com/calendar/action~posterboard/page_offset~' + index + '/cat_ids~40,32,39,38,34/request_format~json?request_type=json&ai1ec_doing_ajax=true',
    success: function searchSuccess(resp) {
      events = parseEvents(eval('(' + resp + ')'));
      events.index = index;
      fetchEventsState = 'success';
      if (typeof cb == 'function') cb();
    },
    error: function searchError(xhr, err) {
      fetchEventsState = 'failure';
      console.log(err);
      if (typeof cb == 'function') cb();
    }
  });
}

function parseEvents(resp) {
  var events = [];
  var dates = resp.html.dates;
  for (var key in dates) {
    if (dates.hasOwnProperty(key)) {
      events = events.concat(dates[key].events.allday);
      events = events.concat(dates[key].events.notallday);
    }
  }
  return {
    events: events,
    title: resp.html.title
  };
}

function fetchLocations() {
  fetchEventsState = 'pending';
  $$.ajax({
    url: 'js/locations.json',
    success: function searchSuccess(resp) {
      locations = eval('(' + resp + ')');
      //fetchEventsState = 'success';
    },
    error: function searchError(xhr, err) {
      fetchEventsState = 'failure';
      console.log(err);
    }
  });
}
