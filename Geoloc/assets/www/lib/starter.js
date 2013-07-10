/**
 * @ File
 *
 * Simple tracker compatible with drupal nodejs_livetracking module.
 *
 * @todo clean the code and add better structure instead of just using object in file.
 * eg. Learn how to use require.js
**/

$(document).ready(function() {
  document.addEventListener("deviceready", systemReady, true);
  // Phonegap system ready.
  function systemReady() {

   // helper object is defined into helper.js
    // param object is defined into param.js
	  // databaseCallback object is defined into databaseCallback.js
    // database object is defined as database into database.js
    // connection object is defined as connection into connection.js
    // battery object is defined as battery into battery.js
    // tracker object is defined as tracker into tracker.js

    // Init param.
    param.init();

    // Open Database.
    database.open(databaseCallback);
    
    // Listen for connection and handle it.
    connection.init();

    // At start if the phone is connected, throw connection event.
    if (connection.getConnectionType() != 'Connection.NONE') {
		  connection.triggerOnline();
		};
		
		// Display this device uuid.
		$('#idTrack').html(device.uuid);

    // Showing settings.
    $("#livetracking_setting").click(function() {
      $("#setting").removeClass('hidden');
      $("#explain").addClass('hidden');
	  });

	  // Hide settings.
	  $("#close_setting").click(function() {
      $("#setting").addClass('hidden');
      $("#explain").removeClass('hidden');
	  });

		// Deleting All tracks.
		$("#home_clearstorage_button").click(function() {
		  navigator.notification.confirm(
	    'Do you really want to erase ALL tracks ?',
	    function confirm(bouton) {
	      if (bouton == 1) {
	        database.deleteAllTracks();
	      } 
	    },
	    'Warning',
	    Array('Yes','No')
		  );
	  });

	  // Showing all tracks.
	  $('#history').bind('pageshow', function() {
	    database.showTracks();
	  });

	  $(".setting-input").bind("blur", function(event) {
	    window.localStorage.setItem($(event.target).attr('id'), $(event.target).val());
	    assignValueToKey($(event.target).attr('id'), $(event.target).val());
	    if (debug == true) {
	      console.log($(event.target).attr('id') + " Saved as " + $(event.target).val())
	    }
	  });

	  // Erasing a peculiar track.
	  $('#deleteIt').click(function() {
	    navigator.notification.confirm(
	      'Do you really want to erase this track ?',
	      function confirm(button) {
	        if (button == 1) {
	          database.deleteThisTrack();
	          helper.vibrate(500);
	          // Back to History.
	          $.mobile.changePage($("#history"), "none");
	        }
	      },
	      'Warning',
	      Array('Yes', 'No')
	    );
	  });

	  // Showing the tracking page.
	  $("#startTracking").bind('pageshow', function() {
	    $("#startTracking_stop").closest('.ui-btn').show();
	    if (trackRequest == false) {
	      $("#startTracking_stop").closest('.ui-btn').hide();
	    }
	    else if (trackRequest == true) {
	      $("#startTracking_start").closest('.ui-btn').hide();
	    }
	  });

	  // Starting the tracker.
	  $("#startTracking_start").click(function() {
	    if (lowBat == false) {
	      tracker.startTracking();
      }
      else {
        navigator.notification.confirm(
          'Battery is too low for a tracking',
          helper.vibrate(500),
          'Attention',
          'Ok'
        );
      }
    });

    // Stopping the tracker.
    $("#startTracking_stop").click(function() {
      navigator.notification.confirm(
        'Do you really want to stop the tracking ?',
        function(i) {
          if (i == 1) {
            tracker.stopTracking();
          }
			  },
			  'Warning',
			  Array('Yes', 'No')
		  );
	  });
	}
});
