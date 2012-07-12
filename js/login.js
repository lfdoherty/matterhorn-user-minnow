
require('matterhorn-standard/js/jquery')
var u = require('./utils')

var pollsave = require('matterhorn-standard/js/pollsave')//.pollsave

jQuery(document).ready(function(){

	jQuery("#submit").click(function(){
		
		var email = jQuery("#email").val();
		var password = jQuery("#password").val();

		var json = {email: email, password: password};

		function ok(res){

			var loc = window.location;
			
			console.log('got res: ' + JSON.stringify(res))
			res = JSON.parse(res)

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
