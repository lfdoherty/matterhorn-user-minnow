"use strict";

var util = require('util');
var _ = require('underscorem')

exports.dir = __dirname;
exports.module = module
exports.name = 'matterhorn-insecure-user';
exports.requirements = ['matterhorn-standard'];

var getUser = require('./internalmaker').getUser;

function setSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true});
}
var OneMonth = 1000*60*60*24*30
function setLongSessionCookie(res, session){
	res.cookie('SID', session, {httpOnly: true, secure: true, expires: new Date(Date.now()+OneMonth)});
}

exports.authenticate = function(req, res, next){
	console.log('authenticating');

	if(req.cookies.sid === undefined){
		doLoginRedirect();
		return;
	}

	var pi = req.cookies.sid.indexOf('|')
	if(pi === -1){
		doLoginRedirect();
		return;
	}
	var sid = req.cookies.sid.substr(0, pi);

	function doLoginRedirect(){
		//sys.debug(sys.inspect(req));
		//var url = secureApp.settings.securehost + '/login?next=' + req.url;
		console.log('redirecting to ' + '/login?next='+req.url);
		//res.redirect(url);
		//res.send('need to use js redirect');
		//res.app.javascriptRedirectToInsecure(res, '/login?next=' + req.url);
		res.redirect('/login?next=' + req.url);
	}


	getUser().checkSession(sid, function(ok, userId){
		if(ok){
			getUser().getEmail(userId, function(email){
				req.user = {id: userId, email: email};
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

	getUser().findUser(data.email, function(userId){

		if(userId !== undefined){
			getUser().authenticate(userId, data.password, function(ok){
				if(ok){
					login(req,res);
				}else{
					res.send({
						error: 'user already exists and authentication failed'
					}, 403);
				}
			})
		}else{
			getUser().createUser(function(userId){
				getUser().setEmail(userId, data.email);
				getUser().setPassword(userId, data.password);
				
				console.log('created user ' + userId + ' ' + data.email);

				var session = getUser().makeSession(userId, function(token){
					_.assertString(token)
					//setSessionCookie(res, session);
					//setLongSessionCookie(res, session)

					res.send({token: token, userId: userId});
				});
			});
		}
	})
}

app.post(exports, '/ajax/signup', signup);

function login(req, res){

	var data = req.body;

	console.log('/ajax/login request received .email: ' + data.email);

	getUser().findUser(data.email, function(userId){
		console.log('found user: ' + userId);
		if(userId === undefined){
			res.send({
				error: 'authentication failed'
			}, 403);
		}else{
			util.debug('found user: ' + userId);
			getUser().authenticate(userId, data.password, function(ok){

				if(ok){
					getUser().makeSession(userId, function(token){
						res.send(JSON.stringify({token: token, userId: userId}));
					});
		
					//setSessionCookie(res, session);
					//setLongSessionCookie(res, session)
				
				}else{
					res.send({
						error: 'authentication failed'
					}, 403);
				}
			});
		}
	});
}

app.post(exports, '/ajax/login', login);

app.post(exports, '/ajax/logout', function(req, res){

	var sid = req.cookies.sid;

	if(sid !== undefined){
		getUser().clearSession(sid);
		res.clearCookie('SID');
	}

	res.send({result: 'ok'});	
});

var email = require('mailer');

app.post(exports, '/ajax/resetpassword', function(req, res){
	var data = req.body;
	getUser().getAuthenticationKeyEmail(data.key, function(email){
		if(email){
			console.log('finding user for email: ' + email);
			getUser().findUser(email, function(userId){
				if(userId){

					console.log('changing password (from reset request) for ' + email);
					
					getUser().setPassword(userId, data.password);
					
					getUser().expireAuthenticationKey(data.key);
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

app.post(exports, '/ajax/sendresetpasswordemail', function(req, res){
	var data = req.body;
	getUser().findUser(data.email, function(userId){
		if(userId === undefined){
			res.send({
				error: 'email address not recognized'
			}, 403)
		}else{
			getUser().createAuthenticationKey(data.email, function(lostPasswordKey){

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
				
				console.log('sent password request email to ' + data.email);
			
				email.send(emailMsg,
				  function(err, result){
					if(err){
					  console.log(err);
					  res.send(500);
					}else{
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
		console.log('cbing');
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

app.post(exports, '/ajax/signup', signup);
app.post(exports, '/ajax/login', login);

app.page(exports, loginPage);
app.page(exports, signupPage);
app.page(exports, lostPasswordPage);
app.page(exports, resetPasswordPage);
