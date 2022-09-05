
'use strict';


const nodeFogPath = '../../../';
const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const ManagerConstants = require(nodeFogPath + 'src/common/constants/ManagerConstants.js');
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const RequestController = require(nodeFogPath + 'src/common/controllers/RequestController.js');
const RemoteConnection = require(nodeFogPath + 'src/common/model/RemoteConnection.js');
const ExecutionRequest = require(nodeFogPath + 'src/common/model/ExecutionRequest.js');
const SlaveNode = require(nodeFogPath + 'src/common/model/SlaveNode.js');

const DeamController = require(nodeFogPath + 'src/common/controllers/DeamController.js');

/**
 * ManagerController
 * @description Controlador para los recursos de monitorización
 * @author José Luis Urbano Orgaz
 */
module.exports = class ManagerController extends DeamController {


  /**
   * Constructor parametrizado
   * @param {App} app Instancia de la aplicación
   * @param {LogController} logController Instancia del controlador de logs
   */
  constructor(app, logController) {
    super(app, logController);
    this.lastMasterRequest = 0;
  }

  /**
   * Obtiene la lista de direcciones de los nodos cuya conexión se considera expirada
   * @param {Integer} deprecationLapse Lapso de tiempo de expiración en milisegundos [Opcional]
   * @return {String[]} Direcciones de los nodos esclavos deprecados
   */
  _getDeprecatedSlaveNodes(deprecationLapse = 30000) {
    const currentTimestamp = Date.now();
    const slaveNodeKeys = Object.keys(this.app.slaveNodes);
    return slaveNodeKeys.filter(function (slaveNodeKey) {
      //Filtramos los esclavos cuyo atributo lastChecked esté sin definir,
      //cuyo valor haya expirado, o el caso en que el propio nodo actúe como esclavo
      const slaveNode = this.app.slaveNodes[slaveNodeKey];
      return (!VariableUtils.isDefined(slaveNode.lastChecked) ||
          currentTimestamp - slaveNode.lastChecked > deprecationLapse) &&
        !this.app.node.isEquals(slaveNode);
    }.bind(this));
  }

  /**
   * Solicita el despacho de las tareas pendientes de un esclavo
   * @param {SlaveNode} slaveNode Nodo esclavo
   */
  _requestSlavePendingTaskDispatchment(slaveNode) {
    slaveNode.pendingTasks.forEach(function (pendingTask) {
      const taskFlowId = pendingTask.taskFlowId;
      const currentTaskTree = this.app.requestsStack.get(taskFlowId);
      console.log('ACTIOOOON' + pendingTask.id + ' - ' + pendingTask.action)
      this.app.executeTask(pendingTask, currentTaskTree.results);
    }.bind(this));
  }

  /**
   * Calcula la puntuación para el nodo: para ello, delega en la función
   * especificada en el fichero de configuración
   * @param {Node} node 
   */
  _updateNodeScore(node) {
    ManagerConstants.MASTER_NODE_SCORING_FUNCTION(node);

  }


  /**
   * Función ejecutada por el máster para actualizar los datos de los nodos esclavos
   */
  syncSlaveNodes() {
    const masterNodeArray = this.app.masterNodeArray;
    if(this._app.masterNodeArray.isMasterNode(this._app.node)) {
      //Nos aseguramos de que solo el maestro ejecuta a partir de aquí: de este modo, controlamos
      //que no esté en pleno proceso de cambio y haya temporalmente 2 maestros
      this.app.slaveNodes[this.app.node.networkInterface + ':' + this.app.node.apiPort] &&
        this.app.slaveNodes[this.app.node.networkInterface + ':' + this.app.node.apiPort].setChecked();

        const slaveNodeKeys = Object.keys(this.app.slaveNodes);
        this.logController.log('Nodo en modo maestro con dirección ' + this._app.node.getAddress() + ', nodos esclavos en '+ slaveNodeKeys);

      //const masterSlaveNodes = Object.values(this.app.slaveNodes); //Transformamos el mapa indexado en array
      const deprecatedSlaveNodeKeys = this._getDeprecatedSlaveNodes();

      deprecatedSlaveNodeKeys.forEach(function (slaveNodeKey) {
        const slaveNode = this.app.slaveNodes[slaveNodeKey];
        const apiEndpoint = ApiConstants.MANAGER_API_PATH;
        const remoteConnection =
          new RemoteConnection(
            slaveNode.networkInterface,
            slaveNode.apiPort,
            apiEndpoint,
            ApiConstants.POST_METHOD,
            ApiConstants.JSON_HEADER_CONTENT_TYPE
          );

        const executionRequest =
          new ExecutionRequest(
            remoteConnection, {
              masterNodeArray: masterNodeArray,
              slaveNodes: this.app.slaveNodes
            },
            function (response) {
              const receivedSlaveNodeData = JSON.parse(response);
              const receivedNodeObject = receivedSlaveNodeData.node;
              const receivedPendingTasksObject = receivedNodeObject.pendingTasks;
              const receivedRequestStackObject = receivedSlaveNodeData.requestsStack;
              const receivedMasterNodeArray = receivedSlaveNodeData.masterNodeArray;
              const receivedSlaveNodesObject = receivedSlaveNodeData.slaveNodes;

              if (VariableUtils.isDefined(receivedMasterNodeArray)) {
                //Si los datos recibidos incluyen datos como el masterNodeArray,
                //slaveNodes y demás, estamos en el caso en que el nodo máster
                //está siendo reemplazado, por lo que deberemos sincronizar todos
                //sus estados
                this._logController.log('Proceso de reemplazo de nodo maestro en curso');
                this.app.requestsStack.fromJson(receivedRequestStackObject);
                this.app.masterNodeArray.replaceMasterNodeArray(receivedMasterNodeArray);
                this.app.updateSlaveNodeList(receivedSlaveNodesObject);
                const currentTaskTree = this.app.requestsStack.getFirst();
                if (VariableUtils.isDefined(currentTaskTree)) {
                  this.app.executeTaskList(currentTaskTree.taskFlowExecution, currentTaskTree.results, currentTaskTree.taskFlowExecution, true);
                }


              } else {
                //En caso de no recibirse dichos datos y únicamente disponer de
                //los datos de información del sistema del nodo, se tratará de un
                //nodo esclavo que simplemente comunica su estado
                this.app.slaveNodes[slaveNodeKey].updateRemoteSystemInformationStatus(receivedNodeObject);
                this._updateNodeScore(this.app.slaveNodes[slaveNodeKey]);
                    this.app.masterNodeArray.sortArray();
                this._logController.log('Nodo ' + slaveNode.networkInterface + ":" + slaveNode.apiPort + ' sincronizado');
              }

              if (receivedPendingTasksObject.length == 0 && slaveNode.pendingTasks.length > 0) {
                //Control del posible causa de error: el slave no tiene tareas
                //pendientes porque se ha reiniciado pero el master sí le ha
                //encargado tareas: llamaremos al dispatcher para que las reevalúe
                this._requestSlavePendingTaskDispatchment(slaveNode);
              } else {
                slaveNode.syncPendingTasks(receivedNodeObject);
              }
            }.bind(this),
            function (error) {
              //Evitamos que se asignen nuevas tareas al nodo
              slaveNode.resetLastChecked();

              const nodeKey = slaveNode.networkInterface + ':' + slaveNode.apiPort;
              this.app.masterNodeArray.removeNode(slaveNode);
              if (slaveNode.pendingTasks.length > 0) {
                this._logController.log('Nodo ' + nodeKey + ' no conectado - Se reasignan tareas:' + slaveNode.pendingTasks);
                this._requestSlavePendingTaskDispatchment(slaveNode);
              } else {
                this._logController.log('Nodo ' + nodeKey + ' no conectado');
              }
            }.bind(this)
          );
        RequestController.executeRequest(executionRequest);
      }.bind(this));
    } else {
      //En caso de no ser maestro, ejecutamos la función de los esclavos
      this.syncMasterNode();
    }
  }

  /**
   * Función ejecutada por los nodos esclavos para comprobar que el máster se encuentra
   * activo
   */
  syncMasterNode() {

    const nodeIndex = this.app.masterNodeArray.getNodeIndex(this.app.node);
    const currentTimestamp = Date.now();
    const deprecationLapse = 30000;
    const nodeMasterDelegationTimeout = (2 + nodeIndex) * deprecationLapse;

    if (nodeIndex > 0 && nodeMasterDelegationTimeout < currentTimestamp - this.lastMasterRequest) {
      //Existen indicios para pensar que el master ha caído: procedemos a realizar
      //una petición
      const masterNode = this.app.masterNodeArray.getCurrentMasterNode();
      const apiEndpoint = ApiConstants.MANAGER_API_PATH+'/true';
      const remoteConnection =
        new RemoteConnection(
          masterNode.networkInterface,
          masterNode.apiPort,
          apiEndpoint,
          ApiConstants.GET_METHOD, 
          {
            'Content-Type': 'application/json',
            'referer': this._app.node.networkInterface + ':' + this._app.node.apiPort,
             'score': this._app.node.score,
             'defaultBattery': this._app.node.systemInformation.defaultBattery
          }
        );
      const executionRequest =
        new ExecutionRequest(
          remoteConnection,
          undefined,
          function (response) {
            //Este es un caso raro, en el que el maestro hace tiempo que no contacta con el esclavo,
            //pero al ejecutar este la petición, el nodo sigue en pie: es posible que el nodo
            //maestro fuera reiniciado, por lo que dejaremos seguir su curso 
            const receivedSlaveNodeData = JSON.parse(response);
            const receivedRequestStackObject = receivedSlaveNodeData.requestsStack;
            const receivedMasterNodeArray = receivedSlaveNodeData.masterNodeArray;
            const receivedSlaveNodesObject = receivedSlaveNodeData.slaveNodes;

            this.app.requestsStack.fromJson(receivedRequestStackObject);
            this.app.masterNodeArray.replaceMasterNodeArray(receivedMasterNodeArray);
            this.app.updateSlaveNodeList(receivedSlaveNodesObject);
            if(this.app.isMasterNode()) {
              const currentTaskTree = this.app.requestsStack.getFirst();
              if (VariableUtils.isDefined(currentTaskTree)) {
                this._logController.log('Detectado reinicio en nodo maestro');
                this._logController.log('Se retoma el flujo de tareas '+currentTaskTree.id);
                this.app.executeTaskList(currentTaskTree.taskFlowExecution, currentTaskTree.results, currentTaskTree.taskFlowExecution, true);
              }
            } else {
              const currentMasterNode = this.app.masterNodeArray.getCurrentMasterNode();
              this._logController.log('Sincronizado con nodo maestro en '+currentMasterNode.getAddress());
            }
          }.bind(this),
          function (error) {
            //El esclavo realiza la petición pero esta produce error, lo que indica que, o bien el nodo, o bien
            //la comunicación, han sufrido algún tipo de problema. Se procede con el proceso de reemplazo, comunicando
            //al resto de nodos accesibles la situación.
            this._logController.log('Imposible conectar con nodo maestro: se inicia el proceso de reemplazo');
            this.app.setAllSlaveNodesAsChecked(); //Activamos todos los nodos esclavos y delegamos en el dispatcher y el monitor la gestión de los esclavos que no se encuentren en funcionamiento
            this.app.masterNodeArray.removeNode(this.app.masterNodeArray.getCurrentMasterNode());
            this.syncSlaveNodes();

            const firstPendingTaskFlow = this.app.requestsStack.getFirst();
            if (VariableUtils.isDefined(firstPendingTaskFlow)) {
              this.app.executeTaskList(firstPendingTaskFlow.taskFlowExecution, firstPendingTaskFlow.results, firstPendingTaskFlow.taskFlowExecution, true);
            }

          }.bind(this)
        );
      RequestController.executeRequest(executionRequest);
    } else {
      const slaveNodeKeys = Object.keys(this.app.slaveNodes);
      this.logController.log('Nodo en modo esclavo con dirección ' + this._app.node.getAddress() + ', nodos esclavos en '+ slaveNodeKeys);
    }
  }

  /**
   * Actualiza el timestamp del atributo de última petición realizada
   */
  updateLastMasterRequest() {
    this.lastMasterRequest = Date.now();
  }
}