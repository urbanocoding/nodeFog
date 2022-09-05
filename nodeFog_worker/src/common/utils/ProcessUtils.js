//Imports
const nodeFogPath = '../../../';
const variableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');

module.exports = class ProcessUtils {

  /**
   * Returns process input arguments
   * @return {String[]} process arguments
   */
  static loadArguments() {
    return process.argv.slice(2);
  }

  /**
  * Convierte un array de argumentos en string separados por el caracter = en
  * un objeto fácilmente accesible
  * @param {String[]} argumentsToMap Array de argumentos recibidos
  * @return {} Modelo para la gestión de la configuración
  */
  static parseMappedArguments(argumentsToMap) {
    if (variableUtils.isDefined(argumentsToMap)) {
      const mappedArguments = {};
      const decomposedArgs = argumentsToMap.filter(function(argumentToMap) {
        return argumentToMap.includes('=');
      }).map(function(argumentToMap) {
        return argumentToMap.split('=');
      })
      decomposedArgs.forEach(function(decomposedArg) {
        mappedArguments[decomposedArg[0]] = decomposedArg[1];
      })
      return mappedArguments;
    }
    return {};
  }
}
