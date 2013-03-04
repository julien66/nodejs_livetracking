/**
	A Javascript PhoneGap file by Julien Garcia
**/

$(document).ready( function() {

    document.addEventListener("deviceready", systemReady, true);

    function systemReady(){ // Le système est prêt.	

	/** TO DO LIST **/
	/**  Stocker les bouts de traces en local storage de temps en temps pour ne pas tout perdre en cas de bug **/
	/**  => Est-ce que je peux, sotcker à chaque point ??? TEST ! **/

	var watch_id = null;    // ID of the geolocation
	var tracking_data = []; // Array containing GPS position objects
	var startDate;
	var internet = false;
	var track = false;	
	var ghost = false;	

	var data;
	var key;

	var ioFile = false;
	var gmapFile = false;	

	var iosocket;
	var nodejs = false;

	// Listen to the connection !!
	document.addEventListener("online", onOnline, false);
	function onOnline() { 	    // Handle the online event
	    if (internet == false){
	    	$(".internet").buttonMarkup({'theme':"b", 'icon':"check" });
	  	internet = true;
		 if (ioFile == false){
			 loadIO();
		}
		 else{
			connectSocket();
		}

		if (gmapFile == false){
			loadgMap(); // A reprendre !
		}
	    } // end if Internet == false
	}

	document.addEventListener("offline",onOffline, false);
	function onOffline(){    // Handle the offline event
	    if (internet == true){
	    	$(".internet").buttonMarkup({ 'theme': "e", 'icon':"delete" });
	    	internet = false;
	    }
	}

	function connectSocket(){
		// Lance la connection au socket.
		iosocket = io.connect("http://91.121.133.40:8080");
 		iosocket.on('connect', function () {
			// Gère la connection à nodejs.
			nodejs = true;
			$(".ffvl").buttonMarkup({'theme':"b", 'icon':"check" });
			iosocket.on('disconnect', function() { // Quand cela deconnecte !
				nodejs = false;
				$(".ffvl").buttonMarkup({'theme':"e", 'icon':"delete" });
				iosocket.removeListener('connect');
				iosocket.removeListener('client-authenticated');
				// Gère la déconnection à nodejs.
			});

			var authMessage = {
			    authToken: 'uuid-'+device.uuid,
			    contentTokens: undefined
			};

			iosocket.on('client-authenticated',function(message){ // Quand authentifié !
				console.log("recu");
				console.log(message);
			});

			iosocket.emit('authenticate', authMessage);
		});
	}

	$('#idTrack').html(device.uuid);
	

	$("#home_clearstorage_button").live('click', function(){ // Réinitialiser le stockage local.
		navigator.notification.confirm(
			'Voulez-vous vraiment effacer TOUTES les traces ?',
			clearAll,
			'Attention',
			'oui,non'
		);
	});

	function clearAll(bouton){
		if (bouton == 1){
			window.localStorage.clear();
			vibrate(500);
			//$.mobile.changePage( $('#history'), { reloadPage: true, transition: "none"} );
			rebuild_track_list();
		}
	}

	// When the user views the history page
	$('#history').live('pageshow', function () {
		  rebuild_track_list(); // Build track list.
	});

	function rebuild_track_list(){
		 // Count the number of entries in localStorage and display this information to the user
		  tracks_recorded = window.localStorage.length;
		  $("#tracks_recorded").html("<strong>" + (tracks_recorded) + "</strong> Trace(s) enregistr&eacute;e(s)");
  		  // Empty the list of recorded tracks
  		  $("#history_tracklist").empty();
  		 // Iterate over all of the recorded tracks, populating the list
  		 for(i=0; i<tracks_recorded; i++){
			var data = JSON.parse(window.localStorage.getItem(i.toString()));
			$("#history_tracklist").append("<li><a id='"+i.toString()+"' href='#track_info' data-ajax='false'>" + data[0] + "</a></li>"); 
 		}
  		// Tell jQueryMobile to refresh the list
  		$("#history_tracklist").listview('refresh');
	}

	$("#history_tracklist li a").live('click', function(){
		$("#track_info").attr("track_id", $(this).attr('id')); // En cas de clic sur un vol, passe le numéro du vol à la page d'info.
	});

	// When the user views the Track Info page
	$('#track_info').live('pageshow', function(){
  		key = $(this).attr("track_id"); // Récupère le numéro du vol.
  		data = JSON.parse(window.localStorage.getItem(key)); // Get Item and Turn the stringified data back into a JS object
		$("#track_info div[data-role=header] h1").text(data[0]); // Update the Track Info page header to the track_id
		var myLatLng;
		// Set the initial Lat and Long of the Google Map
		if (data[1].length > 0){
			myLatLng = new google.maps.LatLng(data[1][0].coords.latitude,  data[1][0].coords.longitude);
		}
		else{
			myLatLng = new google.maps.LatLng(42.55, 1.53);
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
		for(i=0; i<data[1].length; i++){
    			trackCoords.push(new google.maps.LatLng(data[1][i].coords.latitude, data[1][i].coords.longitude));
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
	$('#sendIt').live('click',function(){ // Envoi à un service Drupal... /services-gettrack/gettrack/  ==> POSTGIS
		$.post("http://ks201694.kimsufi.com/services-gettrack/gettrack/"+device.uuid, {
			log : data
		},
		function(result){
			if (result == "CREATE OK"){
				navigator.notification.alert(
            				'La trace a bien été enregistré sur le serveur de la FFVL',  // message
            				vibrate(500),         // callback
            				'Merci',            // title
            				'OK'                  // buttonName
        			);
			}
		});		
		//console.log(data[0].timestamp);
	});
	
	// When the user erase the fulltrack from the local storage.
	$('#deleteIt').live('click',function(){
		navigator.notification.confirm(
			'Souhaitez-vous vraiment effacer cette trace ?', // message
			 onDeleteConfirm, // callback
			 'Attention', // title
			 'OUI, NON' // buttonsName
		);
	});


	function onDeleteConfirm(button) {
		if (button == 1){
			window.localStorage.removeItem(key); // Efface le stockage. 
			vibrate(500); // vibre.
			$.mobile.changePage($("#history"),"none");// Retourne à l'historique.
		}
	}


	$("#startTracking").live('pageshow', function(){
		$("#startTracking_stop").closest('.ui-btn').show();
		$('#startTracking_ghost').closest('.ui-btn').show();

		if (track == false){
			$("#startTracking_stop").closest('.ui-btn').hide();
			$('#startTracking_ghost').closest('.ui-btn').hide();
		}
		else if (track == true){
			$("#startTracking_start").closest('.ui-btn').hide();
		}
	});

	// When the user start the tracker.
	$("#startTracking_start").live('click', function(){
		if (watch_id == null){
			startDate = new Date();
			$("#startTracking_start").closest('.ui-btn').hide();
			$("#startTracking_stop").closest('.ui-btn').show();
			$('#startTracking_ghost').closest('.ui-btn').show();
			$("#startTracking_ghost").text("Activer le mode fantome");
			$('#startTracking_ghost').button('refresh');			
			$("#startTracking_ghost").buttonMarkup({'theme':'b'});
			ghost = false;
			$("#startTracking_status").html("Recherche GPS.");
			watch_id = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 5000, maximumAge: 0,enableHighAccuracy: true });
		}
	});

	$("#startTracking_ghost").live('click', function(){ // When the user enable or disable ghost function
		if (ghost == false){
			navigator.notification.confirm(
				"Le mode fantome continue d'envoyer votre position au serveur FFVL mais ne la communique pas publiquement sur le site. Voulez-vous activer ce mode ?", // message
				 function(i){
					if (i == 1){
						$("#startTracking_ghost").text("Desactiver le mode fantome");
						$('#startTracking_ghost').button('refresh');
						$("#startTracking_ghost").buttonMarkup({'theme':'e'});
						ghost = true;
					}
				 }, // callback
				 'Attention', // title
				 'OUI, NON' // buttonsName
			);
		}
		else {						
			$("#startTracking_ghost").text("Activer le mode fantome");
			$('#startTracking_ghost').button('refresh');			
			$("#startTracking_ghost").buttonMarkup({'theme':'b'});
			ghost = false; 
		}
	});

	// When the user stop the tracker.
	$("#startTracking_stop").live('click', function(){
		navigator.notification.confirm(
			'Voulez-vous vraiment arreter le tracking ?', // message
			function(i){
				if (i == 1){
				if (typeof watch_id != 'function'){
					navigator.geolocation.clearWatch(watch_id); // Clear geolocation.
					var dat = startDate.getDate().toString() + "/"+ (startDate.getMonth()+1).toString() + "/"+startDate.getFullYear().toString()+" "+startDate.getHours().toString()+":"+(startDate.getMinutes()<10?'0':'') + startDate.getMinutes();
					window.localStorage.setItem( window.localStorage.length.toString() , JSON.stringify([dat, tracking_data]) ); // Trace stockée.
					$("#startTracking_start").closest('.ui-btn').show();
					$("#startTracking_stop").closest('.ui-btn').hide();
					$('#startTracking_ghost').closest('.ui-btn').hide();
					$("#startTracking_status").html("");
					if (track == true){
						$(".isTracking").buttonMarkup({'theme':'e', 'icon':'delete'});
						track = false;
					}
					watch_id = null;			
					tracking_data = [];
				}
				}
			}, // callabck
			'Attention',
			'OUI, NON'
			);		
	});
		

	var onSuccess = function(position) {
		tracking_data.push(position);

		/*var dat = startDate.getDate().toString() + "/"+ (startDate.getMonth()+1).toString() + "/"+startDate.getFullYear().toString()+" "+startDate.getHours().toString()+":"+(startDate.getMinutes()<10?'0':'') + startDate.getMinutes();

		if (tracking_data.length == 1){ 
			window.localStorage.setItem( (window.localStorage.length).toString(), JSON.stringify([dat, tracking_data])  ); // Test keep every single point to local storage !!
		}
		else{ 
			window.localStorage.setItem( (window.localStorage.length -1).toString(), JSON.stringify([dat, tracking_data])  ); // Test keep every single point to local storage !!
		}*/
		if (tracking_data.length < 3){
			$("#startTracking_status").html("Recherche GPS... V&eacute;rifiez que le GPS soit activ&eacute; et qu'il recoive bien un signal");
			if (track == false){
				track = true;
			}
		}
		else{
			$("#startTracking_status").html(tracking_data.length+" point(s) ont &eacute;t&eacute; enregistr&eacute;e(s)<br> Le trackeur fonctionne normalement.");
			$(".isTracking").buttonMarkup({'theme':'b', 'icon':'check'});
		}
		
		// J'envoi à nodejs :
		if (nodejs){
			var posMessage = { 
				type : 'tracker-location',
				position : position,
				device : device.uuid,
				ghost : ghost,
				basetime : startDate.getTime()*0.001,
				callback : 'nodejsGeoloc',
				channel : 'tracking',
			};
			iosocket.emit('message', posMessage);		
		}
    	  	console.log('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');
	};

	// onError Callback receives a PositionError object
	//
	function onError(error) {
    		/*alert('code: '    + error.code    + '\n' +
          	'message: ' + error.message + '\n');*/
		console.log("Position foire&eacute;e... " + error);
		if (track == true){
			$(".isTracking").buttonMarkup({ 'theme': "e", 'icon':"delete" });
			track = false;
		}
		$("#startTracking_status").html(tracking_data.length+" point(s) ont &eacute;t&eacute; enregistr&eacute;e(s). Le trackeur a &eacute;chou&eacute; en enregistrant le dernier point. V&eacute;rifiez le GPS (fonctionnement et reception)");
	}

	function loadIO(){
		$.getScript("http://91.121.133.40:8080/socket.io/socket.io.js", function(data, textStatus, jqxhr) {	
			ioFile = true;
			connectSocket();
		});
    	}

	function loadgMap(){
/*$.getScript("http://maps.googleapis.com/maps/api/js?key=AIzaSyD0j7HUREhDcBlyvPwkLD8ICsfelgoLSIE&sensor=false", function(data, textStatus, jqxhr) {	
			gmapFile = true;
		});*/
    	}

	function vibrate(tps){
		navigator.notification.vibrate(tps);
	}

    } // systemReady

}); // Document ready jQuery.

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
