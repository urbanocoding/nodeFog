'use strict';

module.exports = class RequestController {

	/**
	 * Executes all remote requests
	 * @param {ExecutionRequest} request Execution request model
	 */
	static executeRequest(executionRequest) {
		const remoteConnection = executionRequest.getRemoteConnection();
		const requestDelegatedTask = executionRequest.getDelegatedTask();
		RequestController.doRequest(remoteConnection, requestDelegatedTask, executionRequest);
	}

	/**
	 * Makes a remote request
	 * @param {RemoteConnection} remoteConnection
	 * @param {function} requestDelegatedAction remote worker's job
	 * @param {Object[]} requestActionParameters parameters to send to the funtion TODO are really necessary, the can be initialized when setting up the function on client
	 */
	static doRequest(remoteConnection, requestedTask = {blank: 'blank'}, executionRequest) {
		const http = require("http");
		var req = http.request(remoteConnection.getAnonymousObject(), function(res) {
			  // console.log('Headers: ' + JSON.stringify(res.headers));
			  res.setEncoding('utf8');
			  res.on('data', function (body) {
				  var callbackFunction = executionRequest.getCallbackFunction()
				  callbackFunction(body)
				  //console.log('Body: ' + body);
			  });
			});
			req.on('error', function(e) {
				if(executionRequest.errorFunction) {
					executionRequest.errorFunction(e);
				}
			});
			// write data to request body
			req.write(
				JSON.stringify({
					requestedTask
					//requestActionParameters
				})
			);
			req.end();
	}


}
