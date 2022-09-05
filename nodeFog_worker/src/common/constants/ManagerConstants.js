'use strict';

/**
 * Manager constants
 * @description Manager module configuration file
 * @author José Luis Urbano Orgaz
 */

/**
 * Función para la asignación de una puntuación a un nodo, de cara a seleccionar el
 * que será el nodo maestro
 * @param {Node} node Referencia de la instancia del nodo a evaluar
 */
 exports.MASTER_NODE_SCORING_FUNCTION = function (node) {
    const cpuSpeed = node.systemInformation.cpu && node.systemInformation.cpu.speed?
      node.systemInformation.cpu.speed:
      1;
   const memFree = node.systemInformation.memory && node.systemInformation.memory.free?
      node.systemInformation.memory.free/2000000000:
      1;
    node.score = node.systemInformation.defaultBattery == 'true'? 
                    -1: 
                    node.defaultScore+cpuSpeed+memFree;
 };