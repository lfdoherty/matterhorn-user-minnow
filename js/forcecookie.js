//require('matterhorn-standard/js/jquery')
//require('./login')

var u = require('./utils')

var script = '<noscript><h1><font color="red">You must enable Javascript to use this website.<br/><br/><br/></font></h1></noscript>'

var userId = parseInt(u.getParameterByName('userId'))
var token = u.getParameterByName('token')

u.makeCookie(token, userId)

window.location = u.getParameterByName('next');
