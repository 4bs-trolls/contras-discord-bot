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
	attendanceMessage = interaction.member.nickname + ' is unable to make it this week. You might want to run `/subs` in <#' + subsChannel + '>';
	if (embed) {
		if (userHasRespondedToRollcall(interaction, embed)) {
			const userField = getIndexOfUserResponse(interaction, embed);
			embed.fields.splice(userField, 1);
			attendanceMessage = interaction.member.nickname + ' has updated their status and is no longer able make it this week. You might want to run `/subs` in <#' + subsChannel + '>';
		}
		newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'needs a sub!' });
	}
	await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
	return { newEmbed, attendanceMessage };
}

async function rollcallAccept(embed, newEmbed, interaction, attendanceMessage) {
	attendanceMessage = interaction.member.nickname + ' is ready to blast some balls!';
	if (embed) {
		if (userHasRespondedToRollcall(interaction, embed)) {
			const userField = getIndexOfUserResponse(interaction, embed);
			embed.fields.splice(userField, 1);
			attendanceMessage = interaction.member.nickname + ' has updated their status is now ready to blast some balls! We should make sure we do not already have a sub for them.';
		}
		newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'is in!' });
	}
	await interaction.reply({ content: 'You are in!', ephemeral: true });
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

	if (userHasRespondedToRollcall(interaction, embed)) {
		const userIndex = getIndexOfUserResponse(interaction, embed);
		const suffix = embed.fields[userIndex].value;
		const sameState = (interaction.customId === 'rollcall-accept' && suffix === 'is in!') || (interaction.customId === 'rollcall-decline' && suffix === 'needs a sub!');
		if (sameState) {
			return false;
		}
	}

	return true;
}

function userHasRespondedToRollcall(interaction, embed) {
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

