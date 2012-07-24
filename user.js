
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

exports.make = function(app, secureApp, minnowClient){
	_.assertLength(arguments, 3)
	
	internalmaker.make(minnowClient)
	
	var insecureAuthenticate = exports.insecure.load(app)
	var secureAuthenticate = exports.secure.load(app, secureApp)
	
	return {
		insecureAuthenticate: insecureAuthenticate.authenticate,
		secureAuthenticate: secureAuthenticate.authenticate
	}
}


exports.getEmail = function(userId, cb){
	getUser().getEmail(userId, cb);
}
exports.findUser = function(email, cb){
	getUser().findUser(email, cb);
}
exports.hasSession = function(req, cb){
	var sid = req.cookies.sid;
	if(sid === undefined){
		cb(false);
	}else{
		sid = sid.substr(0, sid.indexOf('|'))
		getUser().checkSession(sid, function(ok, userId){
			cb(ok);
		});
	}
}

