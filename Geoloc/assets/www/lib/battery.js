/**
 * @File
 *
 * Listen to battery and handle event. 
 */
// Low battery. Boolean.
var lowBat = false;
var battery = {
   init : function() {
     // Listen to the battery !!
     window.addEventListener("batterystatus", onBatteryStatus, false);
   },
}

function onBatteryStatus(info) {
  if (info.isPlugged == false && info.level < 20){
    if (trackRequest == true) {
      tracker.stopTracking();
      helper.vibrate(500);
      navigator.notification.confirm(
      "Battery is ow low and the tracking has been stop to save some energy !",
      vibrate(500),
      'Warning',
      'OK'
      );
    }
    lowBat = true;
  }  
}
