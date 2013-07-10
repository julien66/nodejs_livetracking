/** 
 * @File
 *
 * Listen to the connection and handdle event.
 */
var internet = false;
var connectionType;

var connection = {
  init : function() {
    // Listen to the connection.
    document.addEventListener("online", onOnline, false );
		document.addEventListener("offline", onOffline, false);
  },

  getConnectionType : function() {
    connectionType = navigator.connection.type;
		return connectionType;
  },

  triggerOnline : function() {
    onOnline();
  }
}

// Handle the online event
function onOnline() {
  if (internet == false) {
    connectionType = navigator.connection.type;
    $(".internet").buttonMarkup({
      'theme':"b",
      'icon':"check"
    });
    internet = true;
  }
}

// Handle the offline event
function onOffline() {
  if (internet == true) {
    connectionType = 'Connection.NONE';
    $(".internet").buttonMarkup({
      'theme': "e",
      'icon':"delete"
    });
    internet = false;
  }
}
