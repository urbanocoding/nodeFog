'use strict';

const variableUtils = require('../utils/VariableUtils.js')

/**
 * MappedQueue
 * @description Implementación de cola inmutable basada en mapa
 * @author José Luis Urbano Orgaz
 */
module.exports = class MappedQueue {

	/**
	 * Constructor por defecto
	 * @constructor
	 */
	constructor() {
		this.queueMap = new Map();
		this.queueIndexes = new Array();
	}

	/**
	 * Añade un elemento a la cola
	 * @param {String} id Identificador único del elemento
	 * @param {Object} element Elemento a añadir
	 */
	add(id, element) {
		if (variableUtils.isDefined(id) &&
			variableUtils.isDefined(element)) {
			this.queueMap.set(id, element);
			this.queueIndexes.push(id);
		}
	}

	/**
	 * Devuelve la instancia de un elemento dado su identificador
	 * @param {String} id  Identificador del elemento
	 * @return {Object} Elemento
	 */
	get(id) {
		if (variableUtils.isDefined(id) &&
			this.queueMap.has(id)) {
			/*this.queueIndexes = this.queueIndexes.filter(
				function (queueIndex) {
					return queueIndex != id;
				}); */
			return this.queueMap.get(id);
		}
		return null;
	}

	/**
	 * Desplaza una posición la cola, eliminando el último elemento
	 * @returns {Object} Elemento eliminado
	 */
	shift() {
		const firstId = this.queueIndexes.shift();
		const shiftedElement = this.queueMap.get(firstId);
		this.queueMap.delete(firstId);
		return shiftedElement;
	}

	/**
	 * Obtiene una instancia del último elemento de la cola
	 * @returns {Object} Elemento
	 */
	getFirst() {
		const firstId = this.queueIndexes[this.queueIndexes.length - 1];
		return this.queueMap.get(firstId);
	}

	/**
	 * Elimina un elemento dado su identificador
	 * @param {String} id Identificador del elemento a eliminar
	 */
	delete(id) {
		const elementToRemove = this.get(id);
		if (variableUtils.isDefined(elementToRemove)) {
			this.queueIndexes.splice(this.queueIndexes.indexOf(id), 1);
			this.queueMap.delete(id);
		}
	}

	/**
	 * Devuelve la cola como objeto JSON
	 * @returns {JSONObject} cola indexada en formato JSON
	 */
	toJsonString() {
		return JSON.stringify({
			queueMap: Object.fromEntries(this.queueMap),
			queueIndexes: this.queueIndexes
		})
	}

	/**
	 * Devuelve la cola como un objeto serializable
	 * @returns {JSONObject} cola indexada en formato objeto serializable
	 */
	toParseableObject() {
		return {
			queueMap: Object.fromEntries(this.queueMap),
			queueIndexes: this.queueIndexes
		}
	}

	/**
	 * Construye la cola desde un elemento JSON
	 * @param {JSONObject} mappedQueue Cola indexada en formato JSON
	 */
	fromJson(mappedQueue) {
		this.queueMap = new Map(Object.entries(mappedQueue.queueMap));
		this.queueIndexes = mappedQueue.queueIndexes;
	}
};