'use strict';

const MappedQueue = require('./MappedQueue.js');
const VariableUtils = require('../utils/VariableUtils.js');

/**
 * TaskTreesQueue
 * @description Cola de árboles de tareas
 * @author José Luis Urbano Orgaz
 */
module.exports = class TaskTreesQueue extends MappedQueue {

	/**
	 * Constructor por defecto
	 * @constructor
	 */
	constructor() {
		super();
	}

	/**
	 * Añade un árbol de tareas a la cola
	 * @param {Object} taskTree Árbol de tareas a añadir
	 */
	addTaskTree(taskTree) {
		this.add(taskTree.id, taskTree);
	}


	/**
	 * Concatena una serie de árboles de tareas en la cola
	 * @param {Object} taskTreeQueueToAppend Conjunto de árboles de tareas a concatenar
	 */
	appendTaskTreeQueue(taskTreeQueueToAppend) {
		taskTreeQueueToAppend.queueIndexes.forEach(function (queueIndex) {
			this.addTaskTree(queueIndex, taskTreeQueueToAppend.queueMap);
		}.bind(this));
	}

};