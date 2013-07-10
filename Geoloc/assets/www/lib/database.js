/**
 * @File
 *
 * Storing our database object.
 *
 * @see databaseCallback.
 */

// phonegap database object.
var db;
// database callback object.
var dbCall;
// Current track timestamp to request. Updated when users click on a track.
var timestamp;
// Current tracking data. Array containing GPS position objects
var tracking_data = Array();
	  
var database = {  
  open : function(databaseCallback) {
    dbCall = databaseCallback;
    db = window.openDatabase("Database", "1.0", "Tracking", 50000000);
    db.transaction(populateDB, errorCB, successCB);
  },

  deleteAllTracks : function() {
    db.transaction(deleteAllDB);
  },

  showTracks : function() {
    db.transaction(queryAllTracks)
  },

  showThisTrack : function() {
    console.log("Show this");
    db.transaction(queryTrackById);
  },

  deleteThisTrack : function() {
    db.transaction(deleteTrackById);
  },

  insertTrack : function(param, callback) {
    db.transaction(insertThisTrack);
    // Callabck function to track insert.
    function insertThisTrack(tx) {
      tx.executeSql('INSERT INTO tracks (timestamp, date, data) VALUES (?,?,?)', param, callback, errorInsert);
    }
  },

  setTimestamp : function(time) {
    timestamp = time;
  },
}

// Callaback function for db access / opening.
function populateDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS tracks (timestamp unique, date TEXT, data TEXT)');
}

// Callaback function that delete all tracks from database.
function deleteAllDB(tx){
  tx.executeSql('DELETE FROM tracks', [], dbCall.trackList, errorDeleteAllTracks);
}

// Callaback function that get all tracks.
function queryAllTracks(tx) {
  tx.executeSql('SELECT timestamp, date FROM tracks ORDER BY timestamp', [], dbCall.trackList, errorSelectTracks);
}

// Callaback function that get a given track.
function queryTrackById(tx){
  console.log("queryTrackById");
  tx.executeSql('SELECT date, data FROM tracks WHERE timestamp = ?', [timestamp], dbCall.trackInfo , errorSelectTracks);
}

// Callback function to delete a given track.
function deleteTrackById(tx) {
  tx.executeSql('DELETE FROM tracks WHERE timestamp = ?', [timestamp], deleteSuccess, errorDeleteTracks);
}

// Error handler on database access.
function errorCB(err) {
  alert("SQL Error : " + err.code);
}

// Success handler for database access.
function successCB() {
  console.log("SQL Ok");
}

// Error handler for deleting all tracks.
function errorDeleteAllTracks(err){
	alert("Error deleting all tracks : " + err);
}

// Error handler for track select.
function errorSelectTracks(err) {
  alert("Error requesting Tracks table : " + err.code);
}

// Error handler on delete track by id.
function errorDeleteTracks(err) {
  alert("Error while erasing the track : "+ err.code);
}

// Success handler on delete track by id.
function deleteSuccess() {
  navigator.notification.confirm(
      'Track has been deleted',
      function() {
      },
      'Success',
			Array('Ok')
		);
}

// Error handler for insert.
function errorInsert(err) {
  alert("Error inserting the track : " +err.code);
}
