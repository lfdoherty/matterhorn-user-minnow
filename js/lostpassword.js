//#requires matterhorn-standard:jquery,ajax utils

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>Reset Lost Password</h2>'+
	'<form action="javascript:;">'+
	'My Email: <input id="email" type="text"></input><br/><br/>'+
	'<input id="submit" type="submit" value="Reset Password"></input>'+
	'</form>'+
	'<br/><br/>'+
	'<div id="result"/>'+
	'</div>';

jQuery('body').html(script);

jQuery(document).ready(function(){
	
	jQuery("#submit").click(function(){
		
		var email = jQuery("#email").val();

		var loc = window.location
		var link = loc.protocol + '//' + loc.host + '/resetpassword/';
		
		var json = {email: email,
			link: link};

		function ok(cookie){

			var script = '';
			script += '<p>Please open the link sent to <b>' + email + '</b> to reset your password.</p>';
			jQuery('body').html(script);
		}

		function fail(){
			alert('reset failure: email not recognized');
		}

		pollsave(json, '/ajax/sendresetpasswordemail', 200, ok, fail);
	});
})
