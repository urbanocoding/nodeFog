/**
 * Constrolador del módulo Dispatcher 
 * @author José Luis Urbano Orgaz
 */
'use strict';

const nodeFogPath = '../../../';
const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const DispatcherConstants = require(nodeFogPath + 'src/common/constants/DispatcherConstants.js');
const RequestController = require(nodeFogPath + 'src/common/controllers/RequestController.js');
const RemoteConnection = require(nodeFogPath + 'src/common/model/RemoteConnection.js');
const ExecutionRequest = require(nodeFogPath + 'src/common/model/ExecutionRequest.js');
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const DeamController = require(nodeFogPath + 'src/common/controllers/DeamController.js');

module.exports = class DispatcherController extends DeamController {

	/**
	 * Constructor parametrizado
	 * @param {App} app Instancia de la aplicación
	 * @param {LogController} logController Instancia del controlador de logs
	 */
	constructor(app, logController) {
		super(app, logController);
	}


	/**
	 * Devuele el array de nodos disponibles
	 * @returns {SlaveNode[]} Array de nodos que se considera se encuentran disponibles
	 */
	_getAvailableNodes() {
		const slaveNodes = Object.values(this.app.slaveNodes);
		return slaveNodes.filter(function (slaveNode) {
			return VariableUtils.isDefined(slaveNode) &&
				VariableUtils.isDefined(slaveNode.lastChecked);
		}.bind(this));
	}

	/**
	 * Realiza la llamada a la función de dispatching para conocer a qué nodo se solicitará
	 * la ejecución de la tarea
	 * @param {SlaveNode[]} availableNodes Nodos disponibles para ejecución
	 * @returns {SlaveNode} nodo seleccionado
	 */
	_getSelectedWorkerNode(availableNodes = new Array()) {
		return DispatcherConstants.DISPATCH_FUNCTION(availableNodes);
	}
	

	/**
	 * Realiza la solicitud de ejecución de la tarea a un worker determinado
	 * @param {Task} task Tarea a ejecutar
	 * @param {SlaveNode} selectedNode worker nodo que ejecutará la tarea
	 * @param {function} callbackFunction Función a ejecutar una vez se haya enviado la solicitud
	 */
	_requestExecution(task, selectedNode, taskResults) {
		const nodeKey = selectedNode.networkInterface + ':' + selectedNode.apiPort;
		const remoteConnection =
			new RemoteConnection(
				selectedNode.networkInterface,
				selectedNode.apiPort,
				ApiConstants.ENGINE_API_PATH,
				ApiConstants.POST_METHOD, 
				ApiConstants.JSON_HEADER_CONTENT_TYPE
			);
			
		const executionRequest =
			new ExecutionRequest(
				remoteConnection, {
					task: task,
					results: taskResults
				},
				function (response) {
					this._logController.log('Petición de ejecución de ' + task.id + ' delegada en ' + nodeKey);
					const receivedResponseObject = JSON.parse(response);
					const receivedNodeObject = receivedResponseObject.node;
					this.app.slaveNodes[nodeKey].updateRemoteSystemInformationStatus(receivedNodeObject);
					selectedNode.syncPendingTasks(receivedNodeObject);
					
				}.bind(this),
				function (error) {
					this._logController.log('Nodo ' + nodeKey + ' no conectado');
					this.app.slaveNodes[nodeKey].resetLastChecked();
					//No reasignamos el resto de tareas del nodo por si se ha tratado de un
					//problema puntual de comunicación: el monitor se encargará de realizar
					//la tarea en caso de que persista el problema
					this.executeTask(task, taskResults);
				}.bind(this)
			);

		RequestController.executeRequest(executionRequest);
	}

	/**
	 * Función recursiva para obtener la instancia de una tarea perteneciente a un flujo de
	 * tareas dado su identificador
	 * @param {Task} requestedTask Flujo de tareas
	 * @param {String} nodeIdToSearch Identificador del nodo a obtener
	 * @returns {Task} Instancia de la tarea
	 */
	_getTreeNodeById(requestedTask, nodeIdToSearch) {
		let taskToReturn = (requestedTask.id == nodeIdToSearch) ? requestedTask : undefined;
		if (!taskToReturn) {
			const element = requestedTask.element;
			if (element == 'list') {
				const resultingTasksArray = requestedTask.tasks.map(function (childTask) {
					return this._getTreeNodeById(childTask, nodeIdToSearch);
				}.bind(this)).filter(function (childTask) {
					return childTask != undefined;
				});
				return resultingTasksArray.length > 0 ? resultingTasksArray[0] : undefined;
			}
		}
		return taskToReturn;
	}

	/**
	 * Función recursiva para establecer las referencias internas para el flujo, de modo que
	 * cada tarea pueda conocer quién es su padre, y a qué flujo de tareas pertenece
	 * @param {Task} requestedTask Instancia de tarea
	 * @param {String} taskFlowId Identificador del flujo de tareas
	 * @param {String} parentNodeId Identificador de la tarea padre
	 */
	setTaskTreeLeafIds(requestedTask, taskFlowId, parentNodeId) {
		const element = requestedTask.element
		if (element == 'list') {
			requestedTask.parentNodeId = parentNodeId;
			requestedTask.tasks.forEach(function (childTask) {
				this.setTaskTreeLeafIds(childTask, taskFlowId, requestedTask.id);
			}.bind(this));

		} else {
			requestedTask.parentNodeId = parentNodeId;
		}
		requestedTask.taskFlowId = taskFlowId;
	}

	/**
	 * Función recursiva de recorrido del flujo de tareas para analizar qué tareas es posible 
	 * realizar y solicitar su ejecución
	 * @param {Task} requestedTask Instancia de tarea
	 * @param {Object} taskResults Mapa <idtarea,resultado> con los resultados de las tareas
	 * @param {Task} executionFlow Flujo de ejecución completo
	 * @param {Boolean} isResetAssignedTasks true para volver a solicitar las tareas en estado assigned, false si no
	 * @returns {Task[]} Array de tareas a ejecutar
	 */
	executeTaskList(requestedTask, taskResults, executionFlow, isResetAssignedTasks = false) {
		if (requestedTask) {
			const element = requestedTask.element
			const id = requestedTask.id
			if (element == 'list') {
				//Si se trata de una lista, comprobamos si quedan tareas pendientes de resultados
				if (!requestedTask.isListCompleted) {
					//analizamos si debemos recorrerla secuencial o concurrentemente
					const type = requestedTask.type
					const childTasks = requestedTask.tasks
					const pendingTasks = childTasks.filter(function (childTask) {
						return !childTask.isListCompleted && (!taskResults[childTask.id] || taskResults[childTask.id] == 'assigned');
					});
					if (pendingTasks.length == 0) {
						const parentNode = this._getTreeNodeById(executionFlow, requestedTask.parentNodeId);
						requestedTask.isListCompleted = true;
						return this.executeTaskList(parentNode, taskResults, executionFlow, isResetAssignedTasks);
					} else {
						//Quedan tareas por realizar, que estarán o asignadas o sin realizar: descartaremos
						//las asignadas y continuaremos con la ejecución del resto
						const unAssignedTasks = pendingTasks.filter(function (childTask) {
							return isResetAssignedTasks || taskResults[childTask.id] != 'assigned';
						});
						if (type == 'sequential') {
							//Dado que se trata de tareas secuenciales, debemos obtener el resultado de
							//cada una iterativamente: obtenemos la primera tarea pendiente de resultado,
							//es decir, que no sea una Get lista completa ni contenga resultado, y entramos
							//en la recursividad para hacer la petición de ejecución
							if (unAssignedTasks.includes(pendingTasks[0])) {
								//Comprobaremos que la tarea pendiente a realizar no se encuentre
								//ya asignada
								return this.executeTaskList(pendingTasks[0], taskResults, executionFlow, isResetAssignedTasks);
							} else {
								//En caso de tratarse de una tarea asignada, descartamos la ejecución
								//puesto que nos encontraremos en espera de obtener el resultado.
								return;
							}
						} else {
							//En caso de poder realizarse concurrentemente, lanzamos las tareas sin esperar a
							//sus resultados
							return unAssignedTasks.map(function (unAssignedTask) {
								this.executeTaskList(unAssignedTask, taskResults, executionFlow, isResetAssignedTasks);
							}.bind(this))
						}
					}

				} else {
					//Si todos los trabajos de la lista han sido hechos
					return;
				}
			} else {		
				if (!taskResults[id] || (isResetAssignedTasks || taskResults[id] == 'assigned')) {
					taskResults[id] = 'assigned';
					//Si no es una lista, es un trabajo que habrá que ejecutar
					this.executeTask(requestedTask, taskResults);
				}
			}
		}
		return;
	}

	/**
	 * Proceso de ejecución de la tarea: selección de nodo y solicitud de ejecución
	 * @param {Task} requestedTask Tarea realizable
	 * @param {Object} taskResults Conjunto de resultados de las tareas
	 */
	executeTask(requestedTask, taskResults) {
		if(this.app.isMasterNode()) {
			//Puede ocurrir que tareas en búsqueda de nodo cuando se produce el reemplazo
			//de maestro, por lo que, una vez más, tenemos que comprobar que se trata de él
			const availableNodes = this._getAvailableNodes();
			this._logController.log('Dispatcher solicita ejecución de ' + requestedTask.id)
			if (availableNodes.length > 0) {
				//Si hay algún nodo disponible para la ejecución, se selecciona el nodo y se realiza 
				//la petición 
				const selectedWorkerNode = this._getSelectedWorkerNode(availableNodes);
				this._logController.log('Nodo de ejecución escogido: ' + selectedWorkerNode.networkInterface + ':' + selectedWorkerNode.apiPort);
				selectedWorkerNode.addPendingTask(requestedTask);
				this._requestExecution(requestedTask, selectedWorkerNode, taskResults);
			} else {
				//En caso de no haber nodos disponibles para la ejecución de la tarea, se entra en bucle
				//hasta que haya alguno
				this._logController.log('No hay nodos de ejecución disponibles para ' + requestedTask.id);
				setTimeout(function () {
					this.executeTask(requestedTask, taskResults);
				}.bind(this), 10000);

			}
		}
	}

	/**
	 * Redirige un flujo recursivo de tareas a un nodo determinado (habitualmente,
	 * aunque no necesariamente, el maestro)
	 * @param {Object} requestedTask  Flujo recursivo de tareas
	 * @param {Node} targetNode Nodo referencia al que redirigir la lista de tareas
	 */
	_redirectTaskList(requestedTask, targetNode) {
		const apiEndopoint = ApiConstants.DISPATCHER_API_PATH;
		const remoteConnection =
			new RemoteConnection(
				targetNode.networkInterface,
				targetNode.apiPort,
				apiEndopoint,
				ApiConstants.POST_METHOD, {
					'Content-Type': 'application/json',
					'referer': this.app.node.networkInterface + ':' + this.app.node.apiPort
				}
			);
		const executionRequest =
			new ExecutionRequest(
				remoteConnection,
				requestedTask,
				function () {}.bind(this)
			);
		RequestController.executeRequest(executionRequest);
	}

	/**
	 * Reenvía el flujo de tareas al nodo máster en caso de que dicho flujo lo haya
	 * recibido un nodo esclavo
	 * @param {Task} requestedTask Flujo recursivo de tareas
	 */
	redirectTaskListToMaster(requestedTask) {
		const masterNode = this.app.masterNodeArray.getCurrentMasterNode();
		this._redirectTaskList(requestedTask, masterNode);
	}

	/**
	 * Reenvía el flujo de tareas a los nodos esclavos
	 * @param {Task} requestedTask Flujo recursivo de tareas
	 */
	redirectTaskListToSlaveNodes(requestedTask) {
		const slaveNodes = Object.values(this.app.slaveNodes);
		slaveNodes.forEach(function (slaveNode) {
			this._redirectTaskList(requestedTask, slaveNode);
		}.bind(this));
	}
}