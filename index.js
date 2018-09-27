'use strict';

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs   = require('fs');
const jwt  = require('jsonwebtoken');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/auth/login', function(req, res) {
    console.log('login');
    if (!('username' in req.query) || !('password' in req.query)) {
        res.send('ERROR: Missing requird params.');
    }
    else {
        var payload = {
            username: req.query['username']
        };

        const signingOptions = {
            expiresIn: '10s'
        }
        const token = jwt.sign(payload, 'test', signingOptions);

        res.send({token: token});
    }
});

app.get('/', function(req, res){
    console.log('stuff');
    res.send('<h1>Hello world</h1>');
});

function isValidTicket(socket) {
    if ('ticket' in socket.handshake.query) {
        try {
            jwt.verify(socket.handshake.query['ticket'], 'test');
            const data = jwt.decode(socket.handshake.query['ticket']);
            socket.username = data['username'];
            return true;
        }
        catch (e) {
            return false;
        }
    }
    return false;
}

io.on('connection', (socket) => {
    if (!isValidTicket(socket)) {
        socket.emit('invalid-access', 'Invalid Access');
        socket.disconnect(0);
    }

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('set-username', (username) => {
        socket.username = username;
    });

    socket.on('add-message', (message) => {
        io.emit('message', { type: 'new-message', text: message, username: socket.username });
    });

});

http.listen(5000, function(){
    console.log('listening on *:3000');
});