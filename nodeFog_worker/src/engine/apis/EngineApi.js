'use strict';

const nodeFogPath = '../../../';

const ApiConstants = require(nodeFogPath + "src/common/constants/ApiConstants");
const DeamApi = require(nodeFogPath + "src/common/apis/DeamApi");
const Task = require(nodeFogPath + 'src/common/model/Task.js');

/**
 * Engine API
 * @description Inicialización de los puntos de entrada al componente Engine del servidor
 * @author José Luis Urbano Orgaz
 */
module.exports = class EngineApi extends DeamApi {

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
        //POST Engine
        this._app.expressApp.post(ApiConstants.ENGINE_API_PATH, function (req, res) {
            const taskToExecute = new Task();
            taskToExecute.parseJson(req.body.requestedTask.task);
            this._logController.log('Solicitud de ejecución de ' + taskToExecute.id);
            this.app.node.addPendingTask(taskToExecute);
            const taskResults = req.body.requestedTask.results;
            const responseObject = {
                node: this._app.node.getSimplifiedClone()
            };
            res.end(JSON.stringify(responseObject));

            let actionVars = taskToExecute.action.match(/#[0-9]+#/g);
            if (Array.isArray(actionVars)) {
                actionVars = actionVars.filter(function (actionVar) {
                    return typeof actionVar != false && actionVar != null;
                }).forEach(function (actionVar) {
                    const simplifiedActionVar = actionVar.replace(/#/g, '');
                    taskToExecute.action = taskToExecute.action.replace(actionVar, taskResults[simplifiedActionVar]);
                }.bind(this))
            }

            this._apiController.manageProcessTaskRequest(taskToExecute);
        }.bind(this));
    }

    get app() {
        return this._app;
    }
}