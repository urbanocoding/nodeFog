/**
 * Modelo genérico de API
 * @author José Luis Urbano Orgaz
 */
'use strict';

const nodeFogPath = '../../../';

const LogController = require(nodeFogPath + 'src/common/controllers/LogController');

//Initialization
module.exports = class DeamApi {

  /**
   * Constructor parametrizado
   * @param {App} app instancia nodeFogWorkerApp
   * @param {LogController} logController controlador de logs
   * @constructor
   */
  constructor(app, apiController, logController = new LogController(app)) {
    this._app = app;
    this._apiController = apiController;
    this._logController = logController;
  }

  /****************************************************************************
								Getters
	****************************************************************************/

  get app() {
    return this._app;
  }

  get apiController() {
    return this._apiController;
  }

  get logController() {
    return this._logController;
  }

}