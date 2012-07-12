require('matterhorn-standard/js/jquery')
require('./signup')

var script = '<div>'+
	'<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'+
	'<h2>' + title + '</h2>'+
	'<form action="javascript:;">'+
	'Email: <input id="email" type="text"></input><br/><br/>'+
	'Password: <input id="password" type="password" size="25"></input><br/><br/>'+
	'<input id="submit" type="submit" value="Submit"></input>'+
	'</form>'+
	'<br/><br/>'+
	'<div id="result"/>'+
	'</div>';

jQuery('body').html(script);
