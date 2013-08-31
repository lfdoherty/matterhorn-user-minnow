"use strict";

var internal = require('./internal');
var _ = require('underscorem')
/*
var user;
exports.getUser = function(){
	_.assertDefined(user)
	return user;
}
*/
exports.make = function(minnowClient, listeners, cb){
	_.assertLength(arguments, 3)
	
	internal.make(minnowClient, listeners, function(ii){
		_.assertFunction(ii.findUser)
		//user = ii;
		if(cb) cb(ii)
	});
}

