
'use strict';

/**
 * Controlador genérico inmutable para la aplicación
 * @author José Luis Urbano Orgaz
 */
module.exports = class Controller  {

  constructor(app) {
      this._app = app;
  }

  get app() {
    return this._app;
  }
}
