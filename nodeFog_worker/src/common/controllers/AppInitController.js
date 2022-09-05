/**
 * Controller for app initialization
 * @author José Luis Urbano Orgaz
 */
'use strict';

//Imports
const nodeFogPath = '../../../';
const PropertyFileReader = require('properties-reader');
const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const SlaveNode = require(nodeFogPath + 'src/common/model/SlaveNode.js');
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const Controller = require(nodeFogPath + 'src/common/controllers/Controller.js');
const RequestController = require(nodeFogPath + 'src/common/controllers/RequestController.js');
const RemoteConnection = require(nodeFogPath + 'src/common/model/RemoteConnection.js');
const ExecutionRequest = require(nodeFogPath + 'src/common/model/ExecutionRequest.js');

//Constants
const slavePropertiesPath = 'config/slaves.properties';
const modulesPropertiesPath = 'config/modules.properties';

module.exports = class AppInitController extends Controller {

  /**
   * Parametrized constructor
   * @param {App} app instancia de la aplicación
   * @param {AppConfiguration} initConfiguration configuración inicial recibida por argumentos
   * @constructor
   */
   constructor(app, initConfiguration) {
     super(app);
     this._initConfiguration = initConfiguration;
   }

   _getLinkNode(linkNodePath) {
    const splittedLinkNodePath = linkNodePath.split(':');
    const url = splittedLinkNodePath[0];
    if(VariableUtils.isDefinedNotEmptyString(url)) {
      return new SlaveNode(
        url,
        splittedLinkNodePath.length == 2?
          splittedLinkNodePath[1]:
          3000, //Puerto por defecto
        this._initConfiguration.getScore(),
        this._initConfiguration.getBattery() 
      );
    }
    return undefined;
   }

   _initSlaveNodesConfigFromArgs() {
    const linkNodePath = this._initConfiguration.getLink();
    if(VariableUtils.isDefined(linkNodePath)) {
      const linkNode = this._getLinkNode(linkNodePath);
      if(VariableUtils.isDefined(linkNode)) {
        this._app.slaveNodes[linkNodePath] = linkNode;
      }
    }
   }

   /**
   * Carga en memoria los nodos del sistema a partir del fichero de propiedades
   * correspondiente (solo para los candidatos a nodo master)
   */
   _initSlaveNodesConfigFromSlavesPropertyFile() {
     const slaveProperties = new PropertyFileReader(slavePropertiesPath);
     const slavePaths = slaveProperties.get('slaves.paths');
     if(VariableUtils.isDefined(slavePaths)) {
       const splittedSlavePaths = slavePaths.split(' ');
       splittedSlavePaths.forEach(function(slavePath) {
        const slaveNode = this._getLinkNode(slavePath);
        if(VariableUtils.isDefined(slaveNode)) {
          this._app.slaveNodes[slavePath] = slaveNode;
        }
       }.bind(this));
     }
   }

   /**
    * Carga en memoria los nodos del sistema, tanto los definidos desde argumento, como los que se
    * encuentran en el fichero de propiedades
    */
   _initSlaveNodesConfig() {
    this._initSlaveNodesConfigFromArgs();
    this._initSlaveNodesConfigFromSlavesPropertyFile();
   }

   /**
   * Establece los módulos que se encontrarán habilitados para ejecución en else
   * nodo
   */
   _initModules() {
     const moduleProperties = new PropertyFileReader(modulesPropertiesPath);
     const moduleWhitelist = moduleProperties.get('modules.whitelist');
     if(VariableUtils.isDefined(moduleWhitelist)) {
       if(moduleWhitelist == '*') {
         this._app.modules.isSafeExecutionEnabled = false;
       } else {
        console.log('safemode')
         this._app.modules.isSafeExecutionEnabled = true;
         const splittedmoduleWhitelist = moduleWhitelist.split(' ');
         splittedmoduleWhitelist.forEach(function(moduleWhitelistEntry) {
           this._app.modules.enabledModules.push(moduleWhitelistEntry);
         }.bind(this));
       }
     }
   }

   /**
   * Realiza la petición de disponibilidad al array de nodos pasado como argumento
   * @param {SlaveNode[]} remoteNodes Nodos a los que realizar la solicitud
   * @param {Function} callbackFunction Función de callback a ejecutar una vez se consigue encontrar el máster
   * @param {int} remoteNodeIndex Índice del array al que se realizará la petición [Opcional]
   */
   _doMasterNodeRequest(remoteNodes, callbackFunction, remoteNodeIndex = 0) {
     const currentRemoteNode = remoteNodes[remoteNodeIndex];
     const apiEndpoint = ApiConstants.MANAGER_API_PATH+'/true';
     const remoteConnection =
       new RemoteConnection(
         currentRemoteNode.networkInterface,
         currentRemoteNode.apiPort,
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
             function(response) {
               //En caso de éxito, existe un nodo máster y por tanto, llamamos a
               //la función de callback con la información conseguida
               const parsedResponse = JSON.parse(response);
               callbackFunction(parsedResponse,currentRemoteNode);
             }.bind(this),
             function(error) {
               const nextRemoteIndex = remoteNodeIndex + 1;
               if(nextRemoteIndex < remoteNodes.length) {
                 console.log('Nodo '+currentRemoteNode.getAddress()+' no alcanzable: se intenta comunicar con el siguiente nodo remoto');
                 this._doMasterNodeRequest(remoteNodes, callbackFunction, nextRemoteIndex); //Intentamos con otros nodos
               } else {
                 callbackFunction();
               }
             }.bind(this)
       );
       RequestController.executeRequest(executionRequest);
   }

   /**
   * Solicita al resto de nodos su disponibilidad con el fin de conectarse a la
   * red de nodos si existiera, o crearla como máster si no
   * @param {Function} callbackFunction Función de callback a ejecutar una vez se consigue encontrar el máster
   */
   _lookForMasterNode(callbackFunction) {
     const remoteNodes = Object.values(this._app.slaveNodes);
     if(remoteNodes.length > 0) {
      this._doMasterNodeRequest(remoteNodes, callbackFunction);
     }
   }

   /**
    * Callback con la respuesta del nodo maestro
    * @param {JSON} jsonReceivedResponse Respuesta recibida del nodo
    * @param {Node} respondigRemoteNode Nodo que realiza la respuesta
    */
   _communicateMasterNode(jsonReceivedResponse, respondigRemoteNode) {
    if(VariableUtils.isDefined(jsonReceivedResponse)) {
      //Si se han recibido datos de otros nodos, existe un maestro y por lo tanto nos
      //conectamos a él
      const receivedRequestStackObject = jsonReceivedResponse.requestsStack;
      const receivedMasterNodeArray = jsonReceivedResponse.masterNodeArray;
      const receivedSlaveNodesObject = jsonReceivedResponse.slaveNodes;

      this.app.requestsStack.fromJson(receivedRequestStackObject);
      this.app.masterNodeArray.replaceMasterNodeArray(receivedMasterNodeArray);
      this.app.updateSlaveNodeList(receivedSlaveNodesObject);

      const currentMasterNode = this._app.masterNodeArray.getCurrentMasterNode();

      if(this.app.isMasterNode()) {
        console.log('Iniciando nodo en modo maestro');
        const currentTaskTree = this.app.requestsStack.getFirst();
        if (VariableUtils.isDefined(currentTaskTree)) {
          console.log('Se retoma el flujo de tareas '+currentTaskTree.id);
          this.app.executeTaskList(currentTaskTree.taskFlowExecution, currentTaskTree.results, currentTaskTree.taskFlowExecution, true);
        }
      } else { 
        if (currentMasterNode.isEquals(respondigRemoteNode)) {
        console.log('Nodo maestro conectado en '+currentMasterNode.getAddress());
        this._app.syncMasterNode();
        } else {
          console.log('Nodo maestro detectado en '+currentMasterNode.getAddress());
          const remoteNodes = Object.values(this._app.slaveNodes);
          remoteNodes.unshift(currentMasterNode);
          this._doMasterNodeRequest(remoteNodes, this._communicateMasterNode.bind(this));
        }
      }
    } else {
      //En caso de no recibir datos de otros nodos, pasamos a tomar el rol
      //de máster
      console.log('Todos los intentos de obtención de maestro agotados; este nodo pasa a tomar el rol de maestro');
      
      this._app.syncSlaveNodes();
    }
   }

   /**
   * Inicialización de la aplicación
   */
   init() {
     if(this._app.isInitializedAsMasterNodeCandidate()) {
       //Si se inicia como un posible nodo máster, procederemos a realizar la
       //soncronización con el resto de nodos
       this._app.masterNodeArray.syncNode(this._app.node);
       this._initModules();
       this._initSlaveNodesConfig();
       this._lookForMasterNode(this._communicateMasterNode.bind(this));
    }
   }

}
