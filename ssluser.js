
var urlModule = require('url')
var querystring = require('querystring')


var _ = require('underscorem')

exports.module = module
//exports.dir = __dirname;
//exports.name = 'matterhorn-ssl-user';
//exports.requirements = ['matterhorn-standard'];

//var getUser = require('./internalmaker').getUser;

var log = require('quicklog').make('user-minnow/secure')
var sys = require('util')

function setSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true});
}

exports.load = function(app, secureApp, host, secureHost, internal, prefix){
	_.assertLength(arguments, 6)
	prefix = prefix||''

	function authenticateByToken(token, cb){
		_.assertString(token)
		_.assertFunction(cb)
		//console.log('authenticating by token')
		
		internal.checkSession(token, function(ok, userId){
			if(ok){
				_.assertInt(userId)
				cb(undefined, userId)
			}else{
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
		
		//console.log('cookies: ' + JSON.stringify(req.cookies))
		if(req.cookies.LOGGEDOUT){
			doLoginRedirect()
			return
		}
		var sid = req.cookies.SID.substr(0, pi);

		function doLoginRedirect(){
			var protocol = req.headers["x-forwarded-proto"] || req.protocol
			//console.log('*redirecting to ' + secureHost+'/login?next='+req.headers.host+req.url + ' ' + protocol);
			//console.log(JSON.stringify(req.headers))
			//res.redirect(secureHost+'/login?next=' + host + req.url);
			var newUrl = 'https://' + req.headers.host + prefix+'/login?next='+protocol+'://' + req.headers.host + req.url
			//console.log('*redirecting to: ' + newUrl)
			res.header('Cache-Control', 'no-cache, no-store')
			res.redirect(newUrl);
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
				util.debug('redirecting to login');
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

		internal.findUser(data.email, function(userId){
			log('found user: ' + userId);
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

	function logoutHandler(req, res){
		
		console.log('/logout GET')
		
		res.header('Cache-Control', 'no-cache, no-store')
		
		doLogout(req, res, function(err){
			if(err){
				console.log('err: ' + err)
				res.send('<html><body>Error during logout: ' + err + '</body></html>')//{result: err});
			}else{
				//res.send('<html><body>You have been logged out.</body></html>');
				var parsedUrl = urlModule.parse(req.url, true)
				//querystring.parse(parsedUrl.)
				var next = parsedUrl.query.next
				
				if(next){
					console.log('redirecting to: ' + next)
					res.redirect(next)
				}else{
					console.log('straightforward msg: ' + req.url + ' ' + JSON.stringify(parsedUrl))
					res.send('<html><body>You have been logged out.</body></html>');
				}
			}
		})
	}
	app.get('/logout', logoutHandler)
	secureApp.get('/logout', logoutHandler)
	
	function doLogout(req, res, cb){
		var sid = req.cookies.SID;

		if(sid !== undefined){
			sid = sid.substr(0, sid.indexOf('|'));
			res.clearCookie('SID');
			res.cookie('OLDSID', req.cookies.SID)
			res.cookie('LOGGEDOUT','true')
			internal.clearSession(sid, function(did){
				if(did){
					//res.send({result: 'ok'});
					cb()
				}else{
					//res.send({result: 'unknown session token'});
					cb('unknown session token')
				}
			});
		}else{
			cb('no cookie')
		}
	}

	app.post('/ajax/logout', logout);
	secureApp.post('/ajax/logout', logout);
	function logout(req, res){
	
		res.header('Cache-Control', 'no-cache, no-store')

		doLogout(req, res, function(err){
			if(err){
				res.send({result: err});
			}else{
				res.send({result: 'ok'});
			}
		})
	}

	//secureApp.js(exports, 'auth-utils', ['utils']);

	var loginPage = {
		url: '/login',
		//css: [],
		js: './simple_login',
		cb: function(req, res, cb){
			console.log('cbing');
			cb({after: req.query.next, port: app.port, securePort: app.securePort, PostUrl: prefix+'/ajax/login',
				SignupUrl: prefix+'/signup',
				title: app.loginTitle || 'Log In'
			});
		}
	};	
	var signupPage = {
		url: '/signup',
		//css: [],
		js: './simple_signup',
		cb: function(req, res, cb){
			cb({port: res.app.getPort(), securePort: res.app.getSecurePort(), 
				PostUrl: prefix+'/ajax/signup',
				title: app.signupTitle || 'Sign Up'
			})
		}
	};	

	secureApp.post('/ajax/signup', signup);
	secureApp.post('/ajax/login', login);

	secureApp.page(exports, loginPage);
	secureApp.page(exports, signupPage);
	
	var forceCookiePage = {
		url: '/forcecookie',
		js: './forcecookie'
	};	
	secureApp.page(exports, forceCookiePage)
	
	return {
		authenticate: authenticate,
		authenticateByToken: authenticateByToken,
		onUserMade: function(listener){
			internal.onUserMade(listener)
		}
	}
}
