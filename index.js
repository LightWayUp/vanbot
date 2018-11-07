const Discord = require("discord.js");
const Jimp = require("jimp");
const ms = require("ms");

const client = new Discord.Client();

const commonTimeout = ms("3s");
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

const handleFontLoadingFailure = function() {
    console.error("Failed to load font, retrying...");
    loadDiscordFont();
}

client.on("guildMemberAdd", member => {
    var channel = member.guild.channels.find("name", "greetings");

	Jimp.read("./images/welcome/wbg.png").then(lenna => {
        return discordFontPromise.then(font => {
            return lenna.print(font, 50, 250, member.user.tag)
            .print(font, 50, 380, `You are the ${channel.guild.memberCount}th member!`)
            .write("./images/welcome/welcome.png"); 
        }, handleFontLoadingFailure);
    }, err => {
        console.error(err);
    });

    setTimeout(function() {
        channel.sendFile("./images/welcome/welcome.png");
    }, commonTimeout);
});

client.on("guildMemberRemove", member => {		
    var channel = member.guild.channels.find("name", "greetings");

    Jimp.read("./images/welcome/bbg.png").then(lenna => {
        return discordFontPromise.then(font => {
            return lenna.print(font, 50, 250, member.user.tag)
            .print(font, 50, 380, "We hope to see you soon!")
            .write("./images/welcome/goodbye.png"); 
        }, handleFontLoadingFailure);
    }, err => {
        console.error(err);
    });

    setTimeout(function() {
        channel.sendFile("./images/welcome/goodbye.png");
    }, commonTimeout);
});

client.on("message", msg => { 
	if (msg.content === "!ping") { 
		msg.reply("Pong!"); 
	} 
	if (msg.content === "!generator") {
		Jimp.read("./images/welcome/bbg.png").then(lenna => {
            return discordFontPromise.then(font => {
                return lenna.print(font, 50, 250, "noob#0000")
                .print(font, 50, 380, `You are the ${msg.guild.memberCount}th member!`)
                .write("./images/welcome/goodbye.png"); 
            }, handleFontLoadingFailure);
        }, err => {
            console.error(err);
        });

        setTimeout(function() {
            msg.channel.sendFile("./images/welcome/goodbye.png");
        }, commonTimeout);
	};
});

client.login("process.env.BOT_TOKEN");
