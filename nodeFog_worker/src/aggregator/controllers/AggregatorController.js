/**
 * Constrolador del módulo Aggregator 
 * @author José Luis Urbano Orgaz
 */
 'use strict';

 //Imports
 const nodeFogPath = '../../../';
 const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
 const DeamController = require(nodeFogPath + 'src/common/controllers/DeamController.js');
 
 module.exports = class AggregatorController extends DeamController {
 
     /**
      * Constructor parametrizado
      * @param {App} app Instancia de la aplicación
      * @param {LogController} logController Instancia del controlador de logs
      */
     constructor(app, logController) {
         super(app, logController);
     }

     /**
      * Elimina el flujo de las colas con el fin de permitir la ejecución de
      * nuevos flujos con el mismo identificador
      * @param {String} taskFlowId Identificador del flujo a eliminar
      */
     deleteTaskFlow(taskFlowId) {
        this._app.requestsStack.delete(taskFlowId);
        this._app.resultsStack.delete(taskFlowId);
        this._logController.log('Flujo de tareas eliminado: ' + taskFlowId);
     }

     /**
      * Elimina una tarea pendiente assignada a un nodo esclavo
      * @param {String} id Identificador de la tarea 
      * @param {String} taskFlowId Identificador del flujo
      */
     removePendingTaskFromSlaves(id,taskFlowId) {
        const slaveNodes = Object.values(this._app.slaveNodes);
        slaveNodes.forEach(function(slaveNode) {
          slaveNode.removePendingTaskById(id,taskFlowId);
        });
      };

}
