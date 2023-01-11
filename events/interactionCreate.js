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
			const attendanceChannel = interaction.client.channels.cache.get('1055572161185730652');
			const embed = interaction.message.embeds[0];
			let newEmbed;
			let attendanceMessage;
			if (interaction.customId === 'rollcall-accept') {
				if (embed) {
					newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'is in!' });
				}
				await interaction.reply({ content: 'You are in!', ephemeral: true });
				attendanceMessage = interaction.member.nickname + ' is ready to blast some balls!';
			} else if (interaction.customId === 'rollcall-decline') {
				if (embed) {
					newEmbed = EmbedBuilder.from(embed).addFields({ name: interaction.member.nickname, value: 'needs a sub!' });
				}
				await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
				attendanceMessage = interaction.member.nickname + ' is unable to make it this week. You might want to run `/subs` in <#1059182204237918248>';
			}
			if (embed) {
				await interaction.message.edit({ embeds: [newEmbed] });
			}
			await attendanceChannel.send(attendanceMessage);
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