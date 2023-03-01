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
	// ignore interaction if user has already responded with the same status
	if (!isValidButtonInteraction(interaction, embed)) {
		newEmbed = embed;
		await interaction.reply({ content: 'You have already responded to this rollcall', ephemeral: true });
		// rollcall.js accept button
	} else if (interaction.customId === 'rollcall-accept') {
		({ newEmbed, attendanceMessage } = await rollcallAccept(embed, newEmbed, interaction, attendanceMessage));
		// rollcall.js decline button
	} else if (interaction.customId === 'rollcall-decline') {
		({ newEmbed, attendanceMessage } = await rollcallDecline(embed, newEmbed, interaction, attendanceMessage, subsChannel));
		// subs.js accept button
	} else if (interaction.customId === 'subs-accept') {
		await interaction.reply({ content: 'Thanks for volunteering! We appreciate it :smile:', ephemeral: true });
		attendanceMessage = interaction.member.nickname + ' wants to sub! We should let them know if we are already full';
	}
	return { newEmbed, attendanceMessage };
}

async function rollcallDecline(embed, newEmbed, interaction, attendanceMessage, subsChannel) {
	if (embed) {
		if (userHasResponded(interaction, embed)) {
			const userField = getIndexOfUserResponse(interaction, embed);
			newEmbed = embed.spliceFields(userField, 1);
		} else {
			newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'needs a sub!' });
		}
	}
	await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
	attendanceMessage = interaction.member.nickname + ' is unable to make it this week. You might want to run `/subs` in <#' + subsChannel + '>';
	return { newEmbed, attendanceMessage };
}

async function rollcallAccept(embed, newEmbed, interaction, attendanceMessage) {
	if (embed) {
		newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'is in!' });
	}
	await interaction.reply({ content: 'You are in!', ephemeral: true });
	attendanceMessage = interaction.member.nickname + ' is ready to blast some balls!';
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
		// subs.js accept button
		return true;
	}

	if (userHasResponded(interaction, embed)) {
		const userIndex = getIndexOfUserResponse(interaction, embed);

		console.log(embed.fields[userIndex]);
		// add logic to handle user changing their response
		return true;
	}

	return true;
}

function userHasResponded(interaction, embed) {
	if (getIndexOfUserResponse(interaction, embed) !== -1) {
		return true;
	}
	return false;
}

function getIndexOfUserResponse(interaction, embed) {
	const fields = embed.fields;
	for (let i = 0; i < fields.length; i++) {
		if (fields[i].name === interaction.member.nickname) {
			return i;
		}
	}
	return -1;
}

