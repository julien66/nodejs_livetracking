/**
 * @File
 *
 * Tracker object
 */

// geolocation watch.
var watch_id = null;
// Date at the moment when the tracking was activated.
var startDate;
// A tracking is being requested. Boolean
var trackRequest = false;
// Tracking mode. boolean
var track = false;
// Minimal capture accuracy.
var minAccuracy = 100;
var t;
var outTime = 10000;

//navigator.geolocation.getCurrentPosition(onSuccess, onError);

var tracker = {
  startTracking : function() {
    if (watch_id == null) {
      startDate = new Date();
      $("#startTracking_start").closest('.ui-btn').hide();
      $("#startTracking_stop").closest('.ui-btn').show();
      $("#startTracking_status").html("Recherche GPS.");
      watch_id = navigator.geolocation.watchPosition(getPoint, onError, {timeout: 5000, maximumAge: 500, enableHighAccuracy: true });
      trackRequest = true;
      createTimeout();
    }
  },

  stopTracking : function(){
    if (tracking_data.length > 1) {
      var baseDate = startDate.getDate().toString() + "/" + (startDate.getMonth()+1).toString() + "/" + startDate.getFullYear().toString() + " " + startDate.getHours().toString()+ ":" + (startDate.getMinutes()<10?'0':'') + startDate.getMinutes();
      database.insertTrack([startDate.getTime(), baseDate,JSON.stringify(tracking_data)], successInsert(true));
    }
    else {
      successInsert(false);
    }
    trackRequest = false;
  },  
}

/**
 * Create a timeout that request a getCurrentPosition if none is sent during 
 * x seconds. 
 */
function createTimeout() {
  t = setTimeout(function() {
    navigator.geolocation.getCurrentPosition(getPoint, onError, {enableHighAccuracy: true });
  }, outTime);
}

/**
 * Success Handler for geolocation.watchPosition
 *
 * @param (object) position
 */
function getPoint(position) {
  // Variometer
  var vario;
  // We don't wan't non accurate point.
  if (position.coords.accuracy < minAccuracy ) {
    tracking_data.push(position);
    if (tracking_data.length < 3) {
			$("#startTracking_status").html("Looking for GPS... Please check that you have activated on your system and find the best place to get a signal");
			if (track == false) {
			  track = true;
			}
		}
		else {
		  $("#startTracking_status").html(tracking_data.length + " point(s) have been recorded<br> Tracking is on.");
			$(".isTracking").buttonMarkup({
			  'theme':'b',
			  'icon':'check'
			});
			vario = (position.coords.altitude - tracking_data[tracking_data.length-2].coords.altitude) / ((position.timestamp - tracking_data[tracking_data.length-2].timestamp) * 0.001);
		}
		var lat = Math.round(position.coords.latitude * 10000000)/ 10000000;
		var lon = Math.round(position.coords.longitude * 10000000)/10000000;
		var altitude = Math.round(position.coords.altitude);
		var speed = Math.round(position.coords.speed * 3.6 * 100) /100;
		var accuracy = Math.round(position.coords.accuracy);
		vario = Math.round(vario * 100) /100;
		if (!vario) {vario = 0;}
		var url = website + ":" + port;
		if (debug == true) {
		  console.log("Preparing to send at : " + url);
		}
		$.ajax({
		  url: url + "?" + "leolive=1" + "&user=" + login + "&pass=" + password + "&client=Drupal_livetracking" + "&uuid=uuid-" + device.uuid + "&lat=" + lat + "&lon=" + lon + "&alt=" + altitude + "&sog=" + speed + "&precision=" + accuracy + "&vario=" + vario + "&tm=" + position.timestamp,
		  /*data: JSON.stringify({
		    "uuid" : 'uuid-'+device.uuid,
		    "lat" : lat,
		    "lon" : lon,
		    "altitude" : altitude,
		    "vitesse" : speed,
		    "precision" : accuracy,
		    "vario" : vario,
		    "timestamp" : position.timestamp
		   }),
		   contentType:"application/json; charset=utf-8",*/
		   success: function() {
		    if(debug == true) {
		      console.log("envoyé");
		    }
		   }
		});

		$("#startTracking_debug").html(
		  url + '<br/>' +
		  'Latitude: ' + lat + '</br>' +
		  'Longitude: ' + lon + '</br>' +
		  'Précision: ' + accuracy + ' m </br>' +
		  'Altitude: ' + altitude + ' m </br>' +
	    'Vario: ' + vario + ' m/s </br>' +
	    'Vitesse: ' + speed + ' Km/h </br>'
	  );
	}
	
	clearTimeout(t);
  createTimeout();
}

/**
	* Handler Error 
	*
	* @param object error
	*/
function onError(error) {
  if (track == true) {
    $(".isTracking").buttonMarkup({ 'theme': "e", 'icon':"delete" });
    track = false;
  }
  $("#startTracking_status").html(tracking_data.length + " point(s) have been recorded. Tracking fails during the last try. Check your GPS");
  clearTimeout(t);
  createTimeout();
}

// Success handler for track insert.
function successInsert(bool) {
  // Clear geolocation.
  clearTimeout(t);
  navigator.geolocation.clearWatch(watch_id);
  $("#startTracking_start").closest('.ui-btn').show();
  $("#startTracking_stop").closest('.ui-btn').hide();
  $("#startTracking_status").html("");
  $("#startTracking_debug").html("");
  $("#tracks_recorded").html("");
  if (track == true) {
    $(".isTracking").buttonMarkup({
      'theme':'e',
      'icon':'delete'
    });
    track = false;
  }
  watch_id = null;
  tracking_data = [];
  if (bool == false) {
    navigator.notification.confirm(
      "Track is empty and won't be inserted",
      function() {
      },
      'Warning',
			Array('Ok')
		);
  }
  else {
    navigator.notification.confirm(
      'Track inserted successfully',
      function() {
      },
      'Success',
			Array('Ok')
		);
  }
}
