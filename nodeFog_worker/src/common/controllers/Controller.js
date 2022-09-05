/**
 * Controlador genérico inmutable para la aplicación
 * @author José Luis Urbano Orgaz
 */
'use strict';

module.exports = class Controller  {

  constructor(app) {
      this._app = app;
  }

  get app() {
    return this._app;
  }
}
