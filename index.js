/**
 * @license
 * Copyright (c) 2018-2019 vanished
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

/**
 * Use strict mode.
 */
"use strict";

/**
 * The discord.js module.
 * @constant {object}
 * @readonly
 * @requires module:discord.js
 * @see {@link https://discord.js.org/#/|discord.js}
 */
const Discord = requireQuietly("discord.js");

/**
 * The jimp module.
 * @constant {object}
 * @readonly
 * @requires module:jimp
 * @see {@link https://github.com/oliver-moran/jimp|oliver-moran/jimp}
 */
const Jimp = requireQuietly("jimp");

if (!(Discord && Jimp)) {
    process.exitCode = 1;
    return;
}

/**
 * The client as starting point for VanBot.
 * @constant {Discord.Client}
 * @listens Discord.Client#event:ready
 * @listens Discord.Client#event:guildMemberAdd
 * @listens Discord.Client#event:guildMemberRemove
 * @listens Discord.Client#event:message
 * @readonly
 */
const client = new Discord.Client({disableEveryone: true});

/**
 * An enum for names of events client can listen to.
 * @constant {object}
 * @enum {string}
 * @readonly
 */
const Events = Discord.Constants.Events;

process.on("uncaughtException", error => {
    console.error(error);
    exit(1);
}).on("unhandledRejection", console.error);

["SIGHUP", "SIGINT", "SIGTERM", "SIGBREAK"]
.forEach(signal => process.on(signal, () => exit()));

/**
 * The "prefix". If a message client receives
 * starts with the prefix, it is potentially a command.
 * @constant {string}
 * @default
 * @readonly
 */
const PREFIX = "!";

/**
 * The left padding used when generating an image.
 * @constant {number}
 * @default
 * @readonly
 */
const COMMON_LEFT_PADDING = 50;

/**
 * The message used when an image can't be generated.
 * @constant {string}
 * @default
 * @readonly
 */
const IMAGE_UNAVAILABLE_MESSAGE = "Sorry, an error occured while generating image.";

/**
 * An enum for permissions required by the client.
 * @constant {object}
 * @enum {number}
 * @readonly
 * @see {@link https://discordapp.com/developers/docs/topics/permissions|Permissions}
 */
const Permissions = Discord.Permissions.FLAGS;

/**
 * The font used in generated images. If the font
 * hasn't been loaded yet, it is undefined.
 * @type {undefined|Jimp.Font}
 * @see loadFont
 */
let discordFont;

loadFont("./fonts/welcome/discordfont.fnt", font => discordFont = font);

/**
 * Load a font, retries indefinitely until the font is
 * successfully loaded or the exit sequence has begun.
 * @param {string|String} pathToFont Path to the fnt file to be loaded.
 * @param {function} callback Callback function with one argument
 * which is an object representing the loaded font.
 * @throws {TypeError} Arguments must match their documented types respectively.
 */
function loadFont(pathToFont, callback) {
    pathToFont = unboxIfBoxed(pathToFont);
    if (!(typeof pathToFont === "string" && typeof callback === "function")) {
        throw new TypeError("Incorrect type(s) for loadFont arguments!");
    }
    Jimp.loadFont(pathToFont).then(font => {
        console.log(`Font from path "${pathToFont}" has been loaded.`);
        callback(font);
    }).catch(() => {
        if (!process.env.EXITING) {
            loadFont(pathToFont, callback);
        }
    });
}

/**
 * Class representing some text to be printed
 * to images at a specific position.
 */
class PrintData {

    /**
     * Create a new PrintData.
     * @param {number|Number} xAxis The offset on the X axis.
     * @param {number|Number} yAxis The offset on the Y axis.
     * @param {string|String} printString The text to be printed.
     * @throws {TypeError} Arguments must match their documented types respectively.
     */
    constructor(xAxis, yAxis, printString) {
        xAxis = unboxIfBoxed(xAxis);
        yAxis = unboxIfBoxed(yAxis);
        printString = unboxIfBoxed(printString);
        if (!(typeof xAxis === "number" && typeof yAxis === "number" && typeof printString === "string")) {
            throw new TypeError("Incorrect type(s) for PrintData arguments!");
        }
        if (!(Number.isFinite(xAxis) && Number.isFinite(yAxis))) {
            throw new RangeError("PrintData arguments \"xAxis\" and \"yAxis\" must not be NaN or infinite!");
        }
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.printString = printString;
    }

    /**
     * Get the text to be printed.
     * @override
     * @returns The text to be printed.
     */
    toString() {
        return this.printString;
    }

    /**
     * Get the text to be printed.
     * @override
     * @returns The text to be printed.
     */
    valueOf() {
        return this.printString;
    }
}

/**
 * Read an image from the given path, print text,
 * and generate buffer of the modified image.
 * @param {string|String} readDestination The path to read original image from.
 * @param {...PrintData} printDatas At least one {@link PrintData} containing
 * text to be printed to the image.
 * @returns {Promise<Buffer>} A Promise that resolves to the buffer of
 * the modified image. Rejects with an Error if one or more unexpected
 * situations is encountered, for example font hasn't been loaded,
 * or original image can't be read.
 * @throws {TypeError} Arguments must match their documented types respectively.
 */
function createImageBuffer(readDestination, ...printDatas) {
    readDestination = unboxIfBoxed(readDestination);
    if (!(typeof readDestination === "string" && printDatas.length && printDatas.every(printData => printData instanceof PrintData))) {
        throw new TypeError("Incorrect type(s) for createImageBuffer arguments!");
    }
    if (!discordFont) {
        return Promise.reject(new Error("createImageBuffer is called while font has not been loaded yet!"));
    }
    return Jimp.read(readDestination).then(image => {
            printDatas.forEach(printData => image.print(discordFont, printData.xAxis, printData.yAxis, printData.printString));
            return image.getBufferAsync(Jimp.MIME_PNG);
        });
}

/**
 * Get the offset on the Y axis for text to be printed,
 * depending on the row it is on in the image.
 * @param {number|Number} row The row the text is to be on in
 * the image. This argument is 0-based.
 * @returns {number} The calculated offset on the Y axis.
 * @throws {TypeError} Argument must match its documented type.
 * @throws {RangeError} Argument "row" must be an integer not less than 0.
 */
function getYPadding(row) {
    row = unboxIfBoxed(row);
    if (typeof row !== "number") {
        throw new TypeError("Incorrect type for getYPadding argument!");
    }
    if (!Number.isInteger(row)) {
        throw new Error("getYPadding argument \"row\" must be an integer!");
    }
    if (row < 0) {
        throw new RangeError("getYPadding argument \"row\" must be at least 0!");
    }
    return 250 + 130 * row;
}

/**
 * Check if client has permission in a channel.
 * @param {Discord.GuildChannel} channel The channel to check for client's permissions.
 * @param {...string|String|number|Number|Discord.Permissions} permissions At least one
 * permission to check for if client has in the given channel.
 * @returns {boolean} "true" if client has all of the permissions
 * checked for in the given channel or if client has the
 * {@link Permissions.ADMINISTRATOR} permission, otherwise "false".
 * @throws {TypeError} Arguments must match their documented types respectively.
 */
function clientHasPermissionInChannel(channel, ...permissions) {
    permissions = permissions.map(unboxIfBoxed);
    if (!((channel instanceof Discord.GuildChannel) && permissions.length && permissions.every(permission =>
        typeof permission === "string" || Number.isInteger(permission) ||
        permission instanceof Discord.Permissions))) {
        throw new TypeError("Incorrect type(s) for clientHasPermissionInChannel arguments!");
    }
    return channel.permissionsFor(client.user).has(permissions);
}

/**
 * Destroy the client and set the specified exit code
 * to stop the process gracefully.
 * If an error of WebSocket connection was encountered,
 * client's status isn't set and client isn't destroyed.
 * @param {number|Number} [exitCode=0] Optional, the exit code
 * to use when the process exits.
 * @throws {TypeError} Argument must match its documented type.
 * @throws {Error} Argument "exitCode" must be an integer.
 */
function exit(exitCode) {
    exitCode = unboxIfBoxed(exitCode);
    if (!(typeof exitCode === "number" || exitCode == null)) {
        throw new TypeError("Incorrect type for exit argument!");
    }
    if (exitCode != null && !Number.isInteger(exitCode)) {
        throw new Error("exit argument \"exitCode\" must be an integer!");
    }
    if (process.env.EXITING) {
        return console.log("exit is called but it was already called previously.");
    }
    process.env.EXITING = "true";
    if (exitCode == null) {
        exitCode = 0;
    }
    if (!process.env.WEBSOCKET_DIED) {
        client.destroy().then(() => console.log("Client has logged out."));
        console.log("About to set process exit code, process will exit when no more tasks are pending.");
        process.exitCode = exitCode;
        return;
    }
    process.exit(exitCode);
}

/**
 * Load a package without creating any uncaught exceptions.
 * Errors caught are printed to stderr.
 * @param {string|String} packageName The name of package to load.
 * @returns {undefined|object} The loaded package. "undefined" is
 * returned if either packageName isn't a string or String object,
 * or package can't be loaded.
 */
function requireQuietly(packageName) {
    packageName = unboxIfBoxed(packageName);
    if (typeof packageName !== "string") {
        return;
    }
    let required;
    try {
        required = require(packageName);
    } catch (error) {
        console.error(error);
    }
    return required;
}

/**
 * Unbox Number, Boolean and String objects.
 * @param {} object The object to be unboxed. If it isn't
 * an instance of Number, Boolean, or String, the original
 * object or value is returned.
 * @returns {} Value of unboxed Numbers, Booleans, or Strings.
 * The original object or value is returned if it isn't
 * an instance of Number, Boolean, or String.
 */
function unboxIfBoxed(object) {
    if (object instanceof Number || object instanceof Boolean || object instanceof String) {
        return object.valueOf();
    }
    return object;
}

/**
 * Send a greetings image to #greetings channel.
 * @param {Discord.GuildMember} member The member to greet.
 * @param {string|String} background Path to the background image to be used.
 * @param {string|String} text The text to greet the member with.
 * @throws {TypeError} Arguments must match their documented types respectively.
 */
function sendGreetings(member, background, text) {
    background = unboxIfBoxed(background);
    text = unboxIfBoxed(text);
    if (!(member instanceof Discord.GuildMember && typeof background === "string" && typeof text === "string")) {
        throw new TypeError("Incorrect type(s) for sendGreetings arguments!");
    }
    const greetings = "greetings";
    const guild = member.guild;
    if (!guild.available) {
        return console.log("Guild is unavailable, greetings can't be sent!");
    }
    const channel = guild.channels.find(channel => channel.name === greetings && channel.type === "text");
    if (!channel) {
        return console.log(`No channel is named ${greetings} in guild ${guild.name}!`);
    }
    if (!clientHasPermissionInChannel(channel, Permissions.SEND_MESSAGES, Permissions.ATTACH_FILES)) {
        return console.log(`Client doesn't have permission "Attach Files" in channel ${greetings}!`);
    }
    createImageBuffer(background,
        new PrintData(COMMON_LEFT_PADDING, getYPadding(0), member.user.tag),
        new PrintData(COMMON_LEFT_PADDING, getYPadding(1), text))
    .then(buffer => channel.send(new Discord.Attachment(buffer)).catch(console.error))
    .catch(error => {
        console.error(error);
        channel.send(IMAGE_UNAVAILABLE_MESSAGE).catch(console.error);
    });
}

client.once(Events.READY, () => {
    const clientUser = client.user;
    console.log(`Logged in as ${clientUser.tag}!`);
    clientUser.setActivity("everything.", {type: "WATCHING"}).catch(console.error);
}).on(Events.GUILD_MEMBER_ADD, member =>
    sendGreetings(member, "./images/welcome/wbg.png", `You are the ${member.guild.memberCount}th member!`)
).on(Events.GUILD_MEMBER_REMOVE, member =>
    sendGreetings(member, "./images/welcome/bbg.png", "We hope to see you soon!")
).on(Events.MESSAGE_CREATE, message => {
    const content = message.content;
    const channel = message.channel;
    if (message.author.bot || !(channel.type === "text" && content.startsWith(PREFIX) && clientHasPermissionInChannel(channel, Permissions.SEND_MESSAGES))) {
        return;
    }
    switch (content.substring(PREFIX.length).toLowerCase().split(/\s+/gi)[0]) {
        case "ping": {
            message.reply("Pong!").catch(console.error);
            break;
        }
        case "generator": {
            if (!clientHasPermissionInChannel(channel, Permissions.ATTACH_FILES)) {
                message.reply("Permission \"Attach Files\" is needed to send images!")
                .catch(console.error);
                return console.log(`Client doesn't have permission "Attach Files" in channel ${channel.name}!`);
            }
            createImageBuffer("./images/welcome/wbg.png",
                new PrintData(COMMON_LEFT_PADDING, getYPadding(0), "noob#0000"),
                new PrintData(COMMON_LEFT_PADDING, getYPadding(1), `You are the ${message.guild.memberCount}th member!`))
            .then(buffer => channel.send(new Discord.Attachment(buffer)).catch(console.error))
            .catch(error => {
                console.error(error);
                channel.send(IMAGE_UNAVAILABLE_MESSAGE).catch(console.error);
            });
        }
    }
}).on(Events.ERROR, error => {
    process.env.WEBSOCKET_DIED = "true";
    console.error(error);
    exit(1);
}).login(process.env.BOT_TOKEN).catch(error => {
    console.error(error);
    exit();
});
