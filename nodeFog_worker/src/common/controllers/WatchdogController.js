'use strict';

const nodeFogPath = '../../../';
const Controller = require(nodeFogPath + 'src/common/controllers/Controller.js');

/**
 * WatchdogController
 * @author José Luis Urbano Orgaz
 */
module.exports = class WatchdogController extends Controller {


  constructor(app, interval) {
    super(app);
    this._interval = interval;
  }

  get interval() {
    return this._interval;
  }
}
