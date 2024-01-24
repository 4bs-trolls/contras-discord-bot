const {EmbedBuilder} = require("discord.js");
const fs = require("fs");
const path = require("path");

async function startAttendanceMessage( message, attendance) {
    const embed = turnAttendanceIntoEmbed(attendance);
    message.edit({
        content: `Below are attendance records for Week ${(attendance.week)} against **${(attendance.team)}** on **${(attendance.date)}**`,
        embeds: [embed]
    });
    fs.writeFileSync(path.join('./', 'data', 'attendanceWeek'+attendance.week+'.json'), JSON.stringify(attendance));
}

function turnAttendanceIntoEmbed(attendanceData) {
    const players = attendanceData.players;
    const subs = attendanceData.subs;

    let embed = new EmbedBuilder()
        .setColor('f0791e')
        .setTitle(`Attendance for Week ${attendanceData.week}`)
        .setDescription(`Monday Night Pinball, Week ${attendanceData.week} \n ${attendanceData.date} @ 8:15PM at ${attendanceData.venue}`)

    let newEmbed = EmbedBuilder.from(embed);
    for (const player of players) {
        newEmbed.addFields({name: player.name, value: player.status, inline: true});
    }
    for (const sub of subs) {
        newEmbed.addFields({name: sub.name, value: sub.status, inline: true});
    }
    return newEmbed;
}

function updateStatusForPlayer(attendanceData, player, status) {

}

async function getDefaultAttendance(interaction) {
    const guild = interaction.client.guilds.cache.get(process.env.GUILD_ID);
    let allMembers = await guild.members.fetch();
    const allWeeklyPlayers = [];
    const allSubs = [];
    allMembers.map(member => {
        if (member.nickname === null) {
            member.nickname = member.user.username;
        }
        if (member.roles.cache.some(role => role.id === process.env.MEMBER_ROLE_ID)) {
            allWeeklyPlayers.push({id: member.id, name: member.nickname, status: "Not Responded"});
        } else if (member.roles.cache.some(role => role.id === process.env.SUB_ROLE_ID)) {
            allSubs.push({id: member.id, name: member.nickname+" [SUB]", status: "Unknown"});
        }
    });

    return {
        players: allWeeklyPlayers,
        subs: allSubs,
    }

}

module.exports = {
    startAttendanceMessage,
    getDefaultAttendance,
    turnAttendanceIntoEmbed,
}