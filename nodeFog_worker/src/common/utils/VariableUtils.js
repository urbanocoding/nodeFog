/**
 * VariableUtils
 * @description collection of functions to facilitate the management of variables
 * @author José Luis Urbano Orgaz
 */
'use strict';

/**
 * Checks if an incoming variable is defined
 * @param {Object} variable Variable to check
 * @return true if the variable is defined, false otherwise
 */
exports.isDefined = function(variable) {
	return variable !== null && variable !== undefined;
};

/**
 * Comprueba si una variable está definida, es una cadena, y no está vacía
 * @param {Object} variable Variable a comprobar
 * @return true en caso de de ser una cadena rellena, false si no
 */
exports.isDefinedNotEmptyString = function(variable) {
	return variable !== null 
		&& variable !== undefined 
		&& typeof variable === 'string'
		&& variable !== '';
};

/**
 * Obtiene el atributo de un objeto dado su valor
 * @param {Object} element elemento a analizar
 * @param {String} value valor del atributo
 * @returns {String} Nombre del atributo
 */
exports.getKeyByValue = function(element, value) {
	return Object.keys(element).find(key => element[key] === value);
}

/**
 * Anonimiza una función recibida en formato String
 * @param {string} stringifiedFunction función a anonimizar
 * @return {string} anonymized stringified function, undefined en caso de no recibirse un string
 */
exports.anonymizeStringifiedFunction = function(stringifiedFunction) {
	if (typeof stringifiedFunction === 'string') {
		if (!(stringifiedFunction.startsWith('(') && (stringifiedFunction.endsWith(')'))))
			return '(' + stringifiedFunction + ')';
		return stringifiedFunction;
	}
	return undefined;
}

/**
 * Compara dos arrays para ver si son iguales independientemente del orden
 * @param {Object[]} array1 Array 1 a comparar
 * @param {Object[]} array2 Array 2 a comparar
 * @returns {Boolean} true en caso afirmativo, false si no
 */
exports.isArrayEqualIgnoreOrderTo = function(array1, array2) {
	if (array1.length !== array2.length) return false;
	const uniqueValues = new Set([...array1, ...array2]);
	for (const value of uniqueValues) {
	  const array1Count = array1.filter(arrayEntry => arrayEntry === value).length;
	  const array2Count = array1.filter(arrayEntry => arrayEntry === value).length;
	  if (array1Count !== array2Count) return false;
	}
	return true;
}