'use strict';

/**
 * RequestController
 * @description Clase estática para facilitar la realización de peticiones remotas
 * @author José Luis Urbano Orgaz
 */
module.exports = class RequestController {

	/**
	 * Ejecuta una petición remota dado el modelo de ExecutionRequest
	 * @param {ExecutionRequest} request Modelo de Execution Request
	 */
	static executeRequest(executionRequest) {
		const remoteConnection = executionRequest.getRemoteConnection();
		const requestDelegatedTask = executionRequest.getDelegatedTask();
		RequestController.doRequest(remoteConnection, requestDelegatedTask, executionRequest);
	}

	/**
	 * Realiza una petición remota
	 * @param {RemoteConnection} remoteConnection Instancia del modelo de conexión
	 * @param {Object} requestDelegatedAction Elemento a enviar
	 * @param {ExecutionRequest} request Modelo de Execution Request
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
