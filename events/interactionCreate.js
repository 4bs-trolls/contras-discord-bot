const { prod, dev } = require('./../channels.json');
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		} else if (interaction.isButton()) {
			const { subsChannel, attendanceChannel } = getServerChannels(interaction);
			const embed = interaction.message.embeds[0];
			const { newEmbed, attendanceMessage } = await getButtonResponse(interaction, embed, subsChannel);
			if (embed) {
				await interaction.message.edit({ embeds: [newEmbed] });
			}
			if (attendanceMessage) {
				await attendanceChannel.send(attendanceMessage);
			}
		} else if (interaction.isAutocomplete()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
		}
	},
};

async function getButtonResponse(interaction, embed, subsChannel) {
	let newEmbed;
	let attendanceMessage;
	// ignore interaction if user has already responded
	if (!isValidButtonInteraction(interaction, embed)) {
		newEmbed = embed;
		await interaction.reply({ content: 'You have already responded to this rollcall', ephemeral: true });
	// rollcall.js accept button
	} else if (interaction.customId === 'rollcall-accept') {
		if (embed) {
			newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'is in!' });
		}
		await interaction.reply({ content: 'You are in!', ephemeral: true });
		attendanceMessage = interaction.member.nickname + ' is ready to blast some balls!';
	// rollcall.js decline button
	} else if (interaction.customId === 'rollcall-decline') {
		if (embed) {
			newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'needs a sub!' });
		}
		await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
		attendanceMessage = interaction.member.nickname + ' is unable to make it this week. You might want to run `/subs` in <#' + subsChannel + '>';
	// subs.js accept button
	} else if (interaction.customId === 'subs-accept') {
		await interaction.reply({ content: 'Thanks for volunteering! We appreciate it :smile:', ephemeral: true });
		attendanceMessage = interaction.member.nickname + ' wants to sub! We should let them know if we are already full';
	}
	return { newEmbed, attendanceMessage };
}

function getServerChannels(interaction) {
	let attendanceChannel;
	let subsChannel;
	if (interaction.guildId === dev.id) {
		attendanceChannel = interaction.client.channels.cache.get(dev.attendance);
		subsChannel = interaction.client.channels.cache.get(dev.subs);
	} else {
		attendanceChannel = interaction.client.channels.cache.get(prod.attendance);
		subsChannel = interaction.client.channels.cache.get(prod.subs);
	}
	return { subsChannel, attendanceChannel };
}

function isValidButtonInteraction(interaction, embed) {
	if (!embed) {
		return true;
	}

	console.log(`fields: ${embed.data.fields}`);
	const fields = embed.data.fields;
	const user = interaction.member.nickname;

	if (fields) {
		for (let i = 0; i < fields.length; i++) {
			if (fields[i].name === user) {
				return false;
			}
		}
	}
	return true;
}

