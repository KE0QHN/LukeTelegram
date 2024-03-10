const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { parseString } = require('xml2js');

const Token = '7021785182:AAEmKmG9qIz1txPDtoyTOGF4VBzHNDq1bDE'; // Replace with your bot token
const bot = new TelegramBot(Token, {polling: true});

const username = 'KE0QHN'; // Replace with your QRZ username
const password = 'vpLOFllNR1w9fTqn5Ixq'; // Replace with your QRZ password
const agent = 'LT.2'; // Replace with your QRZ agent

// Function to retrieve session key from QRZ API
// Function to retrieve session key from QRZ API
async function getSessionKey(username, password, agent) {
    try {
        const response = await axios.get(`https://xmldata.qrz.com/xml/current/?username=${username};password=${password};agent=${agent}`);

        return new Promise((resolve, reject) => {
            parseString(response.data, (err, result) => {
                if (err) {
                    console.error('Error parsing XML:', err);
                    reject(err);
                    return;
                }

                if (result.QRZDatabase.Session[0].Error) {
                    const errorMessage = result.QRZDatabase.Session[0].Error[0];
                    console.error('Error from QRZ API:', errorMessage);
                    reject(errorMessage);
                    return;
                }

                const sessionKey = result.QRZDatabase.Session[0].Key[0];
                resolve(sessionKey);
            });
        });
    } catch (error) {
        console.error('Error retrieving session key:', error);
        return null; // Handle error
    }
}

async function getInfoByCallsign(sessionKey, callsign) {
    try {
        const response = await axios.get(`https://xmldata.qrz.com/xml/current/?s=${sessionKey};callsign=${callsign}`);
        return response.data; // Return response data
    } catch (error) {
        console.error('Error retrieving information:', error);
        return null; // Handle error
    }
}

// Listen for /start command
// Listen for /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Please verify your details.'); // Send a welcome message
    // Here you can implement your logic to verify user details
});

// Listen for messages from users
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Please verify your details first.'); // Prompt user to verify details
    const sessionKey = await getSessionKey(username, password, agent);
    if (sessionKey) {
        console.log('Session key:', sessionKey);
        // Now you can use this session key for subsequent requests
        const callsign = msg.chat.message; // Replace with the callsign input by the user
        const info = await getInfoByCallsign(sessionKey, callsign);
        if (info) {
            console.log('Information:', info);
            // Process retrieved information as needed
        } else {
            console.log('Failed to retrieve information.');
            // Handle failed retrieval of information
        }
    } else {
        console.log('Failed to retrieve session key.');
        // Handle failed retrieval of session key
    }
});

// Handle new members joining the group
bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    const newUser = msg.new_chat_members[0];
    bot.sendMessage(chatId, `Welcome, ${newUser.first_name}!`);
    // Process next user or perform any other actions
});

// Handle errors
bot.on('polling_error', (error) => {
    console.log(error);  // Log the error
});

// Handle errors
bot.on('webhook_error', (error) => {
    console.log(error);  // Log the error
});
