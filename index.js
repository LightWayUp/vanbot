const Discord = require('discord.js');
const Jimp = require("jimp");
const ms = require("ms");

const client = new Discord.Client();

client.on("ready", () => { 
  client.user.setPresence({
   afk: false,
   status: 'online',
   game: { 
      name: "everything.", 
      type: 3,
      url: "https://twitch.com/"
  }
  })
});

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`); 
}); 

client.on('guildMemberAdd', member => {
    
		var channel = member.guild.channels.find('name', 'greetings');
		 
		 Jimp.read("./images/welcome/wbg.png", function (err, lenna) {
        if (err) throw err;
        lenna.write("./images/welcome/welcome.png"); 
        Jimp.loadFont("./fonts/welcome/discordfont.fnt").then(function (font) {
        lenna.print(font, 50, 250, member.user.tag)
        lenna.print(font, 50, 380, "You are the " + channel.guild.memberCount + "th member!")
        .write("./images/welcome/welcome.png"); 
    });
    });

    setTimeout(function() {
        channel.sendFile("./images/welcome/welcome.png");
    }, ms("3s"));
	
});

client.on('guildMemberRemove', member => {
		
		var channel = member.guild.channels.find('name', 'greetings');

		 Jimp.read("./images/welcome/bbg.png", function (err, lenna) {
        if (err) throw err;
        lenna.write("./images/welcome/goodbye.png"); 
        Jimp.loadFont("./fonts/welcome/discordfont.fnt").then(function (font) {
        lenna.print(font, 50, 250, member.user.tag)
        lenna.print(font, 50, 380, "We hope to see you soon!")
        .write("./images/welcome/goodbye.png"); 
    });
    });

    setTimeout(function() {
        channel.sendFile("./images/welcome/goodbye.png");
    }, ms("3s"));
	
});
	
client.on('message', msg => { 
	if (msg.content === '!ping') { 
		msg.reply('Pong!'); 
	} 
	if (msg.content === '!generator') {
		    Jimp.read("./images/welcome/bbg.png", function (err, lenna) {
        if (err) throw err;
        lenna.write("./images/welcome/goodbye.png"); 
    Jimp.loadFont("./fonts/welcome/discordfont.fnt").then(function (font) {
        lenna.print(font, 50, 250, "noob#0000")
        lenna.print(font, 50, 380, "You are the " + msg.guild.memberCount + "th member!")
        .write("./images/welcome/goodbye.png"); 
    });
    });

    setTimeout(function() {
        msg.channel.sendFile("./images/welcome/goodbye.png");
    }, ms("3s"));
	};
	});

client.login('');
    
    
