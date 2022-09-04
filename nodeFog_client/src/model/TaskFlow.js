
'use strict';

/**
 * TaskFlow
 * @description Modelo de flujo de taras
 * @author José Luis Urbano Orgaz
 */
module.exports = class TaskFlow {

  /**
	 * Constructor
	 * @constructor
   * @param {String} path Ruta del fichero contenedor del flujo de tareas
	 */
	 constructor(path){
     this._path = path;
     this._id = undefined;
     this._taskFlowExecution = undefined;
		 this._results = {};
	 }

   /**
    * Devuelve si ya se ha solicitado la ejecución del flujo de tareas
    * @returns {Boolean} true en caso afirmativo, false si no
    */
   isTaskFlowExecutionStarted() {
     //En caso de disponer de un array de resultados, aunque solo sea con
     //tareas asignadas, el flujo ha sido iniciado
     if(this._results) {
      const resultItems = Array.from(Object.keys(this._results));
      return resultItems.length && resultItems.length > 0;
     }
     return false;
   }

   /**
   * Comprueba si el flujo de ejecución ha finalizado en base a si existen
   * tareas asignadas o no
   * @return {Boolean} true en caso de haber terminado, false si no (o no ha empezado)
   */
   isTaskFlowExecutionFinnished() {
     if (this.isTaskFlowExecutionStarted()){
       const resultValues = Object.values(this._results);
       const assignedResults = Array.from(resultValues).filter(
         function(resultValue) {
           return resultValue == 'assigned';
         }
       );

       return assignedResults.length == 0;
     }
     return false; //Si ni siquiera ha iniciado, obviamente no ha terminado
   }

   get id() {
     return this._id;
   }

   set id(id) {
     this._id = id;
   }

   get taskFlowExecution() {
     return this._taskFlowExecution;
   }

   set taskFlowExecution(taskFlowExecution) {
     this._taskFlowExecution = taskFlowExecution;
   }

   get path() {
     return this._path;
   }

   get results() {
     return this._results;
   }

   set results(results) {
     this._results = results;
   }
}
