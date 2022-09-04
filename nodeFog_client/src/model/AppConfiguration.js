
'use strict';

const nodeFogPath = '../../';
const variableUtils = require(nodeFogPath + 'src/utils/VariableUtils.js');

/**
 * App Configuration model
 * @description Modelo utilizado para la gestión de los datos de configuración
 *              recibidos como argumento o por lectura de fichero
 * @author José Luis Urbano Orgaz
 */
class AppConfiguration {

  /**
   * Constructor por defecto
   * @constructor
   */
  constructor() {
    this._wrappedConfig = AppConfiguration.DEFAULT_VALUES;
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
      decomposedArgs.forEach(function(decomposedArg) {
        const [argumentKey,argumentValue] = decomposedArg;
        this._wrappedConfig[argumentKey] = argumentValue;
      }.bind(this));
    }
  }

  /**
   * Devuelve el valor de una propiedad dado su nombre
   * @param {String} configKey Nombre de la propiedad
   * @returns {Object} Valor de la propiedad
   */
  getConfigValue(configKey) {
    return this._wrappedConfig[configKey];
  }
}

//Constantes para la inicialización de valores por defecto: de este modo evitamos
//discrepancias, ya que utilizaremos su referencia en el resto de inicializadores y
//constructores
AppConfiguration.DEFAULT_VALUES = {
  host: '127.0.0.1',
  port: 3000,
  file: './files/examples/taskflow-example.json',
};

module.exports = AppConfiguration;
