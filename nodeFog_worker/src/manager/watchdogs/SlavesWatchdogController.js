
'use strict';

const nodeFogPath = '../../../';
const VariableUtils = require(nodeFogPath + 'src/common/utils/VariableUtils.js');
const WatchdogController = require(nodeFogPath + 'src/common/controllers/WatchdogController.js');

/**
 * Watchdog para la sincronización de nodos
 * @description El nodo master solicitará periódicamente a los nodos esclavos
 *              que muestren sus métricas; los nodos esclavos ejecutarán
                periódicamente la comprobación de si se han convertido o no en
                máster (a no ser que como argumento se haya indicado lo contrario)
 * @author José Luis Urbano Orgaz
 */
module.exports = class SlavesWatchdogController extends WatchdogController {

  /**
   * Constructor parametrizado
   * @param {App} app Instancia de la aplicación
   * @param {Integer} interval Intervalo de ejecución en milisegundos
   */
  constructor(app, interval) {
    super(app, interval);
  }

  /**
   * Función de ejecución periódica
   */
  _periodicTask() {
    if(this.app.isMasterNode()) {
      //En caso de que se trate del nodo master, realizaremos la sincronización
      //periódica de los esclavos
      this.app.syncSlaveNodes();
    } else if (!this.app.masterNodeArray.isEmpty()) {
      //Controlamos que el master se haya comunicado en alguna ocasión
      this.app.syncMasterNode();
    }
  }

  /**
   * Función de inicio
   */
  start() {
    setInterval(this._periodicTask.bind(this), this._interval);
  }
}
