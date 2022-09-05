'use strict';

const systemInformation = require('systeminformation');

const nodeFogPath = '../../../';
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');

/**
 * Node
 * @description Modelo de nodo genérico
 * @author José Luis Urbano Orgaz
 */
module.exports = class Node {

  /**
   * Constructor parametrizado
   * @param {String} networkInterface Interfaz de red
   * @param {Integer} apiPort Puerto de red
   * @param {Integer} score Valoración por defecto
   * @param {Boolean} battery Disponibilidad de batería
   */
  constructor(networkInterface,apiPort, score = 0, battery = false) {
    this.networkInterface = networkInterface;
    this.apiPort = apiPort;
    this.pendingTasks = [];
    this.systemInformation = {
      memory: undefined,
      battery: undefined, 
      defaultBattery: battery
    };
    this.defaultScore = score;
    this.score = score;
  }

  /**
  * Obtiene los valores de batería como combinación de los datos obtenidos por el
  * sistema operativo y los proporcionados como argumento al iniciar la aplicación
  * @param {Object} batteryApiData Datos obtenidos por el sistema operativo
  * @return {Object} Valores de batería
  */
  _getBatteryStatus(batteryApiData) {
    //En caso de no indicarse el argumento, devolveremos los valores que nos indique el sistema
    //Son valores muy dependientes del so/driver: la obtención de estas métricas es mejorable
    return {
      level: batteryApiData.level? batteryApiData.level: batteryApiData.percent,
      charging: batteryApiData.charging? batteryApiData.charging: batteryApiData.ischarging
    };
  }


  /**
  * Actualiza los datos de estado del sistema del nodo
  * @param {Function} callback Función de callback a ejecutar una vez obtenida la información
  * @param {Object} appArguments Argumentos utilizados para iniciar la aplicación
  */
  updateSystemInformationStatus(callback) {
    systemInformation.battery().then(function(batteryApiData) {
      this.systemInformation.battery = this._getBatteryStatus(batteryApiData);
      systemInformation.mem(function(ramData) {
        this.systemInformation.memory = {
          free: ramData.free,
          total: ramData.total
        }
        systemInformation.cpu(function(cpuInfo) {
          this.systemInformation.cpu = {
            speed: cpuInfo.speedmax,
            cores: cpuInfo.cores
          }
          callback();

        }.bind(this));
      }.bind(this));
    }.bind(this));
  }

  /**
   * Añade una tarea a la lista de tareas pendientes
   * @param {Task} pendingTaskToAdd Tarea a añadir
   */
  addPendingTask(pendingTaskToAdd) {
    this.pendingTasks.push(pendingTaskToAdd);
  }

  /**
   * Elimina una tarea pendiente 
   * @param {Task} pendingTaskToRemove Tasrea a eliminar
   */
  removePendingTask(pendingTaskToRemove) {
    this.pendingTasks = this.pendingTasks.filter(function(pendingTask) {
      return pendingTask != pendingTaskToRemove;
    });
  }

  /**
   * Elimina una tarea pendiente dado su id y el de su flujo
   * @param {String} id Id de la tarea
   * @param {String} taskFlowId Id del flujo de tareas
   */
  removePendingTaskById(id, taskFlowId) {
    this.pendingTasks = this.pendingTasks.filter(function(pendingTask) {
      return !(pendingTask.id == id && pendingTask.taskFlowId == taskFlowId);
    });
  }

  /**
  * Actualiza las tareas pendientes dado otro nodo
  * @param {Node} node Nodo desde el que sincronizar
  */
  syncPendingTasks(node) {
    if(VariableUtils.isDefined(node) && VariableUtils.isDefined(node.pendingTasks)) {
      this.pendingTasks = node.pendingTasks;
    }
  }

  /**
   * Obtiene el elemento como JSONString
   * @returns {String} JSONString del objeto
   */
  getAsJson() {
    return JSON.stringify(this);
  }

  /**
   * Obtiene una instancia simplificada del objeto, sin funciones del prototype
   * @returns {Object} Instancia de un nuevo objeto con los atributos del nodo
   */
  getSimplifiedClone() {
    const simplifiedElement = {
      networkInterface: this.networkInterface,
      apiPort: this.apiPort,
      score: this.score,
      defaultScore: this.defaultScore,
      defaultBattery: this.defaultBattery,
      systemInformation: this.systemInformation,
      pendingTasks: this.pendingTasks.map(function(pendingTask) {
        return {
          id:pendingTask.id,
          parentNodeId: pendingTask.parentNodeId,
          taskFlowId: pendingTask.taskFlowId,
          action:pendingTask.action,
          result: pendingTask.result
        }
      })
    }
    return simplifiedElement;
  }

  /**
   * Obtiene el objeto en formato JSONString de forma simplificada
   * @returns {String} Objeto en JSONString
   */
  getSimplifiedAsJson() {
    return JSON.stringify(this.getSimplifiedClone());
  }

  /**
   * Comprueba si el nodo es igual a otro dado (en referencia a su id)
   * @param {Node} node Nodo a comparar
   * @returns {Boolean} true en caso afirmativo, false si no
   */
  isEquals(node) {
    return this.networkInterface == node.networkInterface
      && this.apiPort == node.apiPort;
  }

  /**
  * Obtiene la dirección y puerto del nodo en formato string
  * @return {String} dirección del nodo
  */
  getAddress() {
    return this.networkInterface + ':' + this.apiPort;
  }
}
