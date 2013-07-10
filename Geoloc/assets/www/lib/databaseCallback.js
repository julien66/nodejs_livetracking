/**
 * @ File
 *
 * Defining function for all database callback.
 */

var databaseCallback = {
  trackList : function(tx, results) {
    tracks_recorded = results.rows.length;
    if (tracks_recorded <= 1) {
      $("#tracks_recorded").html("<strong>" + (tracks_recorded) + "</strong> Tracklog stored");
    }
    else {
      $("#tracks_recorded").html("<strong>" + (tracks_recorded) + "</strong> Tracklogs stored");
    }
    // Flush the list of recorded tracks
    $("#history_tracklist").empty();
    // Iterate over all of the recorded tracks, populating the list
    for(i=0; i<tracks_recorded; i++) {
      $("#history_tracklist").append("<li><a id='" + results.rows.item(i).timestamp + "' href='#track_info' data-ajax='false'>" + results.rows.item(i).date + "</a></li>");
    }

    // Attach handlers for showing a peculiar track.
	  $("#history_tracklist li a").bind('click', function() {
	    // In case of click on a track, send the track id to the info page.
	    $("#track_info").attr("track_id", $(this).attr('id'));
	    database.setTimestamp(parseInt($(this).attr('id')));
	    $("#track_info div[data-role=header] h1").html('');
	    $("#track_info_info").html('');
	    database.showThisTrack();
	  });
	  
    // Refresh jQuery Mobile list.
    $("#history_tracklist").listview('refresh');
  },

  trackInfo : function(tx, results) {
    var date = results.rows.item(0).date;
    // Update the Track Info page header to the track_id
    $("#track_info div[data-role=header] h1").html(date);
    // Total distance calculation !
    total_km = 0;
    data = JSON.parse(results.rows.item(0).data);
    for(i = 0; i < data.length; i++) {
      if(i == (data.length - 1)) {
        break;
      }
      total_km += helper.gpsDistance(data[i].coords.latitude, data[i].coords.longitude, data[i+1].coords.latitude, data[i+1].coords.longitude);
    }
    total_km_rounded = total_km.toFixed(2);
    // Total time travelled
    if ( data.length > 1) {
      start_time = new Date(data[0].timestamp).getTime();
      end_time = new Date(data[data.length-1].timestamp).getTime();
      milli = end_time - start_time;
      seconds = Math.floor((milli / 1000) % 60);
      minutes = Math.floor((milli / (60 * 1000)) % 60);
      $("#track_info_info").html('Track from <strong> '+ date + ' </strong> containing <strong>' + data.length + '</strong> GPS points covering <strong>' + total_km_rounded + '</strong> km by <strong>' + minutes + 'mn</strong> and <strong>' + seconds + 's</strong>');
    }
  },
  
}
