'use strict';

const Node = require('./Node.js');

/**
 * Slave node
 * @description Modelo de Slave Node, heredera de Node
 * @author José Luis Urbano Orgaz
 */
module.exports = class SlaveNode extends Node {

  /**
   * Constructor parametrizado
   * @param {String} networkInterface Interfaz de red
   * @param {Integer} apiPort Puerto de red
   * @param {Integer} score Valoración por defecto
   * @param {Boolean} battery Disponibilidad de batería
   */
  constructor(networkInterface, apiPort, score, defaultBattery) {
    super(networkInterface, apiPort, score, defaultBattery);
    this._lastChecked = undefined;
  }

  /**
   * Actualiza la información remota
   * @param {Object} remoteNodeData 
   */
  updateRemoteSystemInformationStatus(remoteNodeData) {
    this.systemInformation = remoteNodeData.systemInformation;
    this._lastChecked = Date.now();
  }

  /**
   * Reestablece el atributo lastChecked
   */
  resetLastChecked() {
    this._lastChecked = undefined;
  }

  /**
   * Actualiza el atributo lastChecked
   */
  setChecked() {
    this._lastChecked = Date.now();
  }

  get lastChecked() {
    return this._lastChecked;
  }



}