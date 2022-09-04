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
