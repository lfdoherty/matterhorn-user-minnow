"use strict";

var internal = require('./internal');
var _ = require('underscorem')

var user;
exports.getUser = function(){
	return user;
}

exports.make = function(minnowClient){
	internal.make(minnowClient, function(ii){
		_.assertFunction(ii.findUser)
		user = ii;
	});
}

