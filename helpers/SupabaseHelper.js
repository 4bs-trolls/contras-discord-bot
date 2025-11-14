const { createClient } = require('@supabase/supabase-js');
const logger = require('./Logger');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);
const scheduleTableName = process.env.SCHEDULE_TABLE;
const attendanceTableName = process.env.ATTENDANCE_TABLE;
const season = process.env.SEASON;


async function getUpcomingMatch() {
	const { data: upcomingMatches } = await supabase
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
		logger.error('Unable to update attendance', { error: error.message, attendanceData });
		return `Unable to update attendance: ${error}`;
	} else {
		return data;
	}
}

async function getAttendance(week, seasonParam) {
	const { data: attendance, error } = await supabase
		.from(attendanceTableName)
		.select('player_id, name, status, role_ids')
		.eq('week', week)
		.eq('season', seasonParam);
	if (error) {
		logger.error('Unable to retrieve attendance', { error: error.message, week, season: seasonParam });
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

async function getAttendanceForPlayer(player_id, week, seasonParam) {
	const { data: attendance, error } = await supabase
		.from(attendanceTableName)
		.select('player_id, name, status, role_ids')
		.eq('player_id', player_id)
		.eq('week', week)
		.eq('season', seasonParam);
	if (error) {
		logger.error('Unable to retrieve attendance for player', { error: error.message, player_id, week, season: seasonParam });
		return `Unable to retrieve attendance: ${error}`;
	} else {
		return {
			player_id: attendance[0].player_id,
			name: attendance[0].name,
			status: attendance[0].status,
		};
	}
}

async function getAverageScoreForMachine(machineId, seasonId) {
	let query = supabase
		.from('league_player_stats')
		.select('score, machine_id, league_machines(name)')
		.eq('machine_id', machineId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		query = query.eq('season_id', seasonId);
	}

	const { data, error } = await query;

	if (error || !data || data.length === 0) {
		return null;
	}

	const total = data.reduce((sum, record) => sum + Number(record.score), 0);
	const average = Math.round(total / data.length);

	return {
		machine: data[0].league_machines.name,
		machineId: machineId,
		averageScore: average,
		gamesPlayed: data.length,
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
	};
}

async function getPlayerMachineAverage(playerId, machineId, seasonId) {
	let query = supabase
		.from('league_player_stats')
		.select('score, player_name, league_machines(name)')
		.eq('player_id', playerId)
		.eq('machine_id', machineId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		query = query.eq('season_id', seasonId);
	}

	const { data, error } = await query;

	if (error || !data || data.length === 0) {
		return null;
	}

	const total = data.reduce((sum, record) => sum + Number(record.score), 0);
	const average = Math.round(total / data.length);

	return {
		playerName: data[0].player_name,
		playerId: playerId,
		machine: data[0].league_machines.name,
		machineId: machineId,
		averageScore: average,
		gamesPlayed: data.length,
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
	};
}

async function getTeamPerformance(teamId, seasonId) {
	let query = supabase
		.from('league_player_stats')
		.select('points, week, match_detail_id, team_id')
		.eq('team_id', teamId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		query = query.eq('season_id', seasonId);
	}

	const { data, error } = await query;

	if (error || !data || data.length === 0) {
		return null;
	}

	// Group by match and calculate team points
	const matchStats = {};
	data.forEach(record => {
		if (!matchStats[record.match_detail_id]) {
			matchStats[record.match_detail_id] = {
				week: record.week,
				points: 0,
			};
		}
		matchStats[record.match_detail_id].points += parseFloat(record.points) || 0;
	});

	const matches = Object.values(matchStats);
	const totalPoints = matches.reduce((sum, match) => sum + match.points, 0);
	const averagePoints = matches.length > 0 ? totalPoints / matches.length : 0;

	return {
		teamId: teamId,
		matchesPlayed: matches.length,
		totalPoints: Math.round(totalPoints * 10) / 10,
		averagePointsPerMatch: Math.round(averagePoints * 10) / 10,
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
	};
}

async function getPlayerHistory(playerId, seasonId) {
	let query = supabase
		.from('league_player_stats')
		.select(`
			score,
			points,
			week,
			player_name,
			league_machines(name),
			league_teams!league_player_stats_opponent_id_fkey(name)
		`)
		.eq('player_id', playerId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		query = query.eq('season_id', seasonId);
	}

	query = query.order('week', { ascending: false });

	const { data, error } = await query;

	if (error || !data || data.length === 0) {
		return null;
	}

	return {
		playerName: data[0].player_name,
		playerId: playerId,
		games: data.map(record => ({
			machine: record.league_machines?.name || 'Unknown',
			score: record.score,
			points: record.points,
			opponent: record.league_teams?.name || 'Unknown',
			week: record.week,
		})),
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
	};
}

async function getMachineLeaderboard(machineId, seasonId, limit = 10) {
	let query = supabase
		.from('league_player_stats')
		.select('player_name, score, week, league_machines(name)')
		.eq('machine_id', machineId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		query = query.eq('season_id', seasonId);
	}

	query = query.order('score', { ascending: false }).limit(limit);

	const { data, error } = await query;

	if (error || !data || data.length === 0) {
		return null;
	}

	return {
		machine: data[0].league_machines.name,
		machineId: machineId,
		scores: data.map(record => ({
			playerName: record.player_name,
			score: record.score,
			week: record.week,
		})),
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
	};
}

async function getRecentScores(machineId, limit = 10) {
	const { data, error } = await supabase
		.from('league_player_stats')
		.select(`
			player_name,
			score,
			week,
			season_id,
			league_machines(name),
			league_matches(date)
		`)
		.eq('machine_id', machineId)
		.order('season_id', { ascending: false })
		.order('week', { ascending: false })
		.limit(limit * 3);

	if (error || !data || data.length === 0) {
		return null;
	}

	// Sort by actual match date if available, then take the limit
	const sorted = data
		.filter(record => record.league_matches?.date)
		.sort((a, b) => {
			const dateA = new Date(a.league_matches.date);
			const dateB = new Date(b.league_matches.date);
			// Most recent first
			return dateB - dateA;
		})
		.slice(0, limit);

	return sorted.map(record => ({
		playerName: record.player_name,
		machine: record.league_machines?.name || machineId,
		score: record.score,
		week: record.week,
		seasonId: record.season_id,
		date: record.league_matches?.date,
	}));
}

async function getTopPickedMachines(teamId, seasonId) {
	// Get all matches where the team was home team (they pick machines)
	let matchQuery = supabase
		.from('league_matches')
		.select('id')
		.eq('home_team_id', teamId);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		matchQuery = matchQuery.eq('season_id', seasonId);
	}

	const { data: matchData, error: matchError } = await matchQuery;

	if (matchError || !matchData || matchData.length === 0) {
		return null;
	}

	const matchIds = matchData.map(match => match.id);

	// Get all player stats for those matches
	let statsQuery = supabase
		.from('league_player_stats')
		.select('machine_id, league_machines(name)')
		.in('match_detail_id', matchIds);

	// If seasonId is 0, get all-time stats; otherwise filter by season
	if (seasonId !== 0) {
		statsQuery = statsQuery.eq('season_id', seasonId);
	}

	const { data: playerStats, error } = await statsQuery;

	if (error || !playerStats || playerStats.length === 0) {
		return null;
	}

	// Count machine occurrences
	const machineCount = {};
	playerStats.forEach(record => {
		const machineId = record.machine_id;
		if (!machineCount[machineId]) {
			machineCount[machineId] = {
				name: record.league_machines?.name || 'Unknown',
				count: 0,
			};
		}
		machineCount[machineId].count += 1;
	});

	return {
		teamId: teamId,
		seasonId: seasonId === 0 ? 'All-Time' : seasonId,
		machines: Object.entries(machineCount)
			.map(([machineId, machineData]) => ({
				machineId,
				machineName: machineData.name,
				pickCount: machineData.count,
			}))
			.sort((a, b) => b.pickCount - a.pickCount),
	};
}

async function searchPlayers(searchTerm) {
	const { data, error } = await supabase
		.from('league_players')
		.select('id, name, ipr')
		.ilike('name', `%${searchTerm}%`)
		.limit(10);

	if (error) {
		logger.error('Error searching players', { error: error.message, searchTerm });
		return null;
	}

	return data;
}

async function searchMachines(searchTerm) {
	const { data, error } = await supabase
		.from('league_machines')
		.select('id, name')
		.ilike('name', `%${searchTerm}%`)
		.limit(10);

	if (error) {
		logger.error('Error searching machines', { error: error.message, searchTerm });
		return null;
	}

	return data;
}

async function searchTeams(searchTerm) {
	const { data, error } = await supabase
		.from('league_teams')
		.select('id, name')
		.ilike('name', `%${searchTerm}%`)
		.limit(10);

	if (error) {
		logger.error('Error searching teams', { error: error.message, searchTerm });
		return null;
	}

	return data;
}

module.exports = {
	getUpcomingMatch,
	updateAttendance,
	getAttendance,
	getAttendanceForPlayer,
	getAverageScoreForMachine,
	getPlayerMachineAverage,
	getTeamPerformance,
	getPlayerHistory,
	getMachineLeaderboard,
	getRecentScores,
	getTopPickedMachines,
	searchPlayers,
	searchMachines,
	searchTeams,
};