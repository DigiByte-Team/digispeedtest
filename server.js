var request = require('request');
var bitcoin = require('bitcoin');
var async = require('async');

var client = new bitcoin.Client({
  host: '127.0.0.1',
  port: 14022,
  user: 'user',
  pass: 'password',
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

function sendMany(address, amount, txsToSend, cb){
	var start = +new Date();
	var count = 0;
	var arr = [];
	async.whilst(
	    function () { return count <= txsToSend; },
	    function (callback) {
			sendToAddress(address, amount, function(data){
				arr.push([data]);
				count++
				callback();
			});	    	
	    },
	    function (err) {
	    	var end = +new Date();
	        return cb(end-start);
	    }
	);

}

sendMany('3CJJ8Z6QHvDdmDXbPcUjpxc88ZotnFR8Cs', 0.001, 5, function(data){
	console.log(data);
})
