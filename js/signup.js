
var pollsave = require('matterhorn-standard/js/pollsave')//.pollsave
var u = require('./utils')

jQuery(document).ready(function(){

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
