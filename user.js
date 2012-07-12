
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

exports.make = function(minnowClient){

	internalmaker.make(minnowClient)
}

exports.secure = require('./ssluser');
exports.insecure = require('./insecureuser');

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
		getUser().checkSession(sid, function(ok, userId){
			cb(ok);
		});
	}
}

