'use strict';

/**
 * FlowClient
 * @description Ejecutable main de la aplicación
 * @author José Luis Urbano Orgaz
 */
const ProcessUtils = require('./src/utils/ProcessUtils.js');
const AppConfiguration = require('./src/model/AppConfiguration.js');
const RemoteConnection = require('./src/model/RemoteConnection.js');
const TaskFlow = require('./src/model/TaskFlow.js');
const RequestController = require('./src/controller/RequestController.js');
const NodeFogClient = require('./src/model/NodeFogClient.js');


//Parseo de los argumentos recibidos
const appConfiguration = new AppConfiguration();
appConfiguration.initFromArguments(ProcessUtils.loadArguments());
console.log('Iniciando');

const startDate = new Date();

let host = appConfiguration.getConfigValue('host');
let port = appConfiguration.getConfigValue('port');
const taskFlowFile = appConfiguration.getConfigValue('file');

const remoteConnection =
  new RemoteConnection(host, port);
const nodeFogClient = new NodeFogClient(remoteConnection);
const taskFlowToExecute = new TaskFlow(taskFlowFile);

//Solicitud de ejecución
nodeFogClient.executeFileTaskFlow(
  taskFlowToExecute,
  function (response) { //Función de finalización (eliminación del flujo)
    const endDate = new Date();
    console.log('');
    console.log('Resultado final obtenido en '+Math.floor((endDate.getTime() - startDate.getTime()) / 1000)+' segundos');
  }.bind(this),
  function (response) { //Función de progreso (periódica)
    console.log('');
    console.log('Resultado:');
    console.log(response.results);
  },
  function(error) { //Función de error
    console.error(error);
  }.bind(this)
);