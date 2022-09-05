/**
 * App Configuration model
 * @description Modelo utilizado para la gestión de los datos de configuración
 *              recibidos como argumento o por lectura de fichero
 * @author José Luis Urbano Orgaz
 */
'use strict';

//Imports
const nodeFogPath = '../../../';
const variableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');

class AppConfiguration {

  constructor() {
    this._wrappedConfig = AppConfiguration.DEFAULT_VALUES;
  }

  _getParsedDebugArguments(argumentValue) {
    return AppConfiguration.DEBUG_MODE[argumentValue];
  }


  /**
  * Convierte un array de argumentos en string separados por el caracter = en
  * un objeto fácilmente accesible
  * @param {String[]} argumentsToMap Array de argumentos recibidos
  * @return {} Modelo para la gestión de la configuración
  */
  initFromArguments(argumentsToMap) {
    if (variableUtils.isDefined(argumentsToMap)) {
      const decomposedArgs = argumentsToMap.filter(function(argumentToMap) {
        return argumentToMap.includes('=');
      }).map(function(argumentToMap) {
        return argumentToMap.split('=');
      });
      const actions = {
        debug: this._getParsedDebugArguments
      }
      decomposedArgs.forEach(function(decomposedArg) {
        const argumentKey = decomposedArg[0];
        const argumentValue = decomposedArg[1];
        if(variableUtils.isDefined(actions[argumentKey])) {
          //En caso de encontrarse una acción específica establecida sobre el argumento
          this._wrappedConfig[argumentKey] = actions[argumentKey](argumentValue);
        } else {
          //Si el argumento no se encuentra definido
          this._wrappedConfig[argumentKey] = argumentValue;
        }
      }.bind(this));
    }
  }

  getHost() {
    return this._wrappedConfig.host;
  }

  getPort() {
    return this._wrappedConfig.port;
  }

  getLink() {
    return this._wrappedConfig.link;
  }

  getDebug() {
    return this._wrappedConfig.debug;
  }

  getScore() {
    return this._wrappedConfig.score;
  }

  getBattery() {
    return this._wrappedConfig.battery;
  }
}

//Constantes para la inicialización de valores por defecto: de este modo evitamos
//discrepancias, ya que utilizaremos su referencia en el resto de inicializadores y
//constructores
AppConfiguration.DEFAULT_VALUES = {
  host: '127.0.0.1',
  port: 3000,
  score: 0,
  link: undefined,
  battery: false,
  debug: undefined
};

//Constantes para la gestión del nivel de depuración: de este modo evitamos
//errores de codificación, ya que utilizaremos su referencia tanto en la evaluación
//como en la asignación
AppConfiguration.DEBUG_MODE = {
  dispatcher: 'DISPATCHER_DEBUG_MODE',
  engine: 'ENGINE_DEBUG_MODE',
  aggregator: 'AGGREGATOR_DEBUG_MODE',
  manager: 'MANAGER_DEBUG_MODE',
  all:'ALL_DEBUG_MODE'
};


module.exports = AppConfiguration;
