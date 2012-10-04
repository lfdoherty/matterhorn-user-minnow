require('matterhorn-standard/js/jquery')
//require('./signup')
var pollsave = require('matterhorn-standard/js/pollsave')//.pollsave
var u = require('./utils')

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>' + title + '</h2>'+
	'<form action="javascript:;">'+
	'Email: <input id="email" name="email" type="text"></input><br/><br/>'+
	'Password: <input id="password" name="password" type="password" size="25"></input><br/><br/>'+
	'<input id="submit" type="submit" value="Submit"></input>'+
	'</form>'+
	'<br/><br/>'+
	'<div id="result"/>'+
	'</div>';


jQuery(document).ready(function(){
	document.body.innerHTML = script

	jQuery("#submit").click(function(){
		
		var email = jQuery("#email").val();
		var password = jQuery("#password").val();

		var json = {email: email, password: password};

		function ok(res){
			
			console.log('got ok')
			
			//res = JSON.parse(res)
			
			u.makeCookie(res.token, res.userId);
			
			var next = u.getParameterByName('next');
			if(!next){
				next = '/';
			}
			document.location = 'http://' + document.location.hostname + ':' + port + next;
		}

		function fail(err){
			alert('registration failure: ' + err.error);
		}

		pollsave(json, '/ajax/signup', 200, ok, fail);
	});
});
