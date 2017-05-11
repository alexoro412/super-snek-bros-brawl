const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const shortid = require('shortid');
const randomcolor = require('randomcolor');
const localip = require('local-ip');
const interface = 'en0';

app.get('/', function(req, res){
  res.redirect('/spectate');
})

app.get('/play', function(req, res){
  res.sendFile(__dirname + "/2d_snake.html");
});

app.get('/spectate', function(req, res){
  res.sendFile(__dirname + "/spectate.html");
})

h = 512;
cell_width = 16;
max_cell = h / cell_width - 1;
min_cell = 0;

function randomCellIndex()
{
 return Math.floor(Math.random() * (max_cell - min_cell)) + min_cell;
}

food = {x: randomCellIndex(), y: randomCellIndex()}

io.on('connection', function(socket){
  socket.snek = {};
  socket.snek.id = shortid.generate();
  socket.snek.color = randomcolor({luminosity:'dark'});

  socket.emit('accept', {id: socket.snek.id, color: socket.snek.color});
  socket.on('death', function(data){
    io.emit('del snek', {id: data.id});
    socket.snek.id = shortid.generate();
    socket.snek.color = randomcolor({luminosity:'dark'});
    setTimeout(function(){
      socket.emit('accept', {id: socket.snek.id, color: socket.snek.color})
    }, 2000);

  });
  socket.on('disconnect', function(){
    io.emit('del snek', {id: socket.snek.id});
  });
  socket.on('food', function(data){
    if(data.eaten){
      food = {x: randomCellIndex(), y: randomCellIndex()}
      io.emit('mov food', food);
    }else{
      socket.emit('mov food', food);
    }
  });
  socket.on('snek update', function(data){
    if(typeof data.id != "undefined")
    io.emit('snek update', data);
  });
});

localip(interface, function(err, res){
  server.listen(3000, function(){
    if(err) {
      console.log("Not sure what the IP is")
    }else{
      console.log("Listening on " + res + ":3000")
    }
  })
});
