
//TODO - lost password reset
//TODO - session expiry

//exports.dir = __dirname;
//exports.name = 'matterhorn-user';
//exports.requirements = ['matterhorn-standard'];

var sys = require('sys');

var mh = require('matterhorn');

var internalmaker = require('./internalmaker')

require('matterhorn-standard');

var getUser = internalmaker.getUser;

var _ = require('underscorem');

exports.secure = require('./ssluser');
exports.insecure = require('./insecureuser');

var log = require('quicklog').make('user-minnow/api')

exports.make = function(app, secureApp, minnowClient, cb){
	_.assertLength(arguments, 4)
	
	internalmaker.make(minnowClient, cb)
	
	var insecureAuthenticate = exports.insecure.load(app)
	var secureAuthenticate = exports.secure.load(app, secureApp)
	
	return {
		insecureAuthenticate: insecureAuthenticate.authenticate,
		secureAuthenticate: secureAuthenticate.authenticate
	}
}

exports.on = function(eventName, cb){
	var u = getUser()
	if(eventName === 'userMade'){
		u.onUserMade(cb)
	}else{
		_.errout('unsupported event: ' + eventName)
	}
}

exports.getEmail = function(userId, cb){
	getUser().getEmail(userId, cb);
}
exports.findUser = function(email, cb){
	getUser().findUser(email, cb);
}
exports.hasSession = function(req, cb){
	var sid = req.cookies.SID;
	if(sid === undefined){
		log('no SID cookie found')
		cb(false);
	}else{
		sid = sid.substr(0, sid.indexOf('|'))
		getUser().checkSession(sid, function(ok, userId){
			cb(ok);
		});
	}
}
exports.makeUser = function(email, password, cb){
	getUser().makeUser(email, password, cb)
}


