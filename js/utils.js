
function getParameterByName(name) {

    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));

}
exports.getParameterByName = getParameterByName

var OneMonth = 1000*60*60*24*30

function makeCookie(token, userId){
	
	var loc = document.location;

	var domainStr = (loc.hostname === 'localhost' ? ';path=/' : '; domain=' + loc.hostname+';path=/');
	var newCookie = token + '|'+userId + domainStr;

	var loggedoutDomainStr = (loc.hostname === 'localhost' ? ';path=/' : '; host=' + loc.hostname+';path=/');
	
	newCookie = 'SID='+newCookie;
	newCookie += '; Expires='+new Date(Date.now()+OneMonth).toUTCString();
	//newCookie += domainStr
	console.log('set cookie: ' + newCookie)
	var loggedOutCookie = 'LOGGEDOUT=true; Expires='+new Date(0).toUTCString()+loggedoutDomainStr
	console.log('clearing loggedout, setting to: ' + loggedOutCookie)
	document.cookie = loggedOutCookie
	console.log('cookie: ' + document.cookie)
	document.cookie = newCookie
	console.log('cookie: ' + document.cookie)
}
exports.makeCookie = makeCookie
