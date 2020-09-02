/*
    Future Plans:
        Ch and Role search by name
        Fix function Em (Figure out emoji lookup)
        Split Recommendations (Rec) out from Tips
		Make separate docs for: TV, movies, books, misc
		Call with `!rec TV` or `!rec`
		If no sub specified, randomly chose one of the available docs
		Then once in doc randomly choose one line and return it.
		Create an interface for adding new entries to these from Discord (Crypto should be able to help)
*/

// Set constants
findCommands=function(client,command) {
    if (Object.keys(command).includes("name") && Object.keys(command).includes("execute")) client.commands.set(command.name, command);
    else Object.keys(command).forEach((c) => {findCommands(client,command[c]);});
}

findSocials=function(client,social) {
    if (Object.keys(social).includes("trigger") && Object.keys(social).includes("execute")) client.socials.set(social.trigger, social);
    else Object.keys(social).forEach((c) => {findSocials(client,social[c]);});
}


const fs=require('fs');
const Discord=require('discord.js');
const {prefix,token}=require('/home/plex/bots/authCarl.json');
const client=new Discord.Client();
client.commands=new Discord.Collection();
client.socials=new Discord.Collection();
const commandFiles=fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const socialFiles=fs.readdirSync('./socials').filter(file => file.endsWith('.js'));
for (const file of commandFiles) findCommands(client,require(`./commands/${file}`));
for (const file of socialFiles) findSocials(client,require(`./socials/${file}`));
const Ch = require('./commands/ch.js');
const Em = require('./commands/em.js');
const Role = require('./commands/role.js');
const Recs = require("./commands/recs.js");

// Define Functions
function Mbr(mem,leadcap) {
    console.error("Mbr in use.");
    return mem||((leadcap?"F":"f")+"riend");
}

// acknowledge ready state
client.on('ready', () => {
    // console.log('Logged in as ${client.user.tag)!');
    
    //define Ch and Role objects.
    Ch.set("bot","675864898617606184");
    Ch.set("help","583979972578770945");
    Ch.set("test","681380531493142533");
    Ch.set("welcome","581340165520359424");
    Ch.set("plex","581346715852865547");
    Ch.set("calibre","590195078765608961");
    Ch.set("rules","581352180355694603");
    Role.set("casting","581334517151825920");
	Role.set("staff","676660602688765962");

    // define frequently used channels.
    onconn = Ch.get(client,"bot");
    offconn = Ch.get(client,"test");
    newconn = Ch.get(client,"welcome");

    // uncomment below to set client to send to testing channel. (Ushers/Producer only)
    // onconn=offconn;

    // Links to roles and channels.
    CastingRef=Role.ref("CaStInG");
    RulesRef=Ch.ref("rules");
    CalibreRef=Ch.ref("calibre");
    PlexRef=Ch.ref("plex");
	HelpRef=Ch.ref("help");

    // Wakeup message.
    var say=new Array("Sorry, I must have dozed off for a bit.","Please excuse me, the best scene just finished. I'm here now.","My apologies, I was a bit distracted.");
	onconn.send(say[Math.floor(Math.random()*say.length)]);
	client.setInterval(()=> require('./drvchk.js')(Ch.get(client,"help"),Role.ref("staff")),350000);
});

// Reply to messages
client.on('message', msg => {
    if (client.user.id !== msg.author.id) {
		require("./commands/asyouwish.js")(msg);
        const args = msg.content.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (msg.content.startsWith(prefix+commandName)) {
            const command=client.commands.get(commandName);
            try {
                command.execute(msg, args);
                if (command.args && !args.length) {
                    let reply = `You didn't provide any arguments, ${message.author}!`;
                    if (command.usage) {
                        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
                    }
                    return message.channel.send(reply);
                }
            }
            catch (error) {
                console.error(error);
                console.log('there was an error trying to execute '+command+'!');
            }
        }
		
        //Plain text social responses
        else {
			client.socials.forEach(social => {if (social.trigger(msg)) social.execute(msg);});

            // New Member follow-up
            if (msg.content.match(/^.*i understand.*$/i) && msg.channel == newconn) {
                newconn.send("Done? Great! Sorry to put you through that mess, but it was pretty important. Now, I'll slip a note to our "+CastingRef+" department. They should be by soon to answer any questions and let you in.");
                setTimeout(function() {newconn.send("Oh, I almost forgot! Once you're in, if you need help, be sure to ask in the "+HelpRef+" channel. You can also type !help to see what I can help you with.");msg.member.removeRole("701907216479027281");},5000);
			}
            
            // help text
            if (msg.content.match(/^!help/i)||msg.content.match(/^help.*carl.*/i)) {
                msg.channel.send(msg.author+', here\'s a quick help list!\n\n!ping ["plex"/"calibre"/"ftp"/"all"/""] - Asks me the status of various services.\n!tips - Asks me for a random tip.\n!help - Tells me to display this message.\n\nIf you need assistance or have a suggestion for my service, let a member of our Casting staff know in '+HelpRef+'.');
            }
        }
    }
});

// Member greeting
client.on('guildMemberAdd', member => {
    member.addRole("701907216479027281");
    newconn.send(member+", welcome! Please read everything in "+RulesRef+", "+PlexRef+", and "+CalibreRef+", then come back here and tell me, \"**I understand**,\" to continue.");
});
client.login(token);
