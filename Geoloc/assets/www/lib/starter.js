/**
	A Javascript file by Julien Garcia
**/

$(document).ready( function() {

    document.addEventListener("deviceready", systemReady, true);
	/* On va modifier tout cela pour que cela roule avec nodejs et Drupal */
	
    function systemReady(){ // Le système est prêt.

	var watch_id = null;    // ID of the geolocation
	var tracking_data = []; // Array containing GPS position objects
	var startDate;
	var internet = false;
	var track = false;
	
	var data;
	var key;
	
	// Retrieving the local parameter
	if ( window.localStorage.getItem("civl") ){
		$("#civl_id").val(window.localStorage.getItem("civl"));
	}
	
	// Réinitialiser le stockage local.
	$("#home_clearstorage_button").live('click', function(){
    		window.localStorage.clear();
	});

	// When the user views the history page
	$('#history').live('pageshow', function () {
		  // Count the number of entries in localStorage and display this information to the user
		  tracks_recorded = window.localStorage.length;
		  if (tracks_recorded - 1 < 0 ){ tracks_recorded = 1 ;}
  		  $("#tracks_recorded").html("<strong>" + (tracks_recorded - 1) + "</strong> Trace(s) enregistr&eacute;e(s)");
  		  // Empty the list of recorded tracks
  		  $("#history_tracklist").empty();
  		 // Iterate over all of the recorded tracks, populating the list
  		 for(i=0; i<tracks_recorded; i++){
			if (window.localStorage.key(i) != "civl"){
				$("#history_tracklist").append("<li><a href='#track_info' data-ajax='false'>" + window.localStorage.key(i) + "</a></li>"); 
			}
 		}
  		// Tell jQueryMobile to refresh the list
  		$("#history_tracklist").listview('refresh');
	});

	$("#history_tracklist li a").live('click', function(){
		$("#track_info").attr("track_id", $(this).text());
	});

	// When the user views the Track Info page
	$('#track_info').live('pageshow', function(){
  		// Find the track_id of the workout they are viewing
  		key = $(this).attr("track_id");
  		// Update the Track Info page header to the track_id
  		$("#track_info div[data-role=header] h1").text(key);
  		// Get all the GPS data for the specific workout
  		data = window.localStorage.getItem(key);
  		// Turn the stringified GPS data back into a JS object
  		data = JSON.parse(data);	

		// Set the initial Lat and Long of the Google Map
		if (data.length > 0){
			var myLatLng = new google.maps.LatLng(data[0].coords.latitude, data[0].coords.longitude);
		}
		else{
			var myLatLng = new google.maps.LatLng(42.55, 1.53);
		}
		// Google Map options
		var myOptions = {
  		  zoom: 15,
		  center : myLatLng,
  		  mapTypeId: google.maps.MapTypeId.TERRAIN
		};
		// Create the Google Map, set options
		var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
		var trackCoords = [];
		// Add each GPS entry to an array
		for(i=0; i<data.length; i++){
    			trackCoords.push(new google.maps.LatLng(data[i].coords.latitude, data[i].coords.longitude));
		}
		// Plot the GPS entries as a line on the Google Map
		var trackPath = new google.maps.Polyline({
  		path: trackCoords,
  		strokeColor: "#FF0000",
  		strokeOpacity: 1.0,
  		strokeWeight: 2
		});
		// Apply the line to the map
		trackPath.setMap(map);
	});		

	
	// When the user send the fullTrack to the server.
	$('#sendIt').live('click',function(){	
		$.post("http://188.165.192.213/geolocffvl/geo.php", {
			pID: window.localStorage.getItem("civl"), 
			deviceID: device.uuid, 
			baseTime: data[0].timestamp*0.001,
			log : data
		},
		function(data){
			console.log(data);
		});		
		console.log(data[0].timestamp);
	});
	
	// When the user erase the fulltrack from the local storage.
	$('#deleteIt').live('click',function(){
		window.localStorage.removeItem(key);
	});


	// Listen to the connection !!
	document.addEventListener("online", onOnline, false);
	function onOnline() {
	    // Handle the online event
		if (internet == false){
	    $(".internet").buttonMarkup({'theme':"b", 'icon':"check" });
	  internet = true;
		}
	}

	document.addEventListener("offline",onOffline, false);
	function onOffline(){
	   // Handle the offline event
	    if (internet == true){
	    $(".internet").buttonMarkup({ 'theme': "e", 'icon':"delete" });
	    internet = false;
		}
	}

	// When the user start the tracker.
	$("#startTracking_start").live('click', function(){
		if (isNumber($("#civl_id").val()) == true ){
			window.localStorage.setItem("civl", $("#civl_id").val() );
			if (watch_id == null){
				startDate = new Date();
				$("#startTracking_start").text("Tracking !");
				watch_id = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 5000, frequency: 3000,enableHighAccuracy: true });
			}
		}
		else{
			alert("Renseignez votre CIVL ID !");
		}
	});

	// When the user stop the tracker.
	$("#startTracking_stop").live('click', function(){
		if (watch_id != null){
			navigator.geolocation.clearWatch(watch_id); // Clear geolocation.
			window.localStorage.setItem( window.localStorage.length+" - "+ startDate.getDate().toString() + "/"+
                  startDate.getMonth().toString() + "/"+startDate.getFullYear().toString(), JSON.stringify(tracking_data) ); // Trace stockée.
			console.log(startDate.getDate().toString() + "/"+
                  startDate.getMonth().toString() + "/"+startDate.getFullYear().toString());
			$("#startTracking_start").text("Commencer le tracking ")
			$("#startTracking_status").html("");
			if (track == true){
			$(".isTracking").buttonMarkup({'theme':'e', 'icon':'delete'});
			track = false;
			}
			watch_id = null;			
			tracking_data = [];
		}		
	});
		

	var onSuccess = function(position) {
		tracking_data.push(position);
		$("#startTracking_status").html(tracking_data.length+" point(s) ont &eacute;t&eacute; enregistr&eacute;e(s)<br> Le trackeur fonctionne normalement.");
		if (track == false){
		 $(".isTracking").buttonMarkup({'theme':'b', 'icon':'check'});
		track = true;
		}

		// J'envoi au live :
		$.post("http://188.165.192.213/geolocffvl/livegeo.php", {
			pID: window.localStorage.getItem("civl"), 
			deviceID: device.uuid, 
			baseTime: startDate.getTime()*0.001,
			log : position
		}/*,
		function(data){
			console.log(data);
		}*/);		
		
    	  	/*alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');*/
	};

	// onError Callback receives a PositionError object
	//
	function onError (error) {
    		/*alert('code: '    + error.code    + '\n' +
          	'message: ' + error.message + '\n');*/
		console.log("Position foireacute;e... " + error);
		if (track == true){
		$(".isTracking").buttonMarkup({ 'theme': "e", 'icon':"delete" });
		track = false;
		}
		$("#startTracking_status").html(tracking_data.length+" point(s) ont &eacute;t&eacute; enregistr&eacute;e(s). Le trackeur a &eacute;chou&eacute; en enregistrant le dernier point. V&eacute;rifiez le GPS (fonctionnement et reception)");
	}


    } // systemReady

}); // Document ready jQuery.

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

