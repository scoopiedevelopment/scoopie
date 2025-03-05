import os from 'os'
import config from '../config/config'
import jwt from 'jsonwebtoken';

export default {
    getSystemHealth: () => {
        return {
            cpuUsage: os.loadavg(),
            totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`
        }
    },
    getApplicationHealth: () => {
        return {
            environment: config.ENV,
            uptime: `${process.uptime().toFixed(2)} Second`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
            }
        }
    },
    generateToken: (payload: object, secret: string, expiry: number) => {
        return jwt.sign(payload, secret, {
            expiresIn: expiry
        });
    },
    verifyToken: (token: string, secret: string) => {
        return jwt.verify(token, secret);
    }
}