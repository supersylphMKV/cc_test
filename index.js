//initiate required modules
const http      = require('http');
const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const app       = express();
const server    = http.createServer(app);
const io        = require('socket.io')(server);
const cmd       = require('node-cmd');

//setting up ports and internal modules
var port        = NormalizePort(process.env.PORT || '1116');
var index, ioListener, dbHandler, r, rProc;

//instancing database
cmd.get('ps -ef | grep rethinkdb',(err,res)=>{
    var pid = [], out = res.split('\n');
    for(var o = 0; o < out.length;o++){
        var p = out[o][2];
        var c = out[o][8];

        if(c === 'rethinkdb'){
            pid[pid.length] = p;
        }
    }
    if(pid.length >0){
        do {
            cmd.get('kill -9 ' + pid[0],(err,res)=>{
                if(err){
                    console.log(err);
                }
            });
            pid.shift();
        } while (pid.length > 0);
    }

    rProc = cmd.get('rethinkdb --bind all',(err,res)=>{
        console.log(err,res);
    })
});

setTimeout(()=>{
    r = require('rethinkdbdash')({
        host:'localhost',
        port:28015
    });
    require('./modules/io.js')({r:r}).then(res=>{
        ioListener = res;
        ServerSetup();
    })
},5000);

//server setup
function ServerSetup(){
    index       = require('./modules/main.js');

    server.listen(port);
    server.on('error',onError);
    server.on('listening',onListening);

    app.set('views',path.join(__dirname,'/layout'));
    app.set('view engine','jade');
    app.use(express.static(path.join(__dirname,'/public')));
    app.use('/modules',express.static(path.join(__dirname,'/node_modules')));

//setup routes and io
    app.use('/', index);
    app.use((req,res,next)=>{
        next(createError(404));
    });
    app.use((err,req,res,next)=>{
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        res.status(err.status || 500);
        res.render('error');
    });
    io.on('connection', function(socket){
        //setup io listener
        ioListener.listen(socket);
    });
}

process.stdin.resume();
//server methods

//make sure db is turned off when apps is closed
//===========================================
function exitHandler(options, exitCode){
    if(options.cleanup){
        cmd.run('kill ' + rProc.pid);
    }

    if(exitCode || exitCode == 0){
        console.log(exitCode);
    }
    if(options.exit){
        process.exit();
    }
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null,{exit:true}));
process.on('SIGUSR1', exitHandler.bind(null,{exit:true}));
process.on('SIGUSR2', exitHandler.bind(null,{exit:true}));
process.on('uncaughtException', exitHandler.bind(null,{exit:true}));
//===========================================
function NormalizePort(val){
    var port = parseInt(val,10);

    if(isNaN(port)){
        return val;
    }

    if(port >= 0){
        return port;
    }

    return false;
}

function onError(err){
    if(err.syscall !== 'listen' ){
        throw err;
    }

    var bind = typeof port == 'string'
    ? 'Pipe' + port
    : 'Port' + port;

    switch (err.code){
        case 'EACCES' :
            console.error(bind + 'insufficient privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + 'port in use');
            process.exit(1);
            break;
    }
}

function onListening(){
    var addr = server.address();

    var bind = typeof addr == 'string'
        ? 'Pipe ' + addr
        : 'Port ' + addr.port;
    console.log('listen on : ' + bind);
}