
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

exports.make = function(app, secureApp, minnowClient, host, secureHost, prefix, listeners, cb){
	_.assertLength(arguments, 8)
	_.assertObject(listeners)
	
	internalmaker.make(minnowClient, listeners, function(internal){
		_.assertDefined(internal)

		
		var insecureAuthenticate = exports.insecure.load(app, secureHost, internal)
		var secureAuthenticate = exports.secure.load(app, secureApp, host, secureHost, internal, prefix)
	
		var handle = {
			//handle: insecureAuthenticate,
			insecureAuthenticate: insecureAuthenticate.authenticate,
			secureAuthenticate: secureAuthenticate.authenticate,
			authenticateByToken: insecureAuthenticate.authenticateByToken,
			onUserMade: insecureAuthenticate.onUserMade,
			getEmail: function(userId, cb){
				exports.getEmail(userId, cb)
			}
		}
	
		handle.hasSession = hasSession = function(req, cb){
			var sid = req.cookies.SID;
			if(sid === undefined){
				log('no SID cookie found')
				cb(false);
			}else{
				sid = sid.substr(0, sid.indexOf('|'))
				internal.checkSession(sid, function(ok, userId){
					cb(ok);
				});
			}
		}
		
		handle.findUser = internal.findUser
		handle.makeUser = internal.makeUser
		handle.authenticate = internal.authenticate
		handle.makeSession = internal.makeSession
		
		handle.getEmail = internal.getEmail
	
		cb(handle)
	})
	
	//return handle
}
/*

exports.on = function(eventName, cb){
	var u = getUser()
	if(eventName === 'userMade'){
		u.onUserMade(cb)
	}else{
		_.errout('unsupported event: ' + eventName)
	}
}

exports.setPassword = function(userId, password, cb){
	getUser().setPassword(userId, password, cb)
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

*/


