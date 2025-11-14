const { Logtail } = require('@logtail/node');

/**
 * Centralized Logger for the Discord bot
 * Uses Logtail for remote logging and console for local development
 */
class Logger {
	constructor() {
		this.logtail = null;
		this.isEnabled = false;

		// Initialize Logtail if token and host are provided
		const sourceToken = process.env.LOGTAIL_SOURCE_TOKEN;
		const ingestingHost = process.env.LOGTAIL_INGESTING_HOST;

		if (sourceToken && ingestingHost) {
			try {
				this.logtail = new Logtail(sourceToken, {
					endpoint: `https://${ingestingHost}`,
				});
				this.isEnabled = true;
				console.log('[Logger] Logtail initialized successfully');
			} catch (error) {
				console.error('[Logger] Failed to initialize Logtail:', error);
			}
		} else {
			if (!sourceToken) {
				console.log('[Logger] LOGTAIL_SOURCE_TOKEN not found - logging to console only');
			}
			if (!ingestingHost) {
				console.log('[Logger] LOGTAIL_INGESTING_HOST not found - logging to console only');
			}
		}
	}

	/**
	 * Log an informational message
	 * @param {string} message - The message to log
	 * @param {object} context - Additional context data
	 */
	async info(message, context = {}) {
		console.log(`[INFO] ${message}`, context);
		if (this.isEnabled && this.logtail) {
			await this.logtail.info(message, context);
		}
	}

	/**
	 * Log a warning message
	 * @param {string} message - The message to log
	 * @param {object} context - Additional context data
	 */
	async warn(message, context = {}) {
		console.warn(`[WARN] ${message}`, context);
		if (this.isEnabled && this.logtail) {
			await this.logtail.warn(message, context);
		}
	}

	/**
	 * Log an error message
	 * @param {string} message - The message to log
	 * @param {Error|object} error - Error object or additional context
	 */
	async error(message, error = {}) {
		console.error(`[ERROR] ${message}`, error);
		if (this.isEnabled && this.logtail) {
			const context = error instanceof Error ? {
				error: error.message,
				stack: error.stack,
				name: error.name,
			} : error;
			await this.logtail.error(message, context);
		}
	}

	/**
	 * Log a debug message
	 * @param {string} message - The message to log
	 * @param {object} context - Additional context data
	 */
	async debug(message, context = {}) {
		console.debug(`[DEBUG] ${message}`, context);
		if (this.isEnabled && this.logtail) {
			await this.logtail.debug(message, context);
		}
	}

	/**
	 * Log a command execution
	 * @param {string} commandName - Name of the command
	 * @param {object} member - Guild member who executed the command
	 * @param {object} guild - Guild where command was executed
	 */
	async logCommand(commandName, member, guild) {
		const context = {
			command: commandName,
			userId: member?.user?.id || member?.id,
			username: member?.user?.username,
			nickname: member?.nickname || member?.user?.username,
			guildId: guild?.id,
			guildName: guild?.name,
		};
		const displayName = member?.nickname ? `${member.user.username} (${member.nickname})` : member?.user?.username;
		await this.info(`[COMMAND] ${displayName} executed command: /${commandName}`, context);
	}

	/**
	 * Log a button interaction
	 * @param {string} buttonId - Button custom ID
	 * @param {object} member - Guild member who clicked the button
	 * @param {object} guild - Guild where button was clicked
	 */
	async logButtonClick(buttonId, member, guild) {
		const context = {
			buttonId,
			userId: member?.user?.id || member?.id,
			username: member?.user?.username,
			nickname: member?.nickname || member?.user?.username,
			guildId: guild?.id,
			guildName: guild?.name,
		};
		const displayName = member?.nickname ? `${member.user.username} (${member.nickname})` : member?.user?.username;
		await this.info(`[BUTTON] ${displayName} clicked: ${buttonId}`, context);
	}

	/**
	 * Flush any pending logs to Logtail
	 * Call this before shutting down the application
	 */
	async flush() {
		if (this.isEnabled && this.logtail) {
			await this.logtail.flush();
		}
	}
}

// Create a singleton instance
const logger = new Logger();

module.exports = logger;
