/**
 * Main
 * @description Fichero main ejecutable
 * @author José Luis Urbano Orgaz
 */
'use strict';

const nodeFogPath = '../';
const processUtils = require(nodeFogPath + 'src/common/utils/ProcessUtils.js');

const AppConfiguration = require(nodeFogPath + 'src/common/model/AppConfiguration.js');
const App = require(nodeFogPath + 'src/common/model/App.js');

//Parse received arguments
const appConfiguration = new AppConfiguration();
appConfiguration.initFromArguments(processUtils.loadArguments());

const nodeFogApp = new App(appConfiguration);
nodeFogApp.start();
