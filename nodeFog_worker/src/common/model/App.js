/**
 * App model
 * @description App model, created when starting nodeFOG and kept while executing the app
 * @author José Luis Urbano Orgaz
 */
'use strict';

//Imports
const bodyParser = require('body-parser');
const express = require('express');


const nodeFogPath = '../../../';
const AppConfiguration = require(nodeFogPath + 'src/common/model/AppConfiguration.js');
const TaskTreesQueue = require(nodeFogPath + 'src/common/model/TaskTreesQueue.js');
const MasterNodeArray = require(nodeFogPath + 'src/common/model/MasterNodeArray.js');
const Node = require(nodeFogPath + 'src/common/model/Node.js');
const SlaveNode = require(nodeFogPath + 'src/common/model/SlaveNode.js');

const DispatcherApi = require(nodeFogPath + 'src/dispatcher/apis/DispatcherApi.js');
const DispatcherController = require(nodeFogPath + 'src/dispatcher/controllers/DispatcherController.js');

const EngineApi = require(nodeFogPath + 'src/engine/apis/EngineApi.js');
const EngineController = require(nodeFogPath + 'src/engine/controllers/EngineController.js');

const AggregatorApi = require(nodeFogPath + 'src/aggregator/apis/AggregatorApi.js');
const AggregatorController = require(nodeFogPath + 'src/aggregator/controllers/AggregatorController.js');

const ManagerApi = require(nodeFogPath + 'src/manager/apis/ManagerApi.js');
const ManagerController = require(nodeFogPath + 'src/manager/controllers/ManagerController.js');
const SlavesWatchdogController = require(nodeFogPath + 'src/manager/watchdogs/SlavesWatchdogController.js');

const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const LogController = require(nodeFogPath + 'src/common/controllers/LogController');
const AppInitController = require(nodeFogPath + 'src/common/controllers/AppInitController.js');


module.exports = class App {

	/**
	 * Default constructor, called on initializing the app
	 * @constructor
	 */
	constructor(appArguments) {
		//Model
		this._appArguments = appArguments;
		this._expressApp = express();

		//Controllers
		this._initController = new AppInitController(this, this.appArguments);


		//APIs
		//Inicialización de controladores
		const dispatcherController =
			new DispatcherController(
				this,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.dispatcher));

		const engineController =
			new EngineController(
				this,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.engine));

		const aggregatorController =
			new AggregatorController(
				this,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.aggregator));

		const managerController =
			new ManagerController(
				this,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.manager));

		//Instanciación de APIs
		this._dispatcherApi =
			new DispatcherApi(
				this,
				dispatcherController,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.dispatcher));

		this._engineApi =
			new EngineApi(
				this,
				engineController,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.engine));

		this._aggregatorApi =
			new AggregatorApi(
				this,
				aggregatorController,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.aggregator));

		this._managerApi =
			new ManagerApi(
				this,
				managerController,
				new LogController(this, this.appArguments.getDebug(), AppConfiguration.DEBUG_MODE.manager));

		//Watchdogs
		this.slavesWatchdogController = new SlavesWatchdogController(this, 10000);

		//Atributes
		const networkInterface = this.appArguments.getHost();
		const apiPort = this.appArguments.getPort();
		const score = this.appArguments.getScore();
		const battery = this.appArguments.getBattery();
		this.node = new Node(networkInterface, apiPort, score, battery);
		this.masterNodeArray = new MasterNodeArray();
		this.slaveNodes = {}; //Mapa indexado por ip por motivos de eficiencia
		this.modules = {
			isSafeExecutionEnabled: true, //Habilitado modo seguro por defecto
			enabledModules: []
		};

		//Init stacks
		this._requestsStack = new TaskTreesQueue();
		this._resultsStack = new TaskTreesQueue();
	}

	/**
	 * Inicializa la configuración por defecto que tomará Express para las APIs
	 */
	_setExpressAppDefaultConfiguration() {
		this.expressApp.use(bodyParser.json()); // support json encoded bodies
		this.expressApp.use(bodyParser.urlencoded({
			extended: true
		})); // support encoded bodies
		this.expressApp.use(function (req, res, next) { //Disable CORS
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			res.header('Content-Type', 'text/json');
			next();
		});
	}

	/**
	 * Inicia la escucha de la API Express
	 */
	_startExpressApp() {
		this.expressApp.listen(this.node.apiPort, function () {
			console.log('nodeFog listening: network: ' + this.node.networkInterface + ' Port: ' + this.node.apiPort);
			//Register dispatcher at master
		}.bind(this));
	}


	/**
	 * Comprueba si se ha recibido como argumento que el nodo funcione como master:
	 * puede darse el caso de que un nodo sea master y no se haya recibido por argumento
	 * (por ejemplo si el master cayó): esta función únicamente gestiona la inicialización
	 * de los nodos y no debe tenerse en cuenta en procesos posteriores
	 * @return {boolean} true en caso de serlo, false si no
	 */
	isInitializedAsMasterNodeCandidate() {
		return VariableUtils.isDefined(this.appArguments) && this.appArguments.nomaster != 'true';
	}

	isMasterNode() {
		return this.masterNodeArray.isMasterNode(this.node);
	}

	setAllSlaveNodesAsChecked() {
		const slaveNodeIndexArray = Object.keys(this.slaveNodes);
		console.log(' slaveNodeIndexArray: ' + slaveNodeIndexArray)
		slaveNodeIndexArray.forEach(function (slaveNodeIndex) {
			this.slaveNodes[slaveNodeIndex].setChecked();
			console.log(slaveNodeIndex + ' lastChecked: ' + this.slaveNodes[slaveNodeIndex]._lastChecked)
		}.bind(this));

	}



	/**
	 * Inicia la aplicación
	 */
	start() {
		//Start app initialization
		this.initController.init();
		this._setExpressAppDefaultConfiguration();

		//Execution
		this._dispatcherApi.init();
		this._engineApi.init();
		this._aggregatorApi.init();
		this._managerApi.init();
		this._startExpressApp();
		this.slavesWatchdogController.start();
	}

	/****************************************************************************
						Vinculación de componentes
	****************************************************************************/

	executeTaskList(requestedTask, taskResults, executionFlow, isResetAssignedTasks) {
		this._dispatcherApi.apiController.executeTaskList(requestedTask, taskResults, executionFlow, isResetAssignedTasks);
	}

	executeTask(requestedTask, taskResults) {
		this._dispatcherApi.apiController.executeTask(requestedTask, taskResults);
	}

	syncMasterNode() {
		this._managerApi.apiController.syncMasterNode();
	}

	syncSlaveNodes() {
		this._managerApi.apiController.syncSlaveNodes();
	}

	/**
	 * Actualiza la lista de nodos existentes
	 * @param {SlaveNode[]} slaveNodesToUpdate lista de nodos esclavos a actualizar
	 */
	updateSlaveNodeList(receivedSlaveNodes) {
		const slaveNodes = this.slaveNodes;
		const slaveNodeIndexArray = Object.keys(slaveNodes);
		const receivedSlaveNodesArray = Object.values(receivedSlaveNodes);
		receivedSlaveNodesArray.filter(function (slaveNodeToUpdate) {
			const index = slaveNodeToUpdate.networkInterface + ":" + slaveNodeToUpdate.apiPort;
			return !VariableUtils.isDefined(slaveNodeIndexArray[index]);
		}.bind(this)).forEach(function (slaveNodeToUpdate) {
			//Añadimos los nodos recibidos que no se encuentren la lista de esclavos recibida
			const index = slaveNodeToUpdate.networkInterface + ":" + slaveNodeToUpdate.apiPort;
			this.slaveNodes[index] = new SlaveNode(slaveNodeToUpdate.networkInterface, slaveNodeToUpdate.apiPort, slaveNodeToUpdate.score, slaveNodeToUpdate.battery);
		}.bind(this));
		//Y eliminamos los nodos esclavos que no se encuentren en dicha lista
		slaveNodeIndexArray.filter(function (slaveNodeIndex) {
			return !VariableUtils.isDefined(receivedSlaveNodes[slaveNodeIndex]);
		}).forEach(function (orphanSlaveNodeIndex) {
			delete this.slaveNodes[orphanSlaveNodeIndex];
		}.bind(this));
	}

	/****************************************************************************
								Getters
	****************************************************************************/

	get appArguments() {
		return this._appArguments;
	}

	get expressApp() {
		return this._expressApp;
	}

	get requestsStack() {
		return this._requestsStack;
	}

	set requestsStack(requestsStack) {
		this._requestsStack = requestsStack;
	}

	get resultsStack() {
		return this._resultsStack;
	}

	set resultsStack(resultsStack) {
		this._resultsStack = resultsStack;
	}

	get dispatcherApi() {
		return this._dispatcherApi;
	}

	get engineApi() {
		return this._engineApi;
	}

	get aggregatorApi() {
		return this._aggregatorApi;
	}

	get managerApi() {
		return this._managerApi;
	}

	get initController() {
		return this._initController;
	}
}