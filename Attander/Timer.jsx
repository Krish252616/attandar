import { useState, useEffect } from 'react'

export default function Timer({ running, startTime }) {
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    if (!running || !startTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now - startTime) / 1000)

      const hours = Math.floor(diff / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = diff % 60

      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [running, startTime])

  useEffect(() => {
    if (!running) {
      setElapsed('00:00:00')
    }
  }, [running])

  return (
    <div className={`timer ${running ? 'active' : ''}`}>
      <div className="timer-display">{elapsed}</div>
      {running && <div className="timer-indicator">● Recording</div>}
    </div>
  )
}
