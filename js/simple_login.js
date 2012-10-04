require('matterhorn-standard/js/jquery')
//require('./login')

var u = require('./utils')

var pollsave = require('matterhorn-standard/js/pollsave')//.pollsave

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>' + title + '</h2>'+
	'<form action="javascript:;">'+
	'Email: <input id="email" name="email" type="text"></input><br/><br/>'+
	'Password: <input id="password" name="password" type="password" size="25"></input>' + 
		'&nbsp;&nbsp;&nbsp;&nbsp;<a href="/lostpassword' + window.location.search + '">I Forgot My Password</a>' +
	'<br/><br/>'+
	'<input id="submit" type="submit" value="Submit"></input>'+
	'<span style="padding-left:3em"><a id="signuplink" href="/signup">Create New Account</a></span>'+
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

			var loc = window.location;
			
			console.log('got res: ' + JSON.stringify(res))
			//res = JSON.parse(res)

			u.makeCookie(res.token, res.userId);
			
			jQuery("#result").append("Login Successful");
			
			window.location = 'http://' + window.location.host + after;
		}

		function fail(){
			alert('login failure');
		}

		pollsave(json, '/ajax/login', 200, ok, fail);
	});
	
	var next = u.getParameterByName('next');

	if(next){
		var signup = jQuery('#signuplink');
		signup.attr('href', signup.attr('href')+'?next='+next);
	}
});
