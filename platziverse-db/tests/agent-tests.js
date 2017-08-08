'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')

let config = {
  logging () {}
}

let MetricStub = {
  belongsTo: sinon.spy()
}

let id = 1
let uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null

let single = Object.assign({}, agentFixtures.single)

let uuidArgs = {
  where: { uuid }
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()

  AgentStub = {
    hasMany: sandbox.spy()
  }

  // Model update Stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model findById Stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with specified id')

  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})

test.serial('Agent#createOrUpdate - exists', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args')
  t.true(AgentStub.update.called, 'agent.update called on model')
  t.true(AgentStub.update.calledOnce, 'agent.update should be called once')
  t.true(AgentStub.update.calledWith(single), 'agent.update should be called with specified args')

  t.deepEqual(agent, single, 'agent should be the same')
})
