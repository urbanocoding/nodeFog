
'use strict';

const nodeFogPath = '../../../';

const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const DeamApi = require(nodeFogPath +"src/common/apis/DeamApi");

/**
 * Dispatcher API
 * @description Inicialización de los puntos de entrada al componente Dispatcher del servidor
 * @author José Luis Urbano Orgaz
 */
module.exports = class DispatcherApi extends DeamApi {

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
    //POST jobs
    this.app.expressApp.post(ApiConstants.DISPATCHER_API_PATH, function (req, res){
      const requestedTask = req.body.requestedTask;

      if(this.app.isMasterNode()) {
        //Si es el nodo maestro, comenzaremos el dispatching
        if(!VariableUtils.isDefined(this.app.requestsStack.get(requestedTask.id))) {
          this._logController.log('Flujo de tareas recibido: dispatching '+requestedTask.id);
          this._apiController.setTaskTreeLeafIds(requestedTask.taskFlowExecution,requestedTask.id);
          requestedTask.results = {};
          this.app.requestsStack.addTaskTree(requestedTask);
          this._apiController.executeTaskList(requestedTask.taskFlowExecution,requestedTask.results);
          this._apiController.redirectTaskListToSlaveNodes(requestedTask);
        } else {
          this._logController.log('Flujo de tareas recibido ya en ejecución '+requestedTask.id);
        }
      } else {
        //En caso de no ser el nodo maestro, puede ser que se reciban los datos desde un cliente para que
        //los reenviemos al nodo maestro, o desde el propio maestro para que los almacenemos como medida
        //de seguridad
        const currentMasterNode = this.app.masterNodeArray.getCurrentMasterNode();
        const requestingHost = req.get('referer');
        //Comprobamos que el host que realiza la petición no sea el master, para evitar
        //reenviarle algo que él mismo nos envía
        if(requestingHost != currentMasterNode.getAddress()) {
          //Si no se trata del nodo maestro, le reenviaremos el flujo de tareas
          this._logController.log('Flujo de tareas '+requestedTask.id+' recibido: se reenvía al nodo maestro en '+currentMasterNode.getAddress());
          this._apiController.redirectTaskListToMaster(requestedTask);
        } else {
          this._logController.log('Flujo de tareas '+requestedTask.id+' recibido desde el maestro; se almacena temporalmente');
          this.app.requestsStack.addTaskTree(requestedTask);
        }
      }
      //Seamos nodo maestro o no, devolveremos el identificador del flujo (por si en el futuro se desea
      //generar automáticamente), y la lista de nodos maestros, para que el solicitante sepa si este
      //nodo es el maestro, así como sus posibles reemplazos
      res.send({
        taskFlowId: requestedTask.id,
        masterNodeArray: this.app.masterNodeArray
      });
      res.end();
    }.bind(this));
  }
}
