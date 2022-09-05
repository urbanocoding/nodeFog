'use strict';

/**
 * API constants
 * @description Constantes para almacenar las rutas y propiedades de las APIs
 * @author José Luis Urbano Orgaz
 */

 exports.DISPATCHER_API_PATH = '/jobs';
 exports.ENGINE_API_PATH = '/engine';
 exports.AGGREGATOR_API_PATH = '/result';
 exports.MANAGER_API_PATH = '/manager';

 exports.GET_METHOD = 'GET';
 exports.POST_METHOD = 'POST';
 exports.DELETE_METHOD = 'DELETE';
 exports.JSON_HEADER_CONTENT_TYPE = {
    'Content-Type': 'application/json'
};