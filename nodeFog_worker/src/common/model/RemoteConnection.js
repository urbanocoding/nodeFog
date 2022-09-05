/**
 * Execution request
 * @description Request model
 * @author José Luis Urbano Orgaz
 */
'use strict';

module.exports = class RemoteConnection {
	
	/**
	 * Default constructor
	 * @param {Object} requestOptions 
	 * @constructor
	 */
	 constructor(hostname, port, path, method, headers){
		 this.hostname = hostname;
		 this.port = port;
		 this.path = path;
		 this.method = method;
		 this.headers = headers;
	 }
	 
	 /**
	  * Retreives a remote connection anonymous object
	  * @return {Object} anonymous object
	  */
	 getAnonymousObject() {
		 return {
			 hostname: this.hostname,
			 port: this.port,
			 path: this.path,
			 method: this.method,
			 headers: this.headers
		 };
	 }
}