const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { parseString } = require('xml2js');

const Token = '7021785182:AAEmKmG9qIz1txPDtoyTOGF4VBzHNDq1bDE'; // Replace with your bot token
const bot = new TelegramBot(Token, {polling: true});
const sessionKey = "cbd71e38738cc1454373356127b6f23b";

let isProcessing = false; // Flag to track if the bot is currently processing a request
let queue = []; // Queue to store chat IDs of users waiting to interact with the bot

// Listen for /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Please Enter Your Callsign To Be Verified!'); // Send a welcome message
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/start')) {
        return; // Ignore /start command in the message handler
    }

    // Add the user to the queue
    queue.push(chatId);

    // Process messages only if the bot is not currently processing any request
    if (!isProcessing) {
        processQueue(msg); // Pass msg as an argument
    } else {
        bot.sendMessage(chatId, 'You are in the queue. Please wait for your turn.');
    }
});

async function processQueue(msg) { // Receive msg as a parameter
    const chatId = queue[0];
    isProcessing = true;

    try {
        const text = msg.text;

        const response = await axios.get(`https://xmldata.qrz.com/xml/current/?s=${sessionKey}&callsign=${text}`);
        const xmlData = response.data;
        parseString(xmlData, (err, result) => {
            if (err) {
                throw err;
            }
            const responseData = JSON.stringify(result);
            // Verification logic
            if (chatId) {
                // Send invitation message to the verified user
                bot.sendMessage(chatId, 'Congratulations! You are verified. Click the link to join our group: [Group Name](https://t.me/joinchat/your_group_link)');
            } else {
                bot.sendMessage(chatId, 'Sorry, you are not verified.');
            }
            isProcessing = false; // Set processing flag to false
            // After processing, remove the user from the queue and check if there are more users waiting
            queue.shift();
            if (queue.length > 0) {
                processQueue(msg); // Pass msg as an argument
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
        bot.sendMessage(chatId, 'An error occurred while processing your request.'); // Send an error message
        isProcessing = false; // Set processing flag to false
        // Handle error and move to the next user in the queue
        queue.shift();
        if (queue.length > 0) {
            processQueue(msg); // Pass msg as an argument
        }
    }
}
