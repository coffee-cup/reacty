const Botkit = require('botkit');
const emojiFromWord = require('emoji-from-word');

// Load environment files
const dotenv = require('dotenv');
dotenv.load();

const port = process.env.PORT || 3000;

if (!process.env.SLACK_API_TOKEN) {
    throw new Error('Need SLACK_API_TOKEN env var to continue');
}

const controller = Botkit.slackbot({
    debug: false
});

controller.setupWebserver(port, (err) => {
    if (err) console.log(err);
    console.log(`Magic happens on port ${port}`);
});

controller.spawn({
    token: process.env.SLACK_API_TOKEN
}).startRTM();

const createReaction = (message, emoji) => ({
    timestamp: message.ts,
    channel: message.channel,
    name: emoji
});

const reactToMessage = (bot, message, emoji) => {
    bot.api.reactions.add(createReaction(message, emoji));
};

const makeReacter = (keywords, emojis) => {
    controller.hears(keywords, ['ambient', 'direct_message', 'direct_mention', 'mention'], (bot, message) => {
        emojis.forEach((e) => {
            reactToMessage(bot, message, e);
        });
    });
};

const normalizeText = (s) => s.toLowerCase().trim();

const hear = ['direct_message', 'direct_mention', 'mention'];

controller.hears('hello|^hi$', ['ambient', 'mention', 'direct_mention'], (bot, message) => {
    reactToMessage(bot, message, 'wave');
});

controller.hears('help', hear, (bot, message) => {
    bot.reply(message, 'I will react to message that I am tagged in.');
});

controller.hears('vote\!', ['ambient'], (bot, message) => {
    reactToMessage(bot, message, 'thumbsup');
    reactToMessage(bot, message, 'thumbsdown');
});

controller.hears('vote:(.+)', ['ambient'], (bot, message) =>  {
    const text = message.match[1].toLowerCase().trim();
    const votingWords = text.split(',');

    votingWords.forEach((word) => {
        word = word.trim();

        // exceptions
        if (word === 'no') word = 'thumbsdown';
        if (word === '3') word = 'three';

        const emoji = emojiFromWord(word);
        console.log(emoji);

        if (emoji.emoji_name && emoji.score >= 0.95) {
            reactToMessage(bot, message, emoji.emoji_name);
        }
    });
});

controller.hears('.*', ['mention', 'direct_mention'], (bot, message) => {
    const text = normalizeText(message.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''));
    const words = text.split(' ');

    words.forEach((word) => {
        const emoji = emojiFromWord(word);
        console.log(emoji);

        if (emoji.emoji_name && emoji.score >= 0.95) {
            reactToMessage(bot, message, emoji.emoji_name);
        }
    });
});

makeReacter('midterm|assignment|school|final|lab|class|exam', ['thumbsdown']);
makeReacter('beer|fels|party', ['beers']);
