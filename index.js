const Discord = require("discord.js");
const Jimp = require("jimp");
const ms = require("ms");

const client = new Discord.Client();

const commonTimeout = ms("3s");
const commonLeftPadding = 50;
const commonTopPadding = 250;
var discordFontPromise;

client.on("ready", () => { 
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        afk: false,
        status: "online",
        game: { 
            name: "everything.", 
            type: 3,
            url: "https://twitch.com/"
        }
    });
    loadDiscordFont();
});

function loadDiscordFont() {
    discordFontPromise = Jimp.loadFont("./fonts/welcome/discordfont.fnt");
}

const handleFontLoadingFailure = () => {
    console.error("Failed to load font, retrying...");
    loadDiscordFont();
}

function PrintData(xAxis, yAxis, printString) {
    if (typeof xAxis !== "number" || typeof yAxis !== "number" || typeof printString !== "string") {
        throw new TypeError("Incorrect type(s)!");
    }
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.printString = printString;
}

function createPrintedImage(readDestination, writeDestination, ...printDatas) {
    Jimp.read(readDestination).then(image => {
        return discordFontPromise.then(font => {
            for (const printData of printDatas) {
                if (!(printData instanceof PrintData)) {
                    throw new TypeError("Arguments of rest parameters of function createPrintedImage must be instances of PrintData!");
                }
                image.print(font, printData.xAxis, printData.yAxis, printData.printString);
            }
            image.write(writeDestination);
        }, handleFontLoadingFailure);
    }, err => {
        console.error(err);
    });
}

client.on("guildMemberAdd", member => {
    const channel = member.guild.channels.find("name", "greetings");
    const outFilePath = "./images/welcome/welcome.png";

    createPrintedImage("./images/welcome/wbg.png",
        outFilePath,
        new PrintData(commonLeftPadding, commonTopPadding, member.user.tag),
        new PrintData(commonLeftPadding, commonTopPadding + 130, `You are the ${channel.guild.memberCount}th member!`));

    setTimeout(() => {
        channel.sendFile(outFilePath);
    }, commonTimeout);
});

client.on("guildMemberRemove", member => {		
    const channel = member.guild.channels.find("name", "greetings");
    const outFilePath = "./images/welcome/goodbye.png";

    createPrintedImage("./images/welcome/bbg.png",
        outFilePath,
        new PrintData(commonLeftPadding, commonTopPadding, member.user.tag),
        new PrintData(commonLeftPadding, commonTopPadding + 130, "We hope to see you soon!"));

    setTimeout(() => {
        channel.sendFile(outFilePath);
    }, commonTimeout);
});

client.on("message", msg => {
    const content = msg.content;
    if (!content.startsWith("!")) {
        return;
    }
    switch (content.substring(1).toLowerCase()) {
        case "ping": {
            msg.reply("Pong!");
            break;
        }
        case "generator": {
            const outFilePath = "./images/welcome/goodbye.png";

            createPrintedImage("./images/welcome/bbg.png",
                outFilePath,
                new PrintData(commonLeftPadding, commonTopPadding, "noob#0000"),
                new PrintData(commonLeftPadding, commonTopPadding + 130, `You are the ${msg.guild.memberCount}th member!`));

            setTimeout(() => {
                msg.channel.sendFile(outFilePath);
            }, commonTimeout);
            break;
        }
        default: {
            // Unknown command, ignores
        }
    }
});

client.login("process.env.BOT_TOKEN");
