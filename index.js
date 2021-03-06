const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const config = require('./config.json');
const {Player} = require('discord-player');
require('dotenv').config();

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const player = new Player(client);

player.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(`โถ | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
});

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(`๐ถ | Track **${track.title}** queued!`);
});

player.on('botDisconnect', queue => {
  queue.metadata.send('โ | I was manually disconnected from the voice channel, clearing queue!');
});

player.on('channelEmpty', queue => {
  queue.metadata.send('โ | Nobody is in the voice channel, leaving...');
});

player.on('queueEnd', queue => {
  queue.metadata.send('โ | Queue finished!');
});

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('ready', function() {
  client.user.setActivity(config.activity, { type: config.activityType });
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

//message when someone joins the server

client.on("guildMemberAdd",async member => {
  console.log(`${member.user.username} has joined the server!`);
  const channel = member.guild.channels.cache.find(ch => ch.name === "general"|| ch.name === "playground"|| ch.name === "๐general");
  if (!channel) return;
  channel.send(`LEVANTATE LA CAMISA HDP, MรS TE VALE TRAER EL DUI A LA MANO - ${member}`);
});

//message when user leaves the server
client.on("guildMemberRemove", async member => {
  const channel = member.guild.channels.cache.find(ch => ch.name === "general"|| ch.name === "playground"|| ch.name === "๐general");
  if (!channel) return;
  channel.send(`ยก${member} Largate maldito, ni te querรญamos!`);
});

client.on('guildBanAdd', async (guild, user) => {
  const channel = guild.channels.cache.find(ch => ch.name === "general"|| ch.name === "playground"|| ch.name === "๐general");
  if (!channel) return;
  channel.send(`ยก${user} Por imbรฉcil te baneraron!`);
});

client.on('guildBanRemove', async (guild, user) => {
  const channel = guild.channels.cache.find(ch => ch.name === "general"|| ch.name === "playground"|| ch.name === "๐general");
  if (!channel) return;
  channel.send(`ยก${user} se agรผitaron y te quitaron el ban!`);
});

client.on("inviteCreate", async (invite) => {
  const channel = invite.guild.channels.cache.find(ch => ch.name === "general"|| ch.name === "playground"|| ch.name === "๐general");
  if (!channel) return;
  channel.send(`ยกBuxos ${invite.inviter} creรณ una invitaciรณn!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('Deployed!');
      })
      .catch(err => {
        message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
        console.error(err);
      });
  }
});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

client.login(process.env.TOKEN);
