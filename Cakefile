{print} = require 'util'
{spawn} = require 'child_process'

start = (callback) ->
  cmd = spawn 'node', ['app.js']
  cmd.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  cmd.stdout.on 'data', (data) ->
    print data.toString()
  cmd.on 'exit', (code) ->
    callback?() if code is 0

doc = (callback) ->
  cmd = spawn 'docco', ['-o' , 'public/docs' , 'server.coffee']
  cmd = spawn 'docco', ['-o' , 'public/docs' , 'public/javascripts/client.js']
  cmd.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  cmd.stdout.on 'data', (data) ->
    print data.toString()
  cmd.on 'exit', (code) ->
    callback?() if code is 0

tempbuild = (callback) ->
  coffee = spawn 'coffee', ['-o', 'temp.dir', 'server.coffee']
  coffee.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  coffee.stdout.on 'data', (data) ->
    print data.toString()
  coffee.on 'exit', (code) ->
    callback?() if code is 0

task 'start', 'Start server', ->
  start()
  console.log 'success!'

task 'doc', 'Generate document with docco', ->
  doc()
  console.log 'success!'

task 'tempbuild', 'compile *.coffee to temp.dir', ->
  tempbuild()
  console.log 'success!'  