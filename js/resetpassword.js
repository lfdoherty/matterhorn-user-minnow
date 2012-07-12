//#requires matterhorn-standard:jquery,ajax utils

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>Enter New Password</h2>'+
	'<form action="javascript:;">'+
	'Password: <input id="password" type="password" size="25"></input>' + 
	'<input id="submit" type="submit" value="Change Password"></input>'+
	'</form>'+
	'<br/><br/>'+
	'<div id="result"/>'+
	'</div>';

$('body').html(script);

$(document).ready(function(){
	
	$("#submit").click(function(){
		
		var password = $("#password").val();

		var json = {
			key: key,
			password: password
		};

		function ok(cookie){

			//var script = '';
			//script += '<p>Please open the link sent to <b>' + email + '</b> to reset your password.</p>';
			//script += '
			//$('body').html(script);
			window.location = '/login';
		}

		function fail(err){
			alert('Cannot reset password: this link has expired.  Please make a new password reset request');
			var loc = window.location
			window.location = loc.protocol + '//' + loc.host + '/lostpassword'
		}

		pollsave(json, '/ajax/resetpassword', 200, ok, fail);
	});
})
