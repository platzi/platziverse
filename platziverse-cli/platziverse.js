#!/usr/bin/env node

'use strict'

/* eslint new-cap: "off" */

const blessed = require('blessed')
const contrib = require('blessed-contrib')
const moment = require('moment')
const PlatziverseAgent = require('platziverse-agent')

const agent = new PlatziverseAgent()
const screen = blessed.screen()

const agents = new Map()
const agentMetrics = new Map()

const grid = new contrib.grid({
  rows: 1,
  cols: 4,
  screen
})

const tree = grid.set(0, 0, 1, 1, contrib.tree, {
  label: 'Connected Agents'
})

const line = grid.set(0, 1, 1, 3, contrib.line, {
  label: 'Metric',
  showLegend: true,
  minY: 0,
  xPadding: 5
})

agent.on('agent/connected', payload => {
  const { uuid } = payload.agent

  if (!agents.has(uuid)) {
    agents.set(uuid, payload.agent)
    agentMetrics.set(uuid, {})
  }

  renderData()
})

agent.on('agent/disconnected', payload => {
  const { uuid } = payload.agent

  if (agents.has(uuid)) {
    agents.delete(uuid)
    agentMetrics.delete(uuid)
  }

  renderData()
})

agent.on('agent/message', payload => {
  const { uuid } = payload.agent
  const { timestamp } = payload

  if (!agents.has(uuid)) {
    agents.set(uuid, payload.agent)
    agentMetrics.set(uuid, {})
  }

  const metrics = agentMetrics.get(uuid)

  payload.metrics.forEach(m => {
    const { type, value } = m

    if (!Array.isArray(metrics[type])) {
      metrics[type] = []
    }

    const length = metrics[type].length
    if (length >= 20) {
      metrics[type].shift()
    }

    metrics[type].push({
      value,
      timestamp: moment(timestamp).format('HH:mm:ss')
    })
  })

  renderData()
})

function renderData () {
  const treeData = {}

  for (let [ uuid, val ] of agents) {
    const title = ` ${val.name} - (${val.pid})`
    treeData[title] = {
      uuid,
      agent: true,
      children: {}
    }

    const metrics = agentMetrics.get(uuid)
    Object.keys(metrics).forEach(type => {
      const metric = {
        uuid,
        type,
        metric: true
      }

      const metricName = ` ${type}`
      treeData[title].children[metricName] = metric
    })
  }

  tree.setData({
    extended: true,
    children: treeData
  })
  screen.render()
}

screen.key([ 'escape', 'q', 'C-c' ], (ch, key) => {
  process.exit(0)
})

agent.connect()
tree.focus()
screen.render()
