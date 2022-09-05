/**
 * Controlador genérico inmutable para los controladores de las APIs con arquitectura DEAM
 * @author José Luis Urbano Orgaz
 */
'use strict';

const nodeFogPath = '../../../';
const Controller = require(nodeFogPath + 'src/common/controllers/Controller.js');
const LogController = require(nodeFogPath + "src/common/controllers/LogController");

module.exports = class DeamController extends Controller {

    constructor(app, logController = new LogController(app)) {
        super(app);
        this._logController = logController;
    }

    get logController() {
        return this._logController;
    }
}