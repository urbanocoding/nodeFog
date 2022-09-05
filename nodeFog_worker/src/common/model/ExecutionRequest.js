/**
 * Execution request
 * @description Inmutable request model
 * @author José Luis Urbano Orgaz
 */
'use strict';

module.exports = class ExecutionRequest {

	/**
	 * Default constructor
	 * @param {RemoteConnection} remoteConnection Connection to external service
	 * @param
	 * @constructor
	 */
	 constructor(remoteConnection, delegatedTask, callbackFunction, errorFunction){
		 this.remoteConnection = remoteConnection;
		 this.delegatedTask = delegatedTask;
		 this.callbackFunction = callbackFunction;
		 this._errorFunction = errorFunction;
	 }

	 /**
	  * Getter
	  * @return {RemoteConnection[]} request connections
	  */
	 getRemoteConnection() {
		 return this.remoteConnection;
	 }

	 getDelegatedTask() {
		 return this.delegatedTask;
	 }

	 getCallbackFunction() {
		 return this.callbackFunction;
	 }

	 get errorFunction() {
		 return this._errorFunction;
	 }
}
