
'use strict';

const nodeFogPath = '../../../';

const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const MasterNodeArray = require(nodeFogPath + 'src/common/model/MasterNodeArray.js');
const SlaveNode = require(nodeFogPath + 'src/common/model/SlaveNode.js');
const DeamApi = require(nodeFogPath +"src/common/apis/DeamApi");

/**
 * Manager API
 * @description Inicialización de los puntos de entrada al componente Manager de la aplicación
 * @author José Luis Urbano Orgaz
 */
module.exports = class ManagerApi extends DeamApi {

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
    * Función de inicialización del componente
    */
   init() {
    this._app.expressApp.get(ApiConstants.MANAGER_API_PATH+'/:isMasterCandidate', function (req, res){
      const requestingHost = req.get('referer');
      const nodeScore = req.get('score');
      const nodeDefaultBattery = req.get('defaultBattery');
      const isMasterCandidate = req.params.isMasterCandidate;
      if(VariableUtils.isDefined(requestingHost)) {
        const [requestingHostInterface, requestingApiPort] = requestingHost.split(':');
        const refererNode = new SlaveNode(requestingHostInterface,requestingApiPort, nodeScore, nodeDefaultBattery);
        if(!this._app.masterNodeArray.isMasterNode(refererNode)) {
          //Inicialización de un nuevo esclavo que solicita formar parte del sistema: evitamos al propio
          //nodo maestro, que podría realizar este tipo de petición como esclavo en caso de sufrir un
          //reinicio
          this._isComponentLogEnabled && this._logController.log(isMasterCandidate);
          const slaveNode = new SlaveNode(requestingHostInterface,requestingApiPort, nodeScore, nodeDefaultBattery);
          if(isMasterCandidate === 'true') {
            this._app.masterNodeArray.addNode(slaveNode);
            this.apiController._updateNodeScore(slaveNode);
            this.app.masterNodeArray.sortArray();
            this._logController.log('Candidato a maestro añadido'+slaveNode.getAddress());
          }
          this._app.slaveNodes[requestingHost] = slaveNode;

        }
        const responseObject = {};
        responseObject['masterNodeArray'] = this._app.masterNodeArray;
        responseObject['requestsStack'] = this._app.requestsStack.toParseableObject();
        responseObject['slaveNodes'] = this._app.slaveNodes;
        res.end(JSON.stringify(responseObject));
      }
      res.end();
    }.bind(this));

    this._app.expressApp.post(ApiConstants.MANAGER_API_PATH, function (req, res){
      //API de recepción de datos desde el nodo maestro, tanto a los esclavos, como a sí mismo, en caso de haber sido
      //iniciado con tareas de ejecución
      const responseObject = {};
      const receivedMasterNodeArray = MasterNodeArray.clone(req.body.requestedTask.masterNodeArray);
      const requestsStack = req.body.requestedTask.requestsStack;
      const resultsStack = req.body.requestedTask.resultsStack;
      const slaveNodes = req.body.requestedTask.slaveNodes;
      const previousMasterNode = this._app.masterNodeArray.getCurrentMasterNode();
      if (!this._app.masterNodeArray.isMasterNode(this._app.node)) {
        //Si se trata de un nodo esclavo
        const wasOrphanSlaveNode = !VariableUtils.isDefined(previousMasterNode);
        this._app.masterNodeArray.updateArray(receivedMasterNodeArray); //Actualizamos pesos, disponibilidad de nodos, colas...
        //this.app.requestsStack.fromJson(requestsStack);
        const currentMasterNode = this._app.masterNodeArray.getCurrentMasterNode();
        if(wasOrphanSlaveNode || this._app.masterNodeArray.getNodeIndex(previousMasterNode) != 0) {
          //Mostramos un texto en caso de que se haya conectado el esclavo por primera vez o se haya cambiado el nodo maestro
          this._logController.log('Estableciendo nodo como esclavo en ' + this._app.node.networkInterface + ':' + this._app.node.apiPort);
          this._logController.log('Nodo maestro de referencia establecido: ' + currentMasterNode.networkInterface + ':' + currentMasterNode.apiPort);

        }
      } else if(!this._app.node.isEquals(receivedMasterNodeArray.getCurrentMasterNode())) {
        //En caso de tratarse del propio maestro recibiendo una solicitud por parte de
        //otro nodo para ser máster
        //const receivedMasterNode = receivedMasterNodeArray.getCurrentMasterNode();
        //receivedMasterNode.score = previousMasterNode.score + 1;
        this._app.masterNodeArray.merge(receivedMasterNodeArray); //Actualizamos pesos, disponibilidad de nodos...

        //En este caso nos interesa devolver los flujos de tareas y resultados
        //actuales, puesto que es el máster el que dispone de la información más
        //actualizada
        responseObject['requestsStack'] = this._app.requestsStack.toParseableObject();
        
        //Asimismo, el master comunicará los esclavos conocidos actualmente
        //ya que se pueden haber incorporado o eliminado esclavos a lo largo de
        //la ejecución
        responseObject['masterNodeArray'] = this._app.masterNodeArray;
        responseObject['slaveNodes'] = this._app.slaveNodes;
        


      }
      this.app.updateSlaveNodeList(slaveNodes);
      this._app.node.updateSystemInformationStatus(function() {
        responseObject['node'] = this._app.node.getSimplifiedClone();
          res.end(JSON.stringify(responseObject));
        }.bind(this),
        this._app.appArguments
      );
      this._apiController.updateLastMasterRequest();
      this._logController.log('Métricas actualizadas');
    }.bind(this));
  }

  get app() {
    return this._app;
  }
}
