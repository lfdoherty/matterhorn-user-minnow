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

	minnowClient.view('userGeneral', [], _.assureOnce(function(h){
		finishMake(minnowClient, h, cb)
	}))		
}

function finishMake(c, m, cb){

	var handle = {
		createUser: function(cb){
			m.make('user', {
				createdTime: Date.now()
			}, cb)
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
			/*s.setInt(email, 'lookup-by-email', id);

			i.setString(id, 'email', email);
			i.setNumber(id, 'email-changed-time', Date.now());*/
			c.view('singleUser', [id], function(suv){
				suv.user.email.set(email)
			})
		},
		getEmail: function(id, cb){
			//i.getString(id, 'email', cb);
			c.view('singleUser', [id], function(suv){
				cb(suv.user.email.value())
			})
		},
		setPassword: function(id, password){

			var salt = bcrypt.genSaltSync(10);  
			/*
			i.setString(id, 'salt', 'BCRYPT');
			i.setString(id, 'password-hash', hashPassword(password, salt));
			i.setNumber(id, 'password-changed-time', Date.now());*/
			c.view('singleUser', [id], function(suv){
				//suv.salt.set('BCRYPT')
				suv.user.hash.set(hashPassword(password, salt))
				suv.user.passwordChangedTime.set(Date.now())
				console.log('finished set password')
				//process.exit(0)
			})			
		},
		authenticate: function(id, password, cb, failDelayCb){
			/*_.assertInt(id);
			console.log('in authenticate');
			i.getString(id, ['password-hash', 'salt'], function(hash, salt){

				console.log(arguments);

				var passed;
				if(salt === 'BCRYPT'){
					passed = bcrypt.compareSync(password, hash);
				}else{
					//TODO - also make sure to auto-upgrade here
					throw 'TODO - support legacy password hashes: ' + salt;
				}
				console.log('passed: ' + passed);
				if(passed){
					cb(true);
				}else{
					cb(false);
					//TODO set up fail delay
				}
			});*/
			_.assert(id > 0)
			c.view('getHash', [id], function(v){
				var hash = v.hash.value()
				var passed = bcrypt.compareSync(password, hash);
				console.log('hash: ' + hash)
				console.log('password: ' + password)
				console.log('passed: ' + passed)
				if(passed){
					cb(true);
				}else{
					cb(false);
					//TODO set up fail delay
				}
			})
		},
		findUser: function(email, cb){
			//s.getInt(email, 'lookup-by-email', cb);
			c.view('singleUserByEmail', [email], function(suv){
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
			/*var session = random.make();
			s.setInt(session, 'sessions', id);
			return session;*/
			
			var token = random.uid()

			c.view('singleUser', [id], function(suv){
				m.make('session', {
					user: suv.user,
					token: token
				}, function(){
					if(cb) cb(token)
				})
			})
		},
		checkSession: function(token, cb){
			_.assertString(token);
			log('checking for session with token: ' + token)
			c.view('singleSessionByToken', [token], function(suv){
				if(suv.has('session')){
					log('found session with token: ' + token)
					cb(true, suv.session.user.id())
				}else{
					log('no session with token: ' + token)
					cb(false)
				}
			})			
		},
		clearSession: function(token, cb){
			//s.del(session, 'sessions');
			//console.log('clearing user session');
			c.view('singleSessionByToken', [token], function(sv){
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
