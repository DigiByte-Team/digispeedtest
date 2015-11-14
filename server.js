var request = require('request');
var bitcoin = require('bitcoin');
var async = require('async');
var cluster = require('cluster');
var fs = require('fs');
var settings = require('./settings');

var client = new bitcoin.Client({
  host: '127.0.0.1',
  port: 14022,
  user: settings.rpcUsername,
  pass: settings.rpcPassword,
  timeout: 30000
});

function getBalance(cb) {
	client.cmd('getbalance', function(err, balance, resHeaders){
	  if (err) return console.log(err);
	  return cb('Balance:' + balance);
	});
}

function sendToAddress(address, amount, cb){
	client.cmd('sendtoaddress', address, amount, function(err, sent){
		return cb(sent);
	})
}

function sendMany(address, amount, cb){
	var start = +new Date();
	var count = 0;
	var arr = [];
	var keepRuning = false
	async.whilst(
		function () { return keepRuning === false },
	    function (callback) {
			sendToAddress(address, amount, function(data){
				callback();
			});	    	
	    },
	    function (err) {
	    	var end = +new Date();
	        return cb(end-start);
	    }
	);

}

if (cluster.isMaster) {
  	fs.writeFile('./cluster.pid', process.pid, function (err) {
    	if (err) {
      		console.log('Error: unable to create cluster.pid');
      		process.exit(1);
    	} else {
      		console.log('Starting cluster with pid: ' + process.pid);    
      		//ensure workers exit cleanly 
     		process.on('SIGINT', function() {
        		console.log('Cluster shutting down..');
        		for (var id in cluster.workers) {
          			cluster.workers[id].kill();
        		}
        		// exit the master process
        		process.exit(0);
      		});

     		// Count the machine's CPUs
      		var cpuCount = require('os').cpus().length;

      		// Create a worker for each CPU
      		for (var i = 0; i < cpuCount; i += 1) {
        		cluster.fork();
      		}

		    // Listen for dying workers
      		cluster.on('exit', function () {
        		cluster.fork();
      		});
    	}
  	});
} else {
	sendMany(settings.sendToAddress, settings.sendAmount, function(data){
		console.log(data);
	});
}
