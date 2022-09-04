'use strict';


const fs = require('fs');
const Constants = require('../constants/Constants.js');
const ExecutionRequest = require('./ExecutionRequest.js');

/**
 * NodeFog Client
 * @description Modelo de la aplicación
 * @author José Luis Urbano Orgaz
 */
class NodeFogClient {

  /**
  * Constructor
  * @constructor
  * @param {RemoteConnection} remoteConnection Conexión remota al sistema
  */
  constructor(remoteConnection) {
    this._remoteConnection = remoteConnection;
  }

  /**
  * Ejecuta un flujo de tareas
  * @param {TaskFlow} taskFlow Flujo de tareas a ejecutar
  * @param {Function} callbackFunction Función de callback ejecutada en caso de éxito
  * @param {Function} errorFunction Función de callback ejecutada en caso de error
  */
  executeTaskFlow(taskFlow, completedCallbackFunction, progressCallbackFunction, errorCallbackFunction) {
    //Inicialización de parámetros de la conexión
    this._remoteConnection.path = Constants.JOBS_API_PATH;
    this._remoteConnection.method = Constants.POST_METHOD;
    this._remoteConnection.headers =  Constants.JSON_HEADER_CONTENT_TYPE;

    //Solicitud de ejecución
    const executionRequest =
        new ExecutionRequest(
          taskFlow,
          this._remoteConnection,
          taskFlow.taskFlowExecution,
          completedCallbackFunction,
          progressCallbackFunction,
          errorCallbackFunction
    );
    executionRequest.execute();
  }

  /**
  * Ejecuta un fichero de flujo de tareas
  * @param {TaskFlow} taskFlow Flujo de tareas a ejecutar
  * @param {Function} callbackFunction Función de callback ejecutada en caso de éxito
  * @param {Function} errorFunction Función de callback ejecutada en caso de error
  */
  executeFileTaskFlow(taskFlow, completedCallbackFunction, progressCallbackFunction, errorCallbackFunction) {
    fs.readFile(taskFlow.path, 'utf8', function (err, data) {
      if (err) {
        errorCallbackFunction(err);
      }
      taskFlow.taskFlowExecution = JSON.parse(data);
      this.executeTaskFlow(taskFlow,completedCallbackFunction, progressCallbackFunction, errorCallbackFunction);
    }.bind(this));
  }

}

module.exports = NodeFogClient;
