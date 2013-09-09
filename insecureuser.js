"use strict";

var util = require('util');
var _ = require('underscorem')

//exports.dir = __dirname;
exports.module = module
//exports.name = 'matterhorn-insecure-user';
//exports.requirements = ['matterhorn-standard'];

var log = require('quicklog').make('user-minnow/insecure')

//var getUser = require('./internalmaker').getUser;

function setSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true});
}
var OneMonth = 1000*60*60*24*30
function setLongSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true, expires: new Date(Date.now()+OneMonth)});
}

exports.load = function(app, secureHost, internal){
	_.assertLength(arguments, 3)

	function authenticateByToken(token, cb){
		_.assertString(token)
		_.assertFunction(cb)
		
		internal.checkSession(token, function(ok, userId){
			if(ok){
				_.assertInt(userId)
				//getUser().getEmail(userId, function(email){
				//	req.user = {id: userId, email: email};
				//	req.userToken = userId
					cb(undefined, userId)
				//});
			}else{
				//util.debug('redirecting to login');
				//doLoginRedirect();
				cb('authentication failed')
			}
		});
	}
	function authenticate(req, res, next){
		//console.log('authenticating: ' + JSON.stringify(req.cookies));

		if(req.cookies.SID === undefined){
			doLoginRedirect();
			return;
		}

		var pi = req.cookies.SID.indexOf('|')
		if(pi === -1){
			doLoginRedirect();
			return;
		}
		var sid = req.cookies.SID.substr(0, pi);

		function doLoginRedirect(){
			//log('redirecting to ' + '/login?next='+req.url);
			//console.log(secureHost + ' redirecting to ' + '/login?next='+req.url);
			res.header('Cache-Control', 'no-cache, no-store')
			if(secureHost){
				//res.redirect(secureHost+'/login?next=' + req.url);
				//console.log('host: ' + req.headers.host)
				res.redirect('https://' + req.headers.host + req.url);
			}else{
				res.redirect('/login?next=' + req.url);
			}
		}


		internal.checkSession(sid, function(ok, userId){
			if(ok){
				_.assertInt(userId)
				internal.getEmail(userId, function(email){
					req.user = {id: userId, email: email};
					req.userToken = userId
					//console.log('session ok: ' + userId)
					next();
				});
			}else{
				//util.debug('redirecting to login');
				doLoginRedirect();
			}
		});
	}

	//set up services for signup, login, logout, and lost password reset.
	//all to be accessed via AJAX (these are not HTML resources.)

	function signup(req, res){

		var data = req.body;
		
		if(!_.isString(data.email) || !_.isString(data.password)){
			res.send({
				error: 'missing email or password'
			}, 400)
			return
		}

		log('/ajax/signup request received .email: ' + data.email);
		
		internal.findUser(data.email, function(userId){

			log('/ajax/signup found user?: ' + userId);
			
			if(userId !== undefined){
				internal.authenticate(userId, data.password, function(ok){
					if(ok){
						login(req,res);
					}else{
						res.send({
							error: 'user already exists and authentication failed'
						}, 403);
					}
				})
			}else{
				internal.makeUser(data.email, data.password, function(userId){
				
					log('created user ' + userId + ' ' + data.email);

					var session = internal.makeSession(userId, function(token){
						_.assertString(token)
						//setSessionCookie(res, session);
						//setLongSessionCookie(res, session)
						res.header('Cache-Control', 'no-cache, no-store')

						res.send({token: token, userId: userId});
					});
				}, true);
			}
		})
	}

	app.post('/ajax/signup', signup);

	function login(req, res){

		var data = req.body;

		log('/ajax/login request received .email: ' + data.email);
		//console.log('login')

		internal.findUser(data.email, function(userId){
			//console.log('found user: ' + userId);
			if(userId === undefined){
				res.send({
					error: 'authentication failed'
				}, 403);
			}else{
				util.debug('found user: ' + userId);
				internal.authenticate(userId, data.password, function(ok){

					if(ok){
						internal.makeSession(userId, function(token){
							res.header('Cache-Control', 'no-cache, no-store')
							res.send({token: token, userId: userId});
						});

					}else{
						res.send({
							error: 'authentication failed'
						}, 403);
					}
				});
			}
		});
	}

	app.post('/ajax/login', login);

	app.post('/ajax/logout', function(req, res){

		var sid = req.cookies.SID;

		if(sid !== undefined){
			sid = sid.substr(0, sid.indexOf('|'));
			res.clearCookie('SID');
			res.cookie('LOGGEDOUT','true')
			res.header('Cache-Control', 'no-cache, no-store')
			internal.clearAllSessions(sid, function(did){
				if(did){
					res.send({result: 'ok'});
				}else{
					res.send({result: 'unknown session token'});
				}
			});
		}

	});

	app.get('/ajax/checksessioncookie', authenticate, function(req, res){
		res.header('Cache-Control', 'no-cache, no-store')
		res.send({userId: req.userToken})
	})
	
	app.post('/ajax/checksession', function(req, res){

		//console.log(require('util').inspect(req))
		var token = req.body.token
		
		if(!token){
			res.send(403)
			return
		}

		internal.checkSession(token, function(ok, userId){
			if(ok){
				res.header('Cache-Control', 'no-cache, no-store')
				res.send({}, 200)
			}else{
				res.send(403)
			}
		})
	});

	var email = require('mailer');

	app.post('/ajax/resetpassword', function(req, res){
		var data = req.body;
		internal.getAuthenticationKeyEmail(data.key, function(email){
			if(email){
				log('finding user for email: ' + email);
				internal.findUser(email, function(userId){
					if(userId){

						log('changing password (from reset request) for ' + email);
					
						internal.setPassword(userId, data.password);
					
						internal.expireAuthenticationKey(data.key);
						res.header('Cache-Control', 'no-cache, no-store')
						res.send({result: 'ok'});
					}else{
						res.send({
							error: 'unknown email'
						}, 403);
					}
				});
			}else{
				res.send({
					error: 'invalid authentication key'
				}, 403);
			}
		});
	})

	app.post('/ajax/sendresetpasswordemail', function(req, res){
		var data = req.body;
		internal.findUser(data.email, function(userId){
			if(userId === undefined){
				res.send({
					error: 'email address not recognized'
				}, 403)
			}else{
				internal.createAuthenticationKey(data.email, function(lostPasswordKey){

					if(!app.emailConfig) throw new Error('cannot reset password with no app.emailConfig set');

					var appName = app.emailConfig.appName ? (app.emailConfig.appName+" ") : '';
				
					var text = '';
					text += "A password reset was requested for your " + appName + "account.\n";
					text += "If you did not request this, please ignore this message.\n";
					text += "To reset your password, click the following link or open it in a browser: ";
					text += data.link + lostPasswordKey;
					text += "\n";
			
					var emailMsg = {
						host : app.emailConfig.host,
						port : app.emailConfig.port || "587",
						to : data.email,
						from : app.emailConfig.from,
						subject : app.emailConfig.subject || (appName + "Password Reset Requested"),
						body: text,
						authentication : "login",
						username : app.emailConfig.username,
						password : app.emailConfig.password
					};
				
					log('sent password request email to ' + data.email);
			
					email.send(emailMsg,
					  function(err, result){
						if(err){
						  console.log(err);
						  res.send(500);
						}else{
							res.header('Cache-Control', 'no-cache, no-store')
							res.send(200);
						}
					});
				});
			}
		});
	});

	//app.js(exports, 'auth-utils', ['utils']);

	var loginPage = {
		url: '/login',
		//css: [],
		js: './simple_login',
		cb: function(req, res, cb){
			//console.log('cbing');
			cb({
				after: req.query.next || '', port: res.app.getPort(), securePort: res.app.getSecurePort(),
				title: app.loginTitle || 'Log In'
			});
		}
	};	

	var signupPage = {
		url: '/signup',
		//css: [],
		js: './simple_signup',
		cb: function(req, res, cb){
			cb({
				port: res.app.getPort(), securePort: res.app.getSecurePort(),
				title: app.signupTitle || 'Sign Up'
				})
		}
	};	
	
	var forceCookiePage = {
		url: '/forcecookie',
		js: './forcecookie'
	};	
	app.page(exports, forceCookiePage)
	
	var lostPasswordPage = {
		url: '/lostpassword',
		//css: [],
		js: './lostpassword',
		title: 'Lost Password',
		cb: function(req, res, cb){
			cb({
				port: res.app.getPort(), securePort: res.app.getSecurePort()
				})
		}
	};	

	var resetPasswordPage = {
		url: '/resetpassword/:key',
		//css: [],
		js: './resetpassword',
		title: 'Password Reset',
		cb: function(req, res, cb){
			cb({
				port: res.app.getPort(), securePort: res.app.getSecurePort(),
				key: req.params.key
				})
		}
	};	

	app.post('/ajax/signup', signup);
	app.post('/ajax/login', login);

	if(!secureHost){
		app.page(exports, loginPage);
		app.page(exports, signupPage);
	}
	app.page(exports, lostPasswordPage);
	app.page(exports, resetPasswordPage);
	
	return {
		authenticate: authenticate,
		authenticateByToken: authenticateByToken,
		onUserMade: function(listener){
			internal.onUserMade(listener)
		}
	}
}
