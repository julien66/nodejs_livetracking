/**
 * @File
 *
 * Prameter object. Keep and retrieve param from local storage.
 */
 
// Batterie threshold.
var batThreshold;
// Website where the info is sent.
var website;
// Server port.
var port;
// Server login.
var login;
// Server password.
var password;
var debug = true;

var defaultSetting = {
  'batThreshold' : 20,
  'website' : 'http://watch_setting_page',
  'port' : 8080,
  'login' : 'Your_username',
  'password' : 'Your_password'
}

var param = {
  init : function() {
    for (var key in defaultSetting) {
      var value = window.localStorage.getItem(key);
      if (value == null) {
        console.log(key);
        assignValueToKey(key, defaultSetting[key]);
      }
      else {
        console.log(key);
        assignValueToKey(key, value);
        $("#"+key).attr('value', value); 
      }
    }
  }, 
}

function assignValueToKey(key, value) {
  // This handle problems when evaluate a string that contain : or . characters
  if (key == 'website' || 'login' || 'password') {
    eval( key + " = " + "'" + value + "'");
  }
  else {
    eval( key + " = " + value);
  }
}
