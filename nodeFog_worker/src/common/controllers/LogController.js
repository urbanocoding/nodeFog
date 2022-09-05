
'use strict';

const nodeFogPath = '../../../';
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const AppConfiguration = require(nodeFogPath + 'src/common/model/AppConfiguration.js');
const Controller = require(nodeFogPath + 'src/common/controllers/Controller.js');

/**
 * LogController
 * @description Controlador de mensajes de registro
 * @author José Luis Urbano Orgaz
 */
module.exports = class LogController extends Controller {

    /**
     * Constructor parametrizado
     * @param {App} app instancia de la aplicación
     * @param {String} receivedLogValue Valor de log recibido
     * @param {String} componentDebugModeValue Valor de depuración asociado al componente (AppConfiguration.DEBUG_MODE)
     */
    constructor(app, receivedLogValue = 'none', componentDebugModeValue = '') {
        super(app);
        this._componentName = VariableUtils.getKeyByValue(
            AppConfiguration.DEBUG_MODE,
            componentDebugModeValue);
        this._isDebugEnabled =
            receivedLogValue == componentDebugModeValue ||
            receivedLogValue == AppConfiguration.DEBUG_MODE.all;
    }


    /**
     * Registro de mensajes por consola
     * @param {String} message Mensaje a mostrar (en caso de encontrarse activado el log)
     */
    log(message) {
        if (this._isDebugEnabled) {
            console.log(this._componentName + ' - ' + message);
        }
    }

    get isDebugEnabled() {
        return this._isDebugEnabled;

    }
}