require('matterhorn-standard/js/jquery')
require('./login')

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>' + title + '</h2>'+
	'<form action="javascript:;">'+
	'Email: <input id="email" type="text"></input><br/><br/>'+
	'Password: <input id="password" type="password" size="25"></input>' + 
		'&nbsp;&nbsp;&nbsp;&nbsp;<a href="/lostpassword' + window.location.search + '">I Forgot My Password</a>' +
	'<br/><br/>'+
	'<input id="submit" type="submit" value="Submit"></input>'+
	'<span style="padding-left:3em"><a id="signuplink" href="/signup">Create New Account</a></span>'+
	'</form>'+
	'<br/><br/>'+
	'<div id="result"/>'+
	'</div>';

jQuery('body').html(script);
