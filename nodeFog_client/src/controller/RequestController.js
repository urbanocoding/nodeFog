'use strict';

/**
 * RequestController
 * @description Clase estática para simplificar la ejecución de peticiones
 * @author José Luis Urbano Orgaz
 */
module.exports = class RequestController {

	/**
	 * Executes remote request
	 * @param {ExecutionRequest} request Execution request model
	 */
	static executeRequest(executionRequest, callbackFunction) {
		const remoteConnection = executionRequest.remoteConnection;
		const requestDelegatedTask = executionRequest.delegatedTask;
		RequestController.doRequest(remoteConnection, requestDelegatedTask, callbackFunction, executionRequest.errorFunction);
	}

	/**
	 * Realiza una petición http remota
	 * @param {RemoteConnection} remoteConnection
	 * @param {function} requestDelegatedAction remote worker's job
	 * @param {Object[]} requestActionParameters parameters to send to the funtion TODO are really necessary, the can be initialized when setting up the function on client
	 */
	static doRequest(remoteConnection, requestedTask, callbackFunction, errorFunction) {
		const http = require("http");
		const req = http.request(remoteConnection.getAnonymousObject(), function (res) {
			res.setEncoding('utf8');
			res.on('data', function (body) {
				callbackFunction(body)
			});
		});
		req.on('error', function (e) {
			errorFunction && errorFunction(e);
		});
		req.write(
			JSON.stringify({
				requestedTask
			})
		);
		req.end();
	}


}