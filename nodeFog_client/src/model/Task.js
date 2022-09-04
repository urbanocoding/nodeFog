
'use strict';

/**
 * Task
 * @description Modelo inmutable de tarea
 * @author José Luis Urbano Orgaz
 */
module.exports = class Task {

	/**
	 * Constructor por defecto
	 * @constructor
	 */
	 constructor(){
		 this.id = undefined;
		 this.parentNodeId = undefined;
		 this.taskFlowId = undefined;
		 this.action = undefined;
		 this.isLocked = false;
		 this.result = undefined;
	 }

	 /**
	  * Establece los atributos desde un objeto JSON
	  * @param {JSONObject} jsonData Objeto JSON
	  */
	 parseJson(jsonData) {
		 this.id = jsonData.id;
		 this.parentNodeId = jsonData.parentNodeId;
		 this.taskFlowId = jsonData.taskFlowId;
		 this.action = jsonData.action;
		 this.isLocked = jsonData.isLocked;
		 this.result = jsonData.result;
	 }

	 getId() {
		 return this.id;
	 }

	 getParentNodeId() {
		 return this.parentNodeId;
	 }

	 getTaskFlowId() {
		 return this.taskFlowId;
	 }

	 getAction() {
		 return this.action;
	 }

	 setAction(action) {
		 this.action = action.toString();
	 }

	 setResult(result) {
		 this.result = result;
	 }

	 getResult() {
		 return this.result;
	 }

	 setLocked(isLocked) {
		 this.isLocked = isLocked;
	 }

	 getLocked() {
		 return this.isLocked;
	 }
};
