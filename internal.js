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

function make(minnowClient, listeners, cb){

	_.assertLength(arguments, 3);
	_.assertFunction(cb);

	minnowClient.view('userGeneral', [], _.assureOnce(function(err, h){
		if(err) throw err;
		finishMake(minnowClient, listeners, h, cb)
	}))		
}

function finishMake(c, listeners, m, cb){

	//_.errout(typeof(listeners.logout))
	_.assertDefined(m)
	
	var userMadeListeners = []
	
	var handle = {
	
		makeUser: function(email, password, cb, viaWeb){

			var salt = bcrypt.genSaltSync(10);
			var hash = hashPassword(password, salt)
			var now = Date.now()
			
			m.make('user', {
				createdTime: now,
				email: email,
				passwordChangedTime: now,
				hash: hash
				//password: password
			}, function(userId){
				//console.log('make got userId: ' + userId + ' ' + userMadeListeners.length)
				//_.assert(userId > 0)
				var cdl = _.latch(userMadeListeners.length, function(){
					cb(userId)
				})
				userMadeListeners.forEach(function(listener){
					listener(userId, email, viaWeb, cdl)
				})
			})
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

			c.snap('singleUser', [id], function(err, suv){
				if(err) throw err
				suv.user.email.set(email)
			})
		},
		getEmail: function(id, cb){
			//i.getString(id, 'email', cb);
			//_.assert(id > 0)
			c.snap('singleUser', [id], function(err, suv){
				if(err) throw err
				cb(suv.user.email.value())
			})
		},
		setPassword: function(id, password, cb){

			var salt = bcrypt.genSaltSync(10);  

			c.snap('singleUser', [id], function(err, suv){
				if(err) throw err
				suv.user.hash.set(hashPassword(password, salt))
				suv.user.passwordChangedTime.set(Date.now())
				console.log('finished set password')
				if(cb) cb()
			})			
		},
		authenticate: function(id, password, cb, failDelayCb){

			//_.assert(id > 0)
			c.snap('getHash', [id], function(err, v){
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

			c.snap('singleUserByEmail', [email], function(err, suv){
				if(err) throw err
				//console.log('json: ' + JSON.stringify(suv.toJson()))
				if(suv.hasProperty('user')){
					//_.assert(suv.user.id() > 0)
					cb(suv.user.id())
				}else{
					cb()
				}
			})
		},
		
		makeSession: function(id, cb){
			
			var token = random.uid()

			c.snap('singleUser', [id], function(err, suv){
				if(err) throw err
				//_.assert(suv.user.id() > 0)
				var obj = m.make('session', {
					user: suv.user,
					token: token
				}, function(newId){
					//console.log('made session: ' + newId + ' ' + JSON.stringify(obj.toJson()))
					if(listeners.login) listeners.login(id, token)
					
					if(cb) cb(token, newId)
				})
			})
		},
		checkSession: function(token, cb){
			if(!_.isString(token)){
				console.log('warning in checkSession: token not a string')
				cb(false)
				return
			}
			_.assertString(token);
			//console.log('checking for session with token: ' + token)
			c.snap('singleSessionByToken', [token], function(err, suv){
				if(err) throw err
				try{
					if(suv.has('session') && suv.session.has('user')){
						//console.log('user id: ' + suv.session.user.id() + ' ' + JSON.stringify(suv.toJson()))
						//_.assert(suv.session.user.id() > 0)
						log('found session with token: ' + token)
						cb(true, suv.session.user.id())
					}else{
						log('no session with token: ' + token)
						cb(false)
					}
				}catch(e){
					console.log(e)
					cb(false)
					handle.clearSession(token)
				}
			})			
		},
		clearSession: function(token, cb){

			//console.log('clearing user session: ' + token);
			c.snap('singleSessionByToken', [token], function(err, sv){
				if(err) throw err
				if(sv.has('session')){
					try{
						var userId = sv.session.user.id()
						sv.session.del()
						//if(listeners.logout) listeners.logout(userId, token)
					}catch(e){
						console.log(e)
					}
					log('session deleted: ' + token)
					if(cb) cb(true)
				}else{
					log('session clear failed, unknown token: ' + token)
					if(cb) cb(false)
				}
			})
		},
		clearAllSessions: function(token, cb){

			//console.log('clearing user session---: ' + token);
			c.snap('allSessionsBySameUser', [token], function(err, sv){
				if(err) throw err
				//console.log('logging out---')
				if(sv.has('session')){
					try{
						var userId = sv.userId.value()
						sv.sessions.each(function(session){
							session.del()
						})
						//sv.session.del()
						if(listeners.logout){
							//console.log('logging out')
							listeners.logout(userId)
						}
					}catch(e){
						console.log(e)
					}
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
