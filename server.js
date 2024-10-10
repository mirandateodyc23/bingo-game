// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let users = [];
let numbersCalled = [];
let bingoWinner = [];
const MAX_BINGO_NUM = 75;

let isGameActive = false; // Flag to control game state

// Function to pause the calling
const pauseNumberCalling = () => {
    isPaused = true; // Set paused state to true
};

// Function to resume the calling
const resumeNumberCalling = () => {
    isPaused = false; // Set paused state to false
};


// Function to generate a random number between 1 and 75
function generateRandomNumber() {
    return Math.floor(Math.random() * MAX_BINGO_NUM) + 1;
}


// Emit a new number every 10 seconds
let numberInterval;
let isPaused = false; // Variable to track pause state
const intervalDuration = 5000;
const hodlDuration = 2000;
const startNumberCalling = () => {
    numberInterval = setInterval(() => {
        if (!isPaused) { // Check if not paused
            if (numbersCalled.length < MAX_BINGO_NUM) {
                let number;
                do {
                    number = generateRandomNumber();
                } while (numbersCalled.includes(number));

                numbersCalled.push(number);
                io.emit('numberCalled', number);
            } else {
                clearInterval(numberInterval); // Stop if all numbers are called
                io.emit('gameOver', 1);
            }

            io.emit('drawNow', hodlDuration);
        }
        // isPaused = true;
    }, intervalDuration); // 1000 seconds in milliseconds
};

// Function to reset the game
const resetGame = () => {
    numbersCalled = [];
    bingoWinner = [];
    isGameActive = false;
    clearInterval(numberInterval); // Stop if all numbers are called
};

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Route for access denied
app.get('/access-denied', (req, res) => {
    return res.send('Access Denied: Your IP address is not allowed.');
});

// Route for access denied
app.get('/404', (req, res) => {
    return res.send('404 Not Found: Sorry, the page you are looking for does not exist.');
});

app.use((req, res, next) => {
    // Get client IP address
    const clientIp = req.headers['host'];

    // Serve static files
    const modifiedIP = clientIp.replace(/(\.\d+)$/, '');
    if (modifiedIP === '10.150.23') { // PRG & DES ONLY
        next(); // Proceed to the next middleware or route
    } else {
        return res.redirect('/access-denied');
    }
});

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/bongo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Catch-all route for unknown routes
app.use((req, res, next) => {
    return res.redirect('/404');
});


io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        users.push({ id: socket.id, username });
        socket.emit('welcome', { users, numbersCalled });
        io.emit('newuser', users);
        socket.broadcast.emit('userJoined', username);
    });

    // Handle starting the game
    socket.on('startGame', () => {
        if (!isGameActive) {
            isGameActive = true;
            startNumberCalling();
            bingoWinner = [];
            io.emit('gameStarted'); // Notify all users that the game has started
        } else {
            resumeNumberCalling();
            io.emit('gameResumed'); // Notify all users that the game has started
        }
    });

    socket.on('pauseGame', () => {
        if (isGameActive) {
            pauseNumberCalling();
            io.emit('gamePaused'); // Notify all users that the game has started
        }
    });    

    socket.on('resetGame', () => {
        if (isGameActive) {
            resetGame();
            io.emit('gameReset'); // Notify all users that the game has reset
        }
    });    


    // Handle number call
    socket.on('callNumber', (number) => {
        if (!numbersCalled.includes(number)) {
            numbersCalled.push(number);
            io.emit('numberCalled', number);
        }
    });

    // Handle Winner
    socket.on('bingoWinner', (username) => {
        if (!bingoWinner.includes(username)) {
            bingoWinner.push(username);
            io.emit('bingoWinner', bingoWinner);

            if (isGameActive) {
                pauseNumberCalling();
                io.emit('pauseWinner', bingoWinner); // Notify all users that the game has started
            }
            
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        users = users.filter(user => user.id !== socket.id);
        console.log('A user disconnected:', socket.id);
    });
    
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on with port ${PORT}`);
});