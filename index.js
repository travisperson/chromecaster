#!/usr/bin/env node

var chromecasts = require('chromecasts')
var parseArgs = require('minimist')
var http = require('http')
var fs = require('fs')
var os = require('os');
var readline = require("readline")

var ifaces = os.networkInterfaces();
var interfaces = []

Object.keys(ifaces).forEach(function (ifname) {
	ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
			return;
		}

		interfaces.push(iface.address)
	});
});

var argv = parseArgs(process.argv.slice(2))

function help() {
	console.log("--players                  List out the players on the network")
	console.log("--cast <chromecast> <file> Play the given file on the provided chromecast")
}

if(argv.help) {
	help()
} else if(argv.players) {
	console.log("Press ctrl+c to stop scanning at anytime")
	chromecasts().on('update', function (player) {
		console.log("%s (%s)", player.name, player.host)
	})
} else if(argv.cast) {
	chromecasts().on('update', function (player) {
		if(player.name == argv.cast) {
			var server = http.createServer(function(req, res) {
				var stream = fs.createReadStream(__dirname + '/' + argv._[0]);
				stream.pipe(res)
			});

			server.listen(0, function() {
				var port = server.address().port
				var host;

				var player_host = player.host.split('.');

				// Find the interface we should use
				interfaces.forEach(function(iface) {
					var octets = iface.split('.')

					if(player_host[0] == octets[0]
					&& player_host[1] == octets[1]) {
						host = iface
					}
				})

				player.play('http://' + host + ':' + port + '/', {title: 'my video', type: 'video/mp4'})
					console.log('Enter \'help\' for available commands');
					var commands = 'help pause resume stop'

					var rl = readline.createInterface({
						input: process.stdin,
						output: process.stdout,
						completer: function(line) {
							compleitions = commands.split(' ')
							var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
							return [hits.length ? hits : completions, line]
						}
					})

					rl.setPrompt('> ')
					rl.prompt()

					rl.on('line', function (cmd) {
						switch(cmd) {
							case 'help':
								console.log(commands)
								break;
							case 'pause':
								player.pause();
							break;
							case 'resume':
								player.resume();
							break;
							case 'stop':
								player.stop();
							break;
							default:
								console.log('Unknown command \''+cmd+'\'')
							break;
						}
						rl.prompt()
					})
			})
		}
	})
} else {
	help()
}

