// Author: Takeharu.Oshida<br>
// repository: https://github.com/georgeOsdDev/webBoard<br>
// Licence: MIT<br>

// __Namespace of client__
window.webBoard ={
  objNo:0,
  objList:{},
  draggableOption:{
    scroll:false,
    opacity: 0.5,
    start:function(event,ui){
          startMoving(event,ui,true);
        },
    stop:function(event,ui){
          stopMoving(event,ui,true);
        }
  },
  lock:{},
  HOST:'http://' + (location.host || 'localhost'),
  socket:io.connect(this.HOST)
}

// __Socket.IO events__
// * start connection
webBoard.socket.on('init',function(data){
  console.log('socket.io connected');
});
// * disconnect
webBoard.socket.on('disconnect', function(){ 
  console.log('socket.io disconnected');
});
// * getMessage from Server
webBoard.socket.on('message', function(data){ 
  getMessage(data);
})
// * And handle message
function getMessage(data)
{
  var action = data.action;
  var actionData = data.actionData;

  switch (action)
  {
    case 'initialize':
      initialize(actionData);
      break;
    case 'createObj':
      createObj(actionData.object,false);
      break;      
    case 'moveObj':
      moveObj(actionData);
      break;
    case 'removeObj':
      console.log(actionData);
      removeObj(actionData,false);
      break;
    case 'editObj':
      editObj(actionData,false);
      break;
    case 'switchCanvas':
      switchCanvas(actionData.canvasTitle,false);
      break;
    case 'setLock':
      setLock(actionData,false);
      break;
    case 'clearAll':
      console.log('clear!!');
      clearAll(false);
      break;
    case 'setLock':
      setLock(actionData);
      break;
    default:
      console.log("Invalid messageType. : " + action);
      break;
  }
}

// send Message to Server
function toServer(data){
  webBoard.socket.emit('message', data);
}


// Dom ready
$(function(){
  // start ieAlert
  $("body").iealert();
  // this app is not prefer to mobile.
  if (!($.browser.mozilla || $.browser.webkit || $.browser.opera)){
    // should do thomething
  }


  // bind function to change event of selectbox
  // switch background-image
  $("#canvasSel").change(function () {
      switchCanvas($('#canvasSel option:selected').text(),true);
  });

  // Bind create Object function to buttons
  $("#menu > a").each(function(index,domEle){
    // handle bttons with data attribute only
    var dataStr = $(this).attr('data');
    if (dataStr){
      var dataJson = JSON.parse($(this).attr('data'));
      $(this).bind('click',function(){
        createObj(dataJson, true);
      })
    }
  });

  // bind clear All function
  $("#clearBtn").bind('click',function(){
    clearAll(true);
  });

})

// switch back-ground image
function switchCanvas(canvasTitle,selfFlg){
  switch (canvasTitle)
  {
    case 'Plain':
      $("#mainboardDiv").css('background-image','none');
      $("#mainboardDiv").css('background-color','whiteSmoke');
    break;
    case 'None':
      $("#mainboardDiv").css('background-image','none');
      $("#mainboardDiv").css('background-color','white');
    break;
    case 'Grid':
      $("#mainboardDiv").css('background-image','url("/images/grid.jpg")');
    break;
    case 'x-y':
      $("#mainboardDiv").css('background-image','url("/images/xy.jpg")');
    break;
    case 'x-y#2':
      $("#mainboardDiv").css('background-image','url("/images/xy2.jpg")');
    break;
    default:
      $("#mainboardDiv").css('background-image','none');
      break;
  }
  // don't sync canvas
  // var sendData = {
  //   action:"switchCanvas",
  //   actionData:{
  //     canvasTitle:canvasTitle
  //   }
  // };
  // if (selfFlg) toServer(sendData);
}

// Create Object
function createObj(obj,selfFlg){
  if(selfFlg && isLocked('createObj')) return;
  //switch inner element
  var conts ="";
  switch(obj.type){
    case "postit":
      conts = "<textarea class='post-"+obj.color+"' col='5' row='10'>Edit and Drag Me.</textarea>";
      break;
    case "stamp":
      conts ="<p style='color:"+obj.color+"'>&"+obj.stamp+";</p>";
      break;
    default:
  }

  var id = "";
  // selfFlg means that this event was statred by self
  if (selfFlg){
    id = 'obj'+webBoard.objNo;
    obj.id = id;
    webBoard.objNo++;
    obj.objNo = webBoard.objNo;
  } else {
    // if this event was started by server, id was send by server.
    id = obj.id;
    webBoard.objNo = obj.objNo;
  }

  // Crreate Element
  var elm = "<div id='"+id+"' class='"+obj.type+" btn-"+ obj.color + " obj-init'>"
            +"<button type='button' class='close close-margin' data-dismiss='alert'><i class='icon-remove'></i></button>"
            +conts
            +"</div>";
  $('#mainboardDiv').append(elm);

  // bind jquery.UI event
  $('#'+id).draggable(webBoard.draggableOption);
  $('#'+id).bind('closed',function(){
    removeObj(obj,selfFlg);
  });
  // watch inner text of postit
  $('#'+id+'> textarea').bind('keyup',function(){
    obj.body = $('#'+id+'> textarea').val();
    editObj(obj,true);
  })
  .bind('focus',function(){
    if (isLocked(id)) return;
  })
  .bind('blur',function(){
    unLock(id);
  });

  // if object was send by server, set its position
  if (!selfFlg) {
    $('#'+id).css('top',obj.top);
    $('#'+id).css('left',obj.left);
  }
  $('#'+id).fadeIn();
  
  // save object
  webBoard.objList.id = obj;

  // sand to server
  var sendData = {
    action:"createObj",
    actionData:{
      id:id,
      object:obj
    }
  };
  if (selfFlg) {
    toServer(sendData);
    unLock('createObj');
  }
}

// lock object when it start moving
function startMoving(event,ui){
  var id = ui.helper.context.id;
  if(isLocked(id)) return;

}

// send object position to server when it stop moving
function stopMoving(event,ui){
  var id = ui.helper.context.id;
  var top = ui.position.top;
  var left = ui.position.left;
  var sendData = {
    action:"moveObj",
    actionData:{
      id:ui.helper.context.id,
      top:top,
      left:left
    }
  }
  toServer(sendData);
  unLock(id);
}

// move object with the data from server
function moveObj(data){
  console.log(data);
  var currentPosition = $('#' + data.id).position();
  if (data.top == currentPosition.top && data.left == currentPosition.left) return;
  $('#' + data.id).fadeOut("slow",function(){
    $('#' + data.id).css('top',data.top)
    .css('left',data.left)
    .fadeIn();    
  });
}

// remove object 
function removeObj(data,selfFlg){
  var id = data.id;
  if (selfFlg && isLocked(id)) return;
  $("#" + id).remove();
  webBoard.objList[id] = {};

  var sendData = {
    action:"removeObj",
    actionData:{
      id:id
    }
  };
  if (selfFlg) toServer(sendData);
}

// edit object's inner text
function editObj(data,selfFlg){
  if (selfFlg){
    var sendData = {
      action:"editObj",
      actionData:data
    }
    toServer(sendData);
  } else {
    console.log(data);
    $('#'+data.id+'> textarea').val(data.body);
  }
}

// remove all objects
function clearAll(selfFlg){
  $("#mainboardDiv").empty();
  var sendData = {
    action:"clearAll",
    actionData:{
      id:"mainboardDiv"
    }
  };
  webBoard.objList = {};
  objNo = 0;
  if (selfFlg) toServer(sendData);
}

// initialize objects
function initialize(objectList){
  for (var key in objectList) {
    createObj(objectList[key],false);
  }
}

function setLock(data) {
  webBoard.lock[data.id] = data.lockSts;
}

function isLocked(id){
  if (webBoard.lock[id]) return true;
  webBoard.lock[id] = true;
  var sendData = {
    action:"setLock",
    actionData:{
      id:id,
      lockSts:true
    }
  };
  toServer(sendData);
  return false;
}

function unLock(id){
  webBoard.lock[id] = false;
  var sendData = {
    action:"setLock",
    actionData:{
      id:id,
      lockSts:false
    }
  };
  toServer(sendData);
} 