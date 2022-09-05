'use strict';

const VariableUtils = require('../utils/VariableUtils.js');
const SlaveNode = require('./SlaveNode.js');

/**
 * Master Node Array
 * @description Cola para gestionar el orden en que los nodos ejercerán como máster
 * @author José Luis Urbano Orgaz
 */
module.exports = class MasterNodeArray {

	/**
	 * Constructor por defecto
   * @param {Node[]} wrappedArray Array envuelto
	 * @constructor
	 */
	 constructor(wrappedArray = new Array()){
		 if(Array.isArray(wrappedArray)) {
			 this.wrappedArray = wrappedArray;
		 }
	 }

   /**
    * Función estática para clonar el objeto
    * @param {MasterNodeArray} masterNodeArray Elemento a clonar
    * @returns {MasterNodeArray} instancia clon
    */
	 static clone(masterNodeArray) {
		 if (VariableUtils.isDefined(masterNodeArray)) {
			 return new MasterNodeArray(masterNodeArray.wrappedArray);
		 }
		 return new MasterNodeArray();
	 }

   /**
    * Ordenación del array envuelto
    */
   sortArray() {
     //Se realiza el ordenamiento del array de modo inverso, es decir, a
     //mayor score, antes se listará en el array
     this.wrappedArray.sort(function(node1, node2) {
       return node2.score - node1.score
     });
   }

   /**
    * Obtiene un nodo insertado en base a su identificador (networkInterface:apiPort)
    * @param {Node} nodeToCompare Nodo a comparar
    * @returns {node} Instancia del nodo en el array
    */
   _getInsertedNode(nodeToCompare) {
     return this.wrappedArray.filter(function(arrayEntry) {
       return arrayEntry.networkInterface == nodeToCompare.networkInterface
        && arrayEntry.apiPort == nodeToCompare.apiPort;
     })[0];
   }

   /**
    * Actualiza la valoración de un nodo
    * @param {Node} nodeToSync Nodo a sincronizar
    */
   syncNode(nodeToSync) {
     const insertedNode = this._getInsertedNode(nodeToSync);
     if(!VariableUtils.isDefined(insertedNode)) {
       this.addNode(nodeToSync);
     } else {
       insertedNode.score = nodeToSync.score;
     }
   }

	 /**
	 * Añade un nodo al array (si todavía no existe)
	 * @param {MasterNodeCandidate} nodeToAdd Candidato a nodo máster a añadir
	 */
   addNode(nodeToAdd) {
		 if(this.getNodeIndex(nodeToAdd) < 0) {
			 this.wrappedArray.push(nodeToAdd);
		 }
   }

   /**
    * Elimina un nodo del array
    * @param {Node} nodeToRemove Nodo a eliminar
    */
   removeNode(nodeToRemove) {
     this.wrappedArray = this.getNodesDistinctThan(nodeToRemove);
   }

   /**
   * Actualización del array embebido de posibles másters
   * @description Se realiza una actualización evitando el reemplazo de instancias
   * @param {Node[]} sourceWrappingArray Nodos actuales
   */
   updateArray(sourceWrappingArray) {
     //Eliminamos los nodos que no se encuentren en la lista de nodos actualmente
     //existentes
     const receivedWrappingArray = sourceWrappingArray.wrappedArray;
     //Eliminamos los nodos del array embebido que no se encuentren en el array recibido
     this.wrappedArray.filter(function(wrappedNode) {
       return receivedWrappingArray.findIndex(function(receivedWrappedNode) {
         return wrappedNode.networkInterface == receivedWrappedNode.networkInterface
           && wrappedNode.apiPort == receivedWrappedNode.apiPort;
      }) < 0;
     }.bind(this)).forEach(function(receivedWrappedNode) {
       this.removeNode(receivedWrappedNode);
     }.bind(this));
     //Y sincronizamos los nodos existentes
		 this.merge(sourceWrappingArray);
		 this.sortArray();
   }

   /**
    * Mezcla los valores del array con otros recibidos
    * @param {MasterNodeArray} masterNodeArray Elemento con el que comparar para realizar la mezcla
    */
	 merge(masterNodeArray) {
		 const receivedWrappingArray = masterNodeArray.wrappedArray;
		 receivedWrappingArray.forEach(function(wrappedNode) {
       this.syncNode(wrappedNode);
     }.bind(this));
		 this.sortArray();
	 }

	 /**
	 * Sustituye el array de nodos con capacidad de ser máster
	 * @param {MasterNodeArray} newMasterNodeArray Modelo de esta misma clase pero funciones
	 */
	 replaceMasterNodeArray(newMasterNodeArray) {
		 this.wrappedArray = newMasterNodeArray.wrappedArray.map(
			 function(unparsedMasterNode) {
				 return new SlaveNode(
					 unparsedMasterNode.networkInterface,
					 unparsedMasterNode.apiPort,
					 unparsedMasterNode.score,
           unparsedMasterNode.systemInformation.defaultBattery);
			 });;
	 }

   /**
    * Obtiene el nodo maestro actual (en primera posición)
    * @returns {Node} nodo maestro
    */
	 getCurrentMasterNode() {
		 return this.wrappedArray[0];
	 }

   /**
    * Comprueba si un nodo es el maestro
    * @param {Node} nodeToCheck Nodo a comprobar
    * @returns {Boolean} true en caso afirmativo, false si no
    */
   isMasterNode(nodeToCheck) {
     const currentMasterNode = this.getCurrentMasterNode();
     if(VariableUtils.isDefined(currentMasterNode)) {
       return currentMasterNode.networkInterface == nodeToCheck.networkInterface
        && currentMasterNode.apiPort == nodeToCheck.apiPort;
     }
     return false;
   }

   /**
    * Comprueba si el array se encuentra vacío
    * @returns {Boolean} true en caso afirmativo, false si no
    */
   isEmpty() {
     return this.wrappedArray.length == 0;
   }

   /**
    * Obtiene la posición de un nodo en el array (y por tanto, su preferencia a ser maestro)
    * @param {Node} nodeToCheck Nodo a comprobar
    * @returns {Integer} posición en el array (0 el maestro)
    */
   getNodeIndex(nodeToCheck) {
     return this.wrappedArray.findIndex(function(wrappedNode) {
       return nodeToCheck.networkInterface == wrappedNode.networkInterface
         && nodeToCheck.apiPort == wrappedNode.apiPort;
     });
   }

   /**
    * Obtiene el array de nodos evitando uno en concreto (útil para obtener
    * todos los nodos menos el maestro)
    * @param {Node} nodeToAvoid nodo a evitar
    * @returns {Node[]} Array de nodos distintos
    */
   getNodesDistinctThan(nodeToAvoid = {}) {
      return this.wrappedArray.filter(function(wrappedNode) {
        return !(nodeToAvoid.networkInterface == wrappedNode.networkInterface
          && nodeToAvoid.apiPort == wrappedNode.apiPort);
      })
   }
};
