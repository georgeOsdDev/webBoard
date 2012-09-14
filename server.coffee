# Author: Takeharu.Oshida<br>
# repository: https://github.com/georgeOsdDev/webBoard<br>
# Licence: MIT<br>

# module dependencies
express  = require 'express'
routes   = require './routes'
http     = require 'http'
path     = require 'path'
socketIO = require 'socket.io'
stylus   = require 'stylus'
nib      = require 'nib'

# compile function of stylus using `nib`
compile = (str, path) ->
  stylus(str).set('filename', path).set('compress', true).use(nib())

# create express instance
# and set config
app = express()
app.configure ->
  app.set 'title','WhiteBoard'
  app.set 'port', process.env.PORT || 8080
  app.set 'views', "#{__dirname}/views"
  app.set 'view engine', 'ejs'
  app.use express.favicon()
  app.use express.logger('dev')
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use stylus.middleware({ src: "#{__dirname}/public",compile: compile })
  app.use express.static(path.join(__dirname, 'public'))
  app.use express.errorHandler()
  app.use app.router

# Routing<br>
# [/](/) is entry point of this site <br>
# [/docs](/docs) routes documentation files generated by [docco](http://jashkenas.github.com/docco/)
#
app.get '/', routes.index
app.get '/index', routes.index
app.get '/index.html', routes.index
app.get '/docs', routes.docs
app.get '/docs.html', routes.docs

# Create server and listen it with socket.IO
io = socketIO.listen http.createServer(app).listen(app.get('port'))
console.log "Express server listening on port #{app.get('port')}"
console.log "Go http://#{process.env.VCAP_APP_HOST || 'localhost'}:#{app.get('port')}/" 

# set log level rower
io.set 'log level',1

# Namespace of application
webBoard =
  activeUser:0
  objectList:{}

#Socket.io event handler
io.sockets.on 'connection',  (socket) ->
  console.log "new user connected"
  webBoard.activeUser++

  # Initialize client
  sendData =
    action : 'initialize'
    actionData : webBoard.objectList
  socket.emit 'message', sendData

  # Handle message
  # client emit message to server and then, server broadcast to other clients.
  socket.on 'message', (data) ->
    action = data.action
    actionData = data.actionData
    if action is 'createObj'
      webBoard.objectList[actionData.id] = actionData.object
    if action is 'moveObj'
      webBoard.objectList[actionData.id].top = actionData.top
      webBoard.objectList[actionData.id].left = actionData.left
    if action is 'removeObj'
      webBoard.objectList[actionData.id] = {}
    if action is 'editObj'
      webBoard.objectList[actionData.id].body = actionData.body
    if action is 'clearAll'
      webBoard.objectList = {}

    # BroadCast message to clients
    socket.broadcast.emit("message", data);

  # Heartbeat
  socket.on 'heartbeat', ->
    # console.log " #{socket.id} is alive"

  # Disconnect
  socket.on 'disconnect', ->
    webBoard.activeUser--
    console.log "one user disconnected #{socket.id}"

  # Error
  socket.on 'error', (event)->
    console.error "Error occured", event
