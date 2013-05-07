
function getParameterByName(name) {

    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));

}
exports.getParameterByName = getParameterByName

var OneMonth = 1000*60*60*24*30

function makeCookie(token, userId){
	
	var loc = document.location;

	var domainStr = (loc.hostname === 'localhost' ? '' : '; domain=' + loc.hostname);
	var newCookie = token + '|'+userId + domainStr;

	newCookie += '; Expires='+new Date(Date.now()+OneMonth).toUTCString();
	newCookie = 'SID='+newCookie;
	console.log('set cookie: ' + newCookie)
	document.cookie = 'LOGGEDOUT=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
	document.cookie = newCookie
}
exports.makeCookie = makeCookie
