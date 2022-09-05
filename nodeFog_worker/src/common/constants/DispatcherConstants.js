'use strict';

/**
 * Dispatcher constants
 * @description Dispatcher configuration file
 * @author José Luis Urbano Orgaz
 */

/**
 * Función para la selección del nodo que se encargará de realizar la tarea
 * @param {SlaveNode[]} availableNodes nodos activos 
 * @returns {SlaveNode} nodo seleccionado
 */
 exports.DISPATCH_FUNCTION = function (availableNodes = new Array()) {
    return availableNodes.reduce(function(acc, node) {
        const accPendingTasks = acc.pendingTasks.filter(pendingTask => !pendingTask.result);
        const nodePendingTasks = node.pendingTasks.filter(pendingTask => !pendingTask.result);
        return accPendingTasks.length > nodePendingTasks.length? node:acc;
    });
 }