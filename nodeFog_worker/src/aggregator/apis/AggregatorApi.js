'use strict';

const nodeFogPath = '../../../';

const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const DeamApi = require(nodeFogPath + "src/common/apis/DeamApi");

/**
 * Aggregator API
 * @description Inicialización de los puntos de entrada al componente Aggregator del servidor
 * @author José Luis Urbano Orgaz
 */
module.exports = class AggregatorApi extends DeamApi {

  /**
   * Constructor parametrizado
   * @param {App} app instancia nodeFogWorkerApp
   * @param {LogController} logController controlador de logs
   * @constructor
   */
  constructor(app, apiController, logController) {
    super(app, apiController, logController);
  }

  /**
   * Función de inicialización
   */
  init() {
    //GET result
    this._app.expressApp.get(ApiConstants.AGGREGATOR_API_PATH+'/:id', function (req, res) {
      const taskFlowId = req.params.id
      const currentTaskTree = this._app.requestsStack.get(taskFlowId);
      if (typeof currentTaskTree != undefined && currentTaskTree != null) {
        res.end(JSON.stringify({
          results: currentTaskTree.results,
          masterNodeArray: this._app.masterNodeArray
        }));
      } else {
        res.end(JSON.stringify({
          masterNodeArray: this._app.masterNodeArray
        }));
      }
    }.bind(this));

    //POST result
    this._app.expressApp.post(ApiConstants.AGGREGATOR_API_PATH, function (req, res) {
      const jsonReceivedRequest = req.body; //Receives json

      const id = jsonReceivedRequest.requestedTask.id;
      const result = jsonReceivedRequest.requestedTask.result;
      const taskFlowId = jsonReceivedRequest.requestedTask.taskFlowId;

      this._logController.log('Agregación realizada: Id tarea: ' + id + ' Resultado:' + result);
      //Actualizamos el resultado de la tarea, y comprobaremos si quedan tareas en la
      //lista de tareas por obtener el resultado (caso secuencial, en concurrencia y race
      //simplemente deberemos comprobar que se haya asignado su ejecución)
      const currentTaskTree = this._app.requestsStack.get(taskFlowId);
      if (currentTaskTree) {
        //Este control es necesario por si se ha reiniciado el nodo maestro, no dispone del árbol de tareas,
        //y se recibe algún resultado antes de finalizar la sincronización
        currentTaskTree.results[id] = result;
        this._apiController.removePendingTaskFromSlaves(id, taskFlowId);
        this._app.executeTaskList(currentTaskTree.taskFlowExecution, currentTaskTree.results, currentTaskTree.taskFlowExecution);
      }


    }.bind(this));

    //DELETE result
    this._app.expressApp.delete('/result/:id', function (req, res) {
      const taskFlowId = req.params.id;
      this._apiController.deleteTaskFlow(taskFlowId);
      this._logController.log('Flujo de tareas ' + taskFlowId + ' finalizado y eliminado');
      res.end(JSON.stringify({
        deleted: taskFlowId
      }));
    }.bind(this));
  }

  get app() {
    return this._app;
  }
}