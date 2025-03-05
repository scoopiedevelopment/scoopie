import util from 'util'
import 'winston-mongodb'
import { createLogger, format, transports } from 'winston'
import { ConsoleTransportInstance, FileTransportInstance } from 'winston/lib/winston/transports'
import config from '../config/config'
import { EApplicationEnvironment } from '../constant/application'
import path from 'path'
import { red, blue, yellow, green, magenta } from 'colorette'
import * as sourceMapSupport from 'source-map-support'
import { MongoDBTransportInstance } from 'winston-mongodb'

// Linking Trace Support
sourceMapSupport.install()

type TransportType = ConsoleTransportInstance | FileTransportInstance | MongoDBTransportInstance

const colorizeLevel = (level: string): string => {
    switch (level) {
        case 'ERROR':
            return red(level)
        case 'INFO':
            return blue(level)
        case 'WARN':
            return yellow(level)
        default:
            return level
    }
}

interface TransformableInfo {
    level: string
    message: unknown
    [key: string]: unknown
}

const consoleLogFormat = format.printf((info: TransformableInfo) => {
    const { level, message, timestamp, meta = {} } = info

    const customLevel = colorizeLevel(level.toUpperCase())
    const customTimestamp = green(timestamp as string)
    const customMessage = message as string

    const customMeta = util.inspect(meta, {
        showHidden: false,
        depth: null,
        colors: true
    })

    return `${customLevel} [${customTimestamp}] ${customMessage}\n${magenta('META')} ${customMeta}\n`
})

const consoleTransport = (): TransportType[] => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleLogFormat)
            })
        ]
    }

    return []
}

const fileLogFormat = format.printf((info: TransformableInfo) => {
    const { level, message, timestamp, meta = {} } = info

    const logMeta: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                trace: value.stack || '',
            }
        } else {
            logMeta[key] = value
        }
    }

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta
    }

    return JSON.stringify(logData, null, 4)
})

const FileTransport = (): TransportType[] => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(format.timestamp(), fileLogFormat)
        })
    ]
}

const MongodbTransport = (): TransportType[] => {
    return [
        new transports.MongoDB({
            level: 'info',
            db: config.DATABASE_URL as string,
            metaKey: 'meta',
            expireAfterSeconds: 3600 * 24 * 30,
            collection: 'application-logs'
        })
    ]
}

export default createLogger({
    defaultMeta: {
        meta: {}
    },
    transports: [...FileTransport(), ...MongodbTransport(), ...consoleTransport()] as TransportType[]
})