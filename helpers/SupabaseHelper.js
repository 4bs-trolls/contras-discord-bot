const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nwpgecjxpwvdwoczvuwr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);
const scheduleTableName = process.env.SCHEDULE_TABLE;
const attendanceTableName = process.env.ATTENDANCE_TABLE;
const season = process.env.SEASON;


async function getUpcomingMatch() {
	let { data: upcomingMatches, error } = await supabase
		.from(scheduleTableName)
		.select('week, date, venue, venues(name), opponent, teams(name)')
		.eq('season', season)
		.gte('date', new Date().toDateString())
		.order('date', { ascending: true })
		.limit(1);

	if (!upcomingMatches || upcomingMatches.length === 0) {
		return 'There are no upcoming matches';
	} else {
		const week = upcomingMatches[0].week;
		const date = new Date(upcomingMatches[0].date).toLocaleString('en-US', {
			timeZone: 'UTC',
			month: 'long',
			day: 'numeric',
		});
		const venue = upcomingMatches[0].venues.name;
		const team = upcomingMatches[0].teams.name;
		return { week, date, venue, team };
	}
}

async function updateAttendance(attendanceData) {
	const { data, error } = await supabase
		.from(attendanceTableName)
		.upsert(attendanceData);
	if (error) {
		return `Unable to update attendance: ${error}`;
	} else {
		return data;
	}
}

async function getAttendance(week, season) {
	let { data: attendance, error } = await supabase
		.from(attendanceTableName)
		.select('player_id, name, status, role_ids')
		.eq('week', week)
		.eq('season', season);
	if (error) {
		return `Unable to retrieve attendance: ${error}`;
	} else {
		return attendance.map((player) => {
			return {
				player_id: player.player_id,
				name: player.name,
				status: player.status,
			};
		});
	}
}

async function getAttendanceForPlayer(player_id, week, season) {
	let { data: attendance, error } = await supabase
		.from(attendanceTableName)
		.select('player_id, name, status, role_ids')
		.eq('player_id', player_id)
		.eq('week', week)
		.eq('season', season);
	if (error) {
		return `Unable to retrieve attendance: ${error}`;
	} else {
		return {
			player_id: attendance[0].player_id,
			name: attendance[0].name,
			status: attendance[0].status,
		};
	}
}

module.exports = {
	getUpcomingMatch,
	updateAttendance,
	getAttendance,
	getAttendanceForPlayer,
};