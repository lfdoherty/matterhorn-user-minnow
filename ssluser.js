
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

exports.load = function(app, secureApp, host, secureHost, internal){
	_.assertLength(arguments, 5)
	
	//_.assertObject(app)
	//_.assertObject(secureApp)
	
	/*function authenticate(req, res, next){
		console.log('authenticating securely');
		var sid = req.cookies.sid;

		function doLoginRedirect(){
			//sys.debug(sys.inspect(req));
			//var url = secureApp.settings.securehost + '/login?next=' + req.url;
			console.log('redirecting to ' + '/login?next='+req.url);
			//res.redirect(url);
			//res.send('need to use js redirect');
			res.app.javascriptRedirectToSecure(res, '/login?next=' + req.url);
		}

		if(sid === undefined){
			doLoginRedirect();
			return;
		}

		getUser().checkSession(sid, function(ok, userId){
			if(ok){
				getUser().getEmail(userId, function(email){
					req.user = {id: userId, email: email};
					next();
				});
			}else{
				sys.debug('redirecting to login');
				doLoginRedirect();
			}
		});
	}*/
	function authenticateByToken(token, cb){
		_.assertString(token)
		_.assertFunction(cb)
		//console.log('authenticating by token')
		
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
			//console.log('*redirecting to ' + secureHost+'/login?next='+host+req.url);
			res.redirect(secureHost+'/login?next=' + host + req.url);
		}


		internal.checkSession(sid, function(ok, userId){
			if(ok){
				_.assertInt(userId)
				internal.getEmail(userId, function(email){
					req.user = {id: userId, email: email};
					req.userToken = userId
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

	/*function signup(req, res){

		var data = req.body;

		getUser().makeUser(data.email, data.password, function(userId){
			//getUser().setEmail(userId, data.email);
			//getUser().setPassword(userId, data.password);

			var session = getUser().makeSession(userId);

			setSessionCookie(res, session);

			res.send(session);
		}, true);
	}

	app.post('/ajax/signup', signup);*/
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

						res.send({token: token, userId: userId});
					});
				}, true);
			}
		})
	}

	app.post('/ajax/signup', signup);
	/*function login(req, res){

		var data = req.body;

		console.log('/ajax/login request received : ' + data.email);

		getUser().findUser(data.email, function(userId){
			console.log('found user: ' + userId);
			if(userId === undefined){
				res.send({
					error: 'authentication failed'
				}, 403);
			}else{
				sys.debug('found user: ' + userId);
				getUser().authenticate(userId, data.password, function(ok){

					if(ok){
						var session = getUser().makeSession(userId);
		
						setSessionCookie(res, session);
						res.send(session);
				
					}else{
						res.send({
							error: 'authentication failed'
						}, 403);
					}
				});
			}
		});
	}*/
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

	/*app.post('/ajax/logout', function(req, res){

		var sid = req.cookies.sid;

		if(sid !== undefined){
			getUser().clearSession(sid);
			res.clearCookie('SID');
		}

		res.send({result: 'ok'});	
	});*/
	app.post('/ajax/logout', logout);
	secureApp.post('/ajax/logout', logout);
	function logout(req, res){

		var sid = req.cookies.SID;

		if(sid !== undefined){
			sid = sid.substr(0, sid.indexOf('|'));
			res.clearCookie('SID');
			res.cookie('LOGGEDOUT','true')
			internal.clearSession(sid, function(did){
				if(did){
					res.send({result: 'ok'});
				}else{
					res.send({result: 'unknown session token'});
				}
			});
		}

	}

	//secureApp.js(exports, 'auth-utils', ['utils']);

	var loginPage = {
		url: '/login',
		//css: [],
		js: './simple_login',
		cb: function(req, res, cb){
			console.log('cbing');
			cb({after: req.query.next, port: app.port, securePort: app.securePort,
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
				title: app.signupTitle || 'Sign Up'
			})
		}
	};	

	secureApp.post('/ajax/signup', signup);
	secureApp.post('/ajax/login', login);

	secureApp.page(exports, loginPage);
	secureApp.page(exports, signupPage);
	
	return {
		authenticate: authenticate,
		authenticateByToken: authenticateByToken,
		onUserMade: function(listener){
			internal.onUserMade(listener)
		}
	}
}
