// src/utils/Logger.ts

interface LogEntry {
    timestamp: string
    level: 'debug' | 'info' | 'warn' | 'error'
    message: string
    data?: any
  }
  
  class LoggerService {
    private logs: LogEntry[] = []
    private maxLogs = 1000
  
    private createEntry(level: LogEntry['level'], message: string, data?: any): LogEntry {
      return {
        timestamp: new Date().toISOString().slice(11, 23), // HH:mm:ss.SSS
        level,
        message,
        data
      }
    }
  
    private addLog(entry: LogEntry) {
      this.logs.push(entry)
      
      // Keep only recent logs to prevent memory issues
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs)
      }
  
      // Also log to console for immediate debugging
      const logFunc = console[entry.level] || console.log
      if (entry.data) {
        logFunc(`[${entry.timestamp}] ${entry.message}`, entry.data)
      } else {
        logFunc(`[${entry.timestamp}] ${entry.message}`)
      }
    }
  
    debug(message: string, data?: any) {
      this.addLog(this.createEntry('debug', message, data))
    }
  
    info(message: string, data?: any) {
      this.addLog(this.createEntry('info', message, data))
    }
  
    warn(message: string, data?: any) {
      this.addLog(this.createEntry('warn', message, data))
    }
  
    error(message: string, data?: any) {
      this.addLog(this.createEntry('error', message, data))
    }
  
    getLogs(): LogEntry[] {
      return [...this.logs]
    }
  
    clearLogs() {
      this.logs = []
      console.clear()
    }
  
    getRecentErrors(limit = 10): LogEntry[] {
      return this.logs
        .filter(log => log.level === 'error')
        .slice(-limit)
    }
  }
  
  // Export singleton instance
  export const Logger = new LoggerService()
  
  // Export types for external use
  export type { LogEntry }