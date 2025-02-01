const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {


		// If the user has not set a nickname, reject the interaction
		if (!interaction.member.nickname) {
			await rejectNoNickname(interaction);
		} else if (interaction.isChatInputCommand()) {
			try {
				const command = interaction.client.commands.get(interaction.commandName);
				// If the command does not exist, log an error and return
				if (!command) {
					console.error(`No command matching ${interaction.commandName} was found.`);
					return;
				}
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}: ${error}`);
			}
		} else if (interaction.isButton()) {
			// TODO: Reject interaction and let the user know if they responded with the same status (double click)
			const attendanceChannel = interaction.client.channels.cache.get(process.env.ATTENDANCE_CHANNEL_ID);
			const subsChannel = interaction.client.channels.cache.get(process.env.SUBS_CHANNEL_ID);
			const embed = interaction.message.embeds[0];
			let newEmbed;
			let attendanceMessage = '';
			let attendanceEmbed

			// User accepted rollcall
			if (interaction.customId === 'rollcall-accept') {
				// Pull down the latest attendance data for all
				// Update the players status to accepted in the DB
				//  -- on callback
				// Edit the rollcall message with the new status
				// Edit the existing attendance message with the new status and then send a ping in the channel
				await interaction.reply({ content: 'You are in!', ephemeral: true });
			} else if (interaction.customId === 'rollcall-decline') {
				// Pull down the latest attendance data for all
				// Update the players status to accepted in the DB
				//  -- on callback
				// Edit the rollcall message with the new status
				// Edit the existing attendance message with the new status and then send a ping in the channel
				// Send a message in the subs channel to let them know we need a sub

				await interaction.reply({ content: 'We will find you a sub :smile:', ephemeral: true });
			} else if (interaction.customId === 'subs-accept') {
				// Pull down the latest attendance data for all
				// Update the players status to accepted in the DB
				//  -- on callback
				// Edit the rollcall message with the new status
				// Edit the existing attendance message with the new status and then send a ping in the channel
				// Send a message in the subs channel to let them know we need a sub

				await interaction.reply({
					content: 'Thanks for volunteering! We appreciate it :smile:',
					ephemeral: true,
				});
				attendanceMessage = interaction.member.nickname + ' wants to sub! We should let them know if we are already full';
			}
			//
			// if (embed) {
			// 	await interaction.message.edit({ embeds: [newEmbed] });
			// }
			if (attendanceMessage && attendanceEmbed) {
				await attendanceChannel.send({ content: attendanceMessage, embeds: [attendanceEmbed] });
			}
		} else if (interaction.isAutocomplete()) {
			try {
				const command = interaction.client.commands.get(interaction.commandName);
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
		}
	},
};

async function rejectNoNickname(interaction) {
	const embed = new EmbedBuilder()
		.setTitle('Uh oh! It looks like you have not set your nickname yet')
		.setDescription('Please set a nickname so we can identify you in the server by typing `/nick {your name here}`.\n\n**Examples:**\nJohn would type `/nick John`\nNick would type `/nick Nick`')
		.setColor('#FF0000')
		.setTimestamp();
	await interaction.reply({ embeds: [embed], ephemeral: true });
}

