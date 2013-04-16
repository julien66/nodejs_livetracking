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

	var timestamp;

	var ioFile = false;
	var gmapFile = false;	

	var iosocket;
	var nodejs = false;

	var lowBat = false;
	var minAccuracy = 100;

	var db = window.openDatabase("Database", "1.0", "Tracking", 50000000);
	db.transaction(populateDB, errorCB, successCB);

	function populateDB(tx){
		//tx.executeSql('DROP TABLE IF EXISTS tracks');		
		tx.executeSql('CREATE TABLE IF NOT EXISTS tracks (timestamp unique, date TEXT, data TEXT)');
	}

	function errorCB(err){
		 alert("Erreur en manipulant SQL: "+err.code);

	}

	function successCB(){
		console.log("Ok pour SQL");
	}

	// Listen to the battery !!
	document.addEventListener("batterystatus", onBatteryStatus, false);
	function onBatteryStatus(info) { // Handle the battery low event	
		//console.log(info.level);
		alert('test');
		/*stopTracking();
		vibrate(500);
		navigator.notification.confirm(
			'La batterie est faible et le tracking a donc été stopé pour économiser de la batterie !',
			vibrate(500),
			'Attention',
			'OK'
		);
		lowBat = true;*/
	}

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

		/*if (gmapFile == false){
			loadgMap(); // A reprendre !
		}*/
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

			iosocket.on('client-authenticated',function(){ // Quand authentifié !
				//console.log("recu");
				//console.log(message);
				alert('auth !');
			});

			iosocket.emit('authenticate', authMessage);
		});
	}

	$('#geosite').live('tap', function(){
		var url = $(this).attr("rel");
		loadUrl(url);
	});

	function loadUrl(url){
		navigator.app.loadUrl(url, {openExternal:true});
		return false;
	}

	$('#idTrack').html(device.uuid); // Affiche la device uuid sur la page d'accueil.
	

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
			db.transaction(deleteAllTracks);
		}
	}

	function deleteAllTracks(tx){		
		//window.localStorage.clear();
		tx.executeSql('DELETE FROM tracks', [], rebuild_track_list, errorDeleteAllTracks);
	}

	function errorDeleteAllTracks(err){
		alert("Il y a eu un problème en essayant d'effacer toutes les traces : "+ err);
	}

	// When the user views the history page
	$('#history').live('pageshow', function () {
		  db.transaction(queryTracks);
	});

	function queryTracks(tx){
		tx.executeSql('SELECT timestamp, date FROM tracks ORDER BY timestamp', [], rebuild_track_list, errorSelectTracks);
	}

	function queryTracksById(tx){
		//console.log(parseInt($("#track_info").attr("track_id")));
		tx.executeSql('SELECT date, data FROM tracks WHERE timestamp = ?', [ timestamp ], updateTrackInfo , errorSelectTracks);
	}

	function errorSelectTracks(err){
		alert("Erreur en sélectionnant la table tracks: " + err.code);
	}

	function rebuild_track_list(tx, results){
		 tracks_recorded = results.rows.length;		
		 if (tracks_recorded <= 1){
		  	$("#tracks_recorded").html("<strong>" + (tracks_recorded) + "</strong> Trace enregistrée");
		  }
		 else{
			$("#tracks_recorded").html("<strong>" + (tracks_recorded) + "</strong> Traces enregistrées");
		  } 

  		 $("#history_tracklist").empty();  // Empty the list of recorded tracks
  		 
		 for(i=0; i<tracks_recorded; i++){ // Iterate over all of the recorded tracks, populating the list
			$("#history_tracklist").append("<li><a id='"+results.rows.item(i).timestamp+"' href='#track_info' data-ajax='false'>" + results.rows.item(i).date + "</a></li>"); 
 		}

  		$("#history_tracklist").listview('refresh'); // Tell jQueryMobile to refresh the list
	}

	$("#history_tracklist li a").live('click', function(){
		$("#track_info").attr("track_id", $(this).attr('id')); // En cas de clic sur un vol, passe le numéro du vol à la page d'info.
		timestamp = parseInt($(this).attr('id'));
		$("#track_info div[data-role=header] h1").html('');
		$("#track_info_info").html('');
		db.transaction(queryTracksById);
	});

	function updateTrackInfo(tx, results){
		var date = results.rows.item(0).date;
		$("#track_info div[data-role=header] h1").html(date); // Update the Track Info page header to the track_id
		// Total distance !
		total_km = 0;
		data = JSON.parse(results.rows.item(0).data);		
		for(i = 0; i < data.length; i++){
    			if(i == (data.length - 1)){
        			break;
    			}
    			total_km += gps_distance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i+1].coords.longitude);
		}		
		total_km_rounded = total_km.toFixed(2);
		
		// Total time travelled
		start_time = new Date(data[0].timestamp).getTime();
		end_time = new Date(data[data.length-1].timestamp).getTime();
		milli = end_time - start_time;
		seconds = Math.floor((milli / 1000) % 60);
      		minutes = Math.floor((milli / (60 * 1000)) % 60);
		
		$("#track_info_info").html('Le vol du <strong> '+date+' </strong> contient <strong>'+data.length+'</strong> points GPS parcourant <strong>' + total_km_rounded + '</strong> km en <strong>' + minutes + 'mn</strong> et <strong>' + seconds + 's</strong>');

	}
	
	// When the user send the fullTrack to the server.
	$('#sendIt').live('click',function(){ // Envoi à un service Drupal... /services-gettrack/gettrack/  ==> POSTGIS
		// Ici tu dois affiher un throbber et/ou freezer jusqu'à ce que l'envoi soit ok ?! - Risqué -> Attention gestion erreur.

		$.post("http://ks201694.kimsufi.com/services-gettrack/gettrack/"+device.uuid, {
			log : data
		},
		function(result){
			if (result == "CREATE OK"){
				navigator.notification.alert(
            				'La trace est bien enregistrée sur le serveur de la FFVL',  // message
            				vibrate(500),         // callback
            				'Merci',            // title
            				'OK'                  // buttonName
        			);
			}
			else{
				console.log(result);
			}
		});		
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
			db.transaction(deleteTracks, errorDeleteTracks);
			vibrate(500); // vibre.
			$.mobile.changePage($("#history"),"none");// Retourne à l'historique.
		}
	}

	function deleteTracks(tx){
		tx.executeSql('DELETE FROM tracks WHERE timestamp='+ timestamp , [], deleteSuccess, errorDeleteTracks);
	}

	function errorDeleteTracks(err){
		alert("Erreur au moment d'effacer la trace : "+ err.code);
	}

	function deleteSuccess(){
		//alert('');
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
	if (lowBat == false){
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
	}else{
		navigator.notification.confirm(
			'La batterie est trop basse pour activer le tracking',
			vibrate(500),
			'Attention',
			'Ok'
			);
		
	}
	});

	$("#startTracking_ghost").live('click', function(){ // When the user enable or disable ghost function
		if (ghost == false){
			navigator.notification.confirm(
				"Le mode fantome continue d'envoyer votre position au serveur FFVL mais ne la communique pas publiquement sur le site. Voulez-vous activer ce mode ?", // message
				 function(i){
					if (i == 1){
						$("#startTracking_ghost").text("Désactiver le mode fantome");
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
					stopTracking();	
				}
			}, // callabck
			'Attention',
			'OUI, NON'
			);		
	});
		

	var onSuccess = function(position) {
		if (position.coords.accuracy < minAccuracy ){
			tracking_data.push(position);

			if (tracking_data.length < 3){
				$("#startTracking_status").html("Recherche GPS... Vérifiez que le GPS soit activé et qu'il recoive bien un signal");
				if (track == false){
					track = true;
				}
			}
			else{
				$("#startTracking_status").html(tracking_data.length+" point(s) ont été enregistré(s)<br> Le trackeur fonctionne normalement.");
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

			$("#startTracking_debug").html(
				'Latitude: '          + Math.round(position.coords.latitude * 10000000)/ 10000000 + '</br>' +
		          	'Longitude: '         + Math.round(position.coords.longitude * 10000000)/10000000 + '</br>' +
				'Précision: '         + Math.round(position.coords.accuracy) + '</br>' +
		          	'Altitude: '          + Math.round(position.coords.altitude) + '</br>' +
		          	//'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
		          	//'Heading: '           + position.coords.heading           + '\n' +
		          	'Speed: '             + Math.round(position.coords.speed * 100) /100 + '</br>' +
		          	'Timestamp: '         + position.timestamp                + '</br>'
			);
		}
	};
	

	// onError Callback receives a PositionError object
	//
	function onError(error) {
    		/*alert('code: '    + error.code    + '\n' +
          	'message: ' + error.message + '\n');*/
		//console.log("Position foire&eacute;e... " + error);
		if (track == true){
			$(".isTracking").buttonMarkup({ 'theme': "e", 'icon':"delete" });
			track = false;
		}
		$("#startTracking_status").html(tracking_data.length+" point(s) ont été enregistré(s). Le trackeur a échoué en enregistrant le dernier point. Vérifiez le GPS (fonctionnement et reception)");
	}

	function loadIO(){
		$.getScript("http://91.121.133.40:8080/socket.io/socket.io.js", function(data, textStatus, jqxhr) {	
			ioFile = true;
			connectSocket();
		});
    	}

	function stopTracking(){
		db.transaction(insertTrack);
	}

	function insertTrack(tx){
		var baseDate = startDate.getDate().toString() + "/"+ (startDate.getMonth()+1).toString() + "/"+startDate.getFullYear().toString()+" "+startDate.getHours().toString()+":"+(startDate.getMinutes()<10?'0':'') + startDate.getMinutes();
		tx.executeSql('INSERT INTO tracks (timestamp, date, data) VALUES (?,?,?)', [ startDate.getTime(), baseDate,JSON.stringify(tracking_data) ], successInsert, errorInsert);
	}
	
	function errorInsert(err){
		alert("Problème à l'insertion de la trace : " +err.code);
	}

	function successInsert(){
		navigator.geolocation.clearWatch(watch_id); // Clear geolocation.
		$("#startTracking_start").closest('.ui-btn').show();
		$("#startTracking_stop").closest('.ui-btn').hide();
		$('#startTracking_ghost').closest('.ui-btn').hide();
		$("#startTracking_status").html("");
		$("#startTracking_debug").html("");			
		if (track == true){
			$(".isTracking").buttonMarkup({'theme':'e', 'icon':'delete'});
			track = false;
		}
		watch_id = null;			
		tracking_data = [];
		alert('La trace a bien été insérée');
	}

	function vibrate(tps){
		navigator.notification.vibrate(tps);
	}

	function gps_distance(lat1, lon1, lat2, lon2){
  		// http://www.movable-type.co.uk/scripts/latlong.html
    		var R = 6371; // km
    		var dLat = (lat2-lat1) * (Math.PI / 180);
    		var dLon = (lon2-lon1) * (Math.PI / 180);
    		var lat1 = lat1 * (Math.PI / 180);
    		var lat2 = lat2 * (Math.PI / 180);
    		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    		var d = R * c;
    		return d;
	}

    } // systemReady

}); // Document ready jQuery.

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
