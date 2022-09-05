'use strict';

const vm = require('vm');
const VariableUtils = require('../../common/utils/VariableUtils.js');

const nodeFogPath = '../../../';

const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const RequestController = require(nodeFogPath + 'src/common/controllers/RequestController.js');
const RemoteConnection = require(nodeFogPath + 'src/common/model/RemoteConnection.js');
const ExecutionRequest = require(nodeFogPath + 'src/common/model/ExecutionRequest.js');
const DeamController = require(nodeFogPath + 'src/common/controllers/DeamController.js');

/**
 * EngineController
 * @description Componente para la ejecución en sí del código recibido
 * @author José Luis Urbano Orgaz
 */
module.exports = class EngineController extends DeamController {

	/**
	 * Constructor parametrizado
	 * @param {App} app Instancia de la aplicación
	 * @param {LogController} logController Instancia del controlador de logs
	 */
	constructor(app, logController) {
		super(app, logController);
	}

	/**
	 * Gestión de la petición de ejecución
	 * @param {Task} task Tarea a procesar
	 */
	manageProcessTaskRequest(task) {
		const taskId = task.id;
		const taskFlowId = task.taskFlowId;
		this.processTask(task);
		const result = task.result;
		this.logController.log('Tarea ' + taskId + ' ejecutada con resultado ' + result);
		this.requestResultAggregation(task, function (aggregationResponse) {
			this.app.node.removePendingTaskById(taskId, taskFlowId);
		}.bind(this));
	}

	/**
	 * Realiza un require en el código ejecutado al vuelo solo si la configuración del
	 * sistema lo permite
	 * @param {String} moduleToRequire Módulo a importar
	 * @returns {Object} Módulo importado
	 */
	safeRequire(moduleToRequire) {
		if (!this.app.modules.isSafeExecutionEnabled ||
			this.app.modules.enabledModules.includes(moduleToRequire)) {
			return require(moduleToRequire);
		}
		return undefined;
	}

	/**
	 * Realiza la ejecución de la tarea
	 * @param {Task} task Tarea a ejecutar
	 */
	processTask(task) {
		if (VariableUtils.isDefined(task) &&
			VariableUtils.isDefined(task.getAction())) {
			const anonymAction =
				VariableUtils.anonymizeStringifiedFunction(
					task.getAction().toString());
			vm.runInNewContext(anonymAction)(task, this.safeRequire.bind(this));
		}
	}

	/**
	 * Realiz auna solicitud de aggregación
	 * @param {Task} task Task a agregar
	 */
	requestResultAggregation(task, resultAggregationCallbackFunction) {
		const masterNode = this.app.masterNodeArray.getCurrentMasterNode();
		if (VariableUtils.isDefined(masterNode)) {
			const remoteConnection =
				new RemoteConnection(
					masterNode.networkInterface,
					masterNode.apiPort,
					ApiConstants.AGGREGATOR_API_PATH,
					ApiConstants.POST_METHOD,
					ApiConstants.JSON_HEADER_CONTENT_TYPE
				);

			const executionRequest =
				new ExecutionRequest(
					remoteConnection,
					task,
					resultAggregationCallbackFunction
				);

			RequestController.executeRequest(executionRequest);
		} else {
			console.error('masterNodeList[0] no definido');
		}
	}
}