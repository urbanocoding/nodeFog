'use strict';

const Constants = require('../constants/Constants.js');
const RequestController = require('../controller/RequestController.js');
const RemoteConnection = require('./RemoteConnection.js');

/**
 * ExecutionRequest
 * @description Modelo inmutable de petición
 * @author José Luis Urbano Orgaz
 */
module.exports = class ExecutionRequest {

	/**
	 * Default constructor
	 * @param {TaskFlow} taskFlow Instancia del conjunto flujo de tareas que se desea ejecutar - resultados
	 * @param {RemoteConnection} remoteConnection Connection to external service
	 * @param {Object} delegatedTask Flujo de tareas a transmitir
	 * @param {Function} completedCallbackFunction Función de ejecución finalizada satisfactoriamente
	 * @param {Function} progressCallbackFunction Función de revisión de estado periódica
	 * @param {Function} errorCallbackFunction Función de error
	 * @constructor
	 */
	constructor(taskFlow, remoteConnection, delegatedTask, completedCallbackFunction, progressCallbackFunction, errorCallbackFunction) {
		this._taskFlow = taskFlow;
		this._masterNodeArray = new Array();
		this._remoteConnection = remoteConnection;
		this._delegatedTask = delegatedTask;
		this._completedCallbackFunction = completedCallbackFunction;
		this._progressCallbackFunction = progressCallbackFunction;
		this._errorCallbackFunction = errorCallbackFunction;
	}

	/**
	 * Realiza la petición para obtener los resultados actuales
	 */
	_requestExecutionResult() {
		const masterNode = this._masterNodeArray[0];
		const host = masterNode.networkInterface;
		const port = masterNode.apiPort;

		const resultRemoteConnection = new RemoteConnection(host, port);
		resultRemoteConnection.path = Constants.RESULT_API_PATH + this._taskFlow.id;
		resultRemoteConnection.method = Constants.GET_METHOD;
		resultRemoteConnection.headers = Constants.JSON_HEADER_CONTENT_TYPE;

		RequestController.doRequest(resultRemoteConnection, undefined, function (resultResponse) {
				const parsedResponse = JSON.parse(resultResponse);
				this._masterNodeArray = parsedResponse.masterNodeArray.wrappedArray;
				const receivedMasterNode = parsedResponse.masterNodeArray.wrappedArray[0];
				if (receivedMasterNode.networkInterface == host && receivedMasterNode.apiPort == port) {
					//En caso de que el nodo maestro lo siga siendo, no hay problema, continuamos con la ejecución normal
					this._taskFlow.results = parsedResponse.results;
					if (this._progressCallbackFunction) {
						this._progressCallbackFunction(parsedResponse);
					}
					if (!this._taskFlow.isTaskFlowExecutionFinnished()) {
						setTimeout(function () {
							this._requestExecutionResult();
						}.bind(this), Constants.REQUEST_PERIOD);
					} else {
						//Una vez conocemos el resultado, eliminamos la tarea y finalizamos
						const deleteRemoteConnection = new RemoteConnection(host, port);
						resultRemoteConnection.path = Constants.RESULT_API_PATH + this._taskFlow.id;
						resultRemoteConnection.method = Constants.DELETE_METHOD;
						resultRemoteConnection.headers = Constants.JSON_HEADER_CONTENT_TYPE;
						RequestController.doRequest(resultRemoteConnection, undefined, this._completedCallbackFunction, this._errorCallbackFunction);
					}
				} else {
					//Sin embargo, puede darse el caso de que el nodo maestro haya cambiado, lo que nos obliga a repetir la petición para asegurarnos.
					//Puesto que masterNodeArray ya ha sido actualizado, el antiguo nodo maestro devolverá error, y se volverá a preguntar al esclavo,
					//con la esperanza de que se haya actualizado. No obstante, daremos un timeout para darle tiempo.
					setTimeout(function () {
						this._requestExecutionResult();
					}.bind(this), Constants.REQUEST_PERIOD);
				}


			}.bind(this),
			function (error) {
				if ((error.code == 'ECONNREFUSED' || error.code == 'ECONNRESET') && this._masterNodeArray.length > 1) {
					this._masterNodeArray.shift();
					this._requestExecutionResult();
				} else {
					this._errorCallbackFunction(error);
				}
			}.bind(this)
		)

	}

	/**
	 * Función de ejecución de la petición
	 */
	execute() {
		RequestController.executeRequest(this, function (requestResponse) {
				const executionResponse = JSON.parse(requestResponse);
				this._taskFlow.id = executionResponse.taskFlowId;
				this._masterNodeArray = executionResponse.masterNodeArray.wrappedArray;
				setTimeout(function () {
					this._requestExecutionResult();
				}.bind(this), Constants.REQUEST_PERIOD);
			}.bind(this),
			this._errorCallbackFunction
		);
	}

	/*********************************************************************************************
	 									GETTERS Y SETTERS
	 *********************************************************************************************/

	get delegatedTask() {
		return this._delegatedTask;
	}

	get remoteConnection() {
		return this._remoteConnection;
	}

	get taskFlow() {
		return this._taskFlow;
	}

	get errorFunction() {
		return this._errorFunction;
	}
}