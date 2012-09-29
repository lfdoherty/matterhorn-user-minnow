"use strict";

var bcrypt = require('bcrypt'),
	random = require('matterhorn-standard').random,
	_ = require('underscorem'),
	sys = require('sys');
	
var minnow = require('minnow')
function hashPassword(password, salt){
	var hash = bcrypt.hashSync(password, salt);
	return hash;
}

var log = require('quicklog').make('user-minnow/internal')

function make(minnowClient, cb){

	_.assertLength(arguments, 2);
	_.assertFunction(cb);

	minnowClient.view('userGeneral', [], _.assureOnce(function(err, h){
		if(err) throw err;
		finishMake(minnowClient, h, cb)
	}))		
}

function finishMake(c, m, cb){

	_.assertDefined(m)
	
	var userMadeListeners = []
	
	var handle = {
		createUser: function(cb, viaWeb){
			//console.log('making user')
			m.make('user', {
				createdTime: Date.now()
			}, function(userId){
				//console.log('make got userId: ' + userId)
				_.assert(userId > 0)
				userMadeListeners.forEach(function(listener){
					listener(userId, viaWeb)
				})
				cb(userId)
			})
		},
		
		makeUser: function(email, password, cb, viaWeb){
			handle.createUser(function(userId){
				handle.setEmail(userId, email);
				handle.setPassword(userId, password);
				cb(userId)
			}, viaWeb)
		},
		
		onUserMade: function(cb){
			userMadeListeners.push(cb)
		},
		
		//note that 'authentication key' here refers to keys used for lost password retrieval, not sessions
		//hence we only want 1 to exist at a time, and we need to be able to delete it once it has been used
		createAuthenticationKey: function(email, cb){
			/*s.getString(email, 'authenticationKey', function(uid){
				if(uid !== undefined){
					s.del(uid, 'authenticationKey');
					console.log('deleting old authentication key');
				}
				
				var newUid = random.uid();
				s.setString(newUid, 'authenticationKey', email);
				s.setString(email, 'authenticationKey', newUid);
				cb(newUid);
			});*/
			
			_.errout('TODO')
			//var token = random.uid()
		},
		getAuthenticationKeyEmail: function(token, cb){
			//s.getString(key, 'authenticationKey', cb);
			_.errout('TODO')
		},
		expireAuthenticationKey: function(key){
			/*s.getString(key, 'authenticationKey', function(email){
				s.del(email, 'authenticationKey');
				s.del(key, 'authenticationKey');
			})	*/
			_.errout('TODO')		
		},
		setEmail: function(id, email){
			_.assertString(email)

			c.view('singleUser', [id], function(err, suv){
				if(err) throw err
				suv.user.email.set(email)
			})
		},
		getEmail: function(id, cb){
			//i.getString(id, 'email', cb);
			_.assert(id > 0)
			c.view('singleUser', [id], function(err, suv){
				if(err) throw err
				cb(suv.user.email.value())
			})
		},
		setPassword: function(id, password){

			var salt = bcrypt.genSaltSync(10);  

			c.view('singleUser', [id], function(err, suv){
				if(err) throw err
				suv.user.hash.set(hashPassword(password, salt))
				suv.user.passwordChangedTime.set(Date.now())
				console.log('finished set password')
			})			
		},
		authenticate: function(id, password, cb, failDelayCb){

			_.assert(id > 0)
			c.view('getHash', [id], function(err, v){
				if(err) throw err
				var hash = v.hash.value()
				var passed = bcrypt.compareSync(password, hash);
				//console.log('hash: ' + hash)
				//console.log('password: ' + password)
				//console.log('passed: ' + passed)
				if(passed){
					cb(true);
				}else{
					cb(false);
					//TODO set up fail delay
				}
			})
		},
		findUser: function(email, cb){

			c.view('singleUserByEmail', [email], function(err, suv){
				if(err) throw err
				//console.log('json: ' + JSON.stringify(suv.toJson()))
				if(suv.hasProperty('user')){
					_.assert(suv.user.id() > 0)
					cb(suv.user.id())
				}else{
					cb()
				}
			})
		},
		
		makeSession: function(id, cb){
			
			var token = random.uid()

			c.view('singleUser', [id], function(err, suv){
				if(err) throw err
				_.assert(suv.user.id() > 0)
				var obj = m.make('session', {
					user: suv.user,
					token: token
				}, function(newId){
					//console.log('made session: ' + newId + ' ' + JSON.stringify(obj.toJson()))
					if(cb) cb(token)
				})
			})
		},
		checkSession: function(token, cb){
			_.assertString(token);
			log('checking for session with token: ' + token)
			c.view('singleSessionByToken', [token], function(err, suv){
				if(err) throw err
				if(suv.has('session')){
					//console.log('user id: ' + suv.session.user.id() + ' ' + JSON.stringify(suv.toJson()))
					_.assert(suv.session.user.id() > 0)
					log('found session with token: ' + token)
					cb(true, suv.session.user.id())
				}else{
					log('no session with token: ' + token)
					cb(false)
				}
			})			
		},
		clearSession: function(token, cb){

			//console.log('clearing user session: ' + token);
			c.view('singleSessionByToken', [token], function(err, sv){
				if(err) throw err
				if(sv.has('session')){
					sv.session.del()
					log('session deleted: ' + token)
					if(cb) cb(true)
				}else{
					log('session clear failed, unknown token: ' + token)
					if(cb) cb(false)
				}
			})
		}
	};
	
	cb(handle);
}

exports.make = make;
