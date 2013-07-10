/**
 * @ File
 *
 * Defining helper function object.
 */
var helper = {
  // From http://www.movable-type.co.uk/scripts/latlong.html
  gpsDistance : function (lat1, lon1, lat2, lon2) {
    var R = 6371;
	  var dLat = (lat2-lat1) * (Math.PI / 180);
	  var dLon = (lon2-lon1) * (Math.PI / 180);
	  var lat1 = lat1 * (Math.PI / 180);
	  var lat2 = lat2 * (Math.PI / 180);
	  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
	  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	  var d = R * c;
	  return d;
	},

	vibrate : function(tps) {
	  navigator.notification.vibrate(tps);
	}, 
}
