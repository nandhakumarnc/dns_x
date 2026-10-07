/**
 * config/logger.js
 * Pino logger singleton. Import and use throughout the application.
 * In development it pretty-prints; in production it emits JSON.
 */

import pino from 'pino'
import { LOG_LEVEL, IS_PRODUCTION } from './env.js'

const transport = IS_PRODUCTION
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    }

const logger = pino({ level: LOG_LEVEL }, transport ? pino.transport(transport) : undefined)

export default logger
