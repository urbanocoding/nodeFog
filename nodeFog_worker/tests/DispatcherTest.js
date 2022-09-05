var chai = require('chai');
var expect = chai.expect;

var TasksStack = require('../src/common/model/TasksStack');
var Task = require('../../nodeFog_client/src/model/Task')
//var Task = require('../src/common/model/Task'); //TODO descomentar cuando dupliquemos el modelo

describe('Commons', function() {
	describe('Dispatcher test', function() {
	  it('getTask functionality', function() {
			var task = new Task()
			task.setId('12')
			var tasksStack = new TasksStack()
			tasksStack.addTask(task)
			expect(tasksStack.getTask(null)).to.equal(null)
			expect(tasksStack.getTaskById(task.getId())).to.equal(task)
			expect(tasksStack.getTask(task)).to.equal(task)
	  });
	});
});
