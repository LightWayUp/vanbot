/**
 * @license
 * Copyright (c) 2018 vanished
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @author vanished
 */

const Discord = require("discord.js");
const Jimp = require("jimp");
const ms = require("ms");

const client = new Discord.Client();
const prefix = "!";
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

function PrintData(xAxis, yAxis, printString) {
    if (typeof xAxis !== "number" || typeof yAxis !== "number" || typeof printString !== "string") {
        throw new TypeError("Incorrect type(s) for PrintData arguments!");
    }
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.printString = printString;
}

function createPrintedImage(readDestination, writeDestination, ...printDatas) {
    if (typeof readDestination !== "string" || typeof writeDestination !== "string") {
        throw new TypeError("Incorrect type(s) for createPrintedImage arguments!");
    }
    Jimp.read(readDestination).then(image => {
        return discordFontPromise.then(font => {
            for (const printData of printDatas) {
                if (!(printData instanceof PrintData)) {
                    throw new TypeError("Arguments of rest parameters of function createPrintedImage must be instances of PrintData!");
                }
                image.print(font, printData.xAxis, printData.yAxis, printData.printString);
            }
            image.write(writeDestination);
        }, error => {
            console.error(`Failed to load font, retrying...\nError: ${error}`);
            loadDiscordFont();
        });
    }, err => console.error(err));
}

client.on("guildMemberAdd", member => {
    const channel = member.guild.channels.find("name", "greetings");
    if (channel === undefined) { // Can't find greetings channel
        console.error(`No channel is named "greetings" in guild ${guild.name}!`);
        return;
    }
    const outFilePath = "./images/welcome/welcome.png";

    createPrintedImage("./images/welcome/wbg.png",
        outFilePath,
        new PrintData(commonLeftPadding, commonTopPadding, member.user.tag),
        new PrintData(commonLeftPadding, commonTopPadding + 130, `You are the ${channel.guild.memberCount}th member!`));

    setTimeout(() => channel.sendFile(outFilePath), commonTimeout);
});

client.on("guildMemberRemove", member => {		
    const channel = member.guild.channels.find("name", "greetings");
    if (channel === undefined) { // Can't find greetings channel
        console.error(`No channel is named "greetings" in guild ${guild.name}!`);
        return;
    }
    const outFilePath = "./images/welcome/goodbye.png";

    createPrintedImage("./images/welcome/bbg.png",
        outFilePath,
        new PrintData(commonLeftPadding, commonTopPadding, member.user.tag),
        new PrintData(commonLeftPadding, commonTopPadding + 130, "We hope to see you soon!"));

    setTimeout(() => channel.sendFile(outFilePath), commonTimeout);
});

client.on("message", msg => {
    const content = msg.content;
    if (!content.startsWith(prefix)) {
        return;
    }
    switch (content.substring(prefix.length).toLowerCase()) {
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

            setTimeout(() => msg.channel.sendFile(outFilePath), commonTimeout);
            break;
        }
        default: {
            // Unknown command, ignores
        }
    }
});

client.login(process.env.BOT_TOKEN);
