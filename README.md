# contra-discord-bot

A Discord bot for the [Coindexter Contras](https://www.mondaynightpinball.com/teams/CDC) team in the [Seattle Monday Night Pinball](https://www.mondaynightpinball.com/) league.

Captain Commands:  
`/set-week` is used to set the upcoming match's Date, Venue, and Team  
`/rollcall` will send an `@everyone` ping in the annoucements channel that will ask for attendance with buttons for yes/no. As users reply, the embed in the original message will update with whether users are in or if they need a sub. 
`/restart` will kill the service. As long as the bot is run using PM2, the bot will restart automatically making this an easy command to restart the bot

User Commands:  
`/next-match` will retrieve the Date, Venue, and Team for the upcoming match  
`/links` returns a set of helpful links 
