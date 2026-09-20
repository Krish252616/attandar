import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Timer from './Timer'

export default function MemberPage({ token }) {
  const [step, setStep] = useState('select-member') // select-member or timer
  const [selectedMember, setSelectedMember] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timerActive, setTimerActive] = useState(false)
  const [entryTime, setEntryTime] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      setMembers(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching members:', err)
      setLoading(false)
    }
  }

  const handleSelectMember = (member) => {
    setSelectedMember(member)
    setStep('timer')
  }

  const handleEntry = async () => {
    const now = new Date()
    setEntryTime(now)
    setTimerActive(true)

    // Log entry to database
    try {
      await supabase.from('attendance').insert({
        user_id: selectedMember.id,
        token,
        entry_time: now.toISOString(),
        log_date: now.toISOString().split('T')[0],
      })
    } catch (err) {
      console.error('Error logging entry:', err)
    }
  }

  const handleExit = async () => {
    const exitTime = new Date()
    const durationSeconds = Math.floor((exitTime - entryTime) / 1000)

    setTimerActive(false)

    // Update database with exit time and duration
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          exit_time: exitTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('user_id', selectedMember.id)
        .eq('entry_time', entryTime.toISOString())

      if (error) throw error

      // Show success message
      const hours = Math.floor(durationSeconds / 3600)
      const minutes = Math.floor((durationSeconds % 3600) / 60)
      const seconds = durationSeconds % 60

      alert(
        `Time logged: ${hours}h ${minutes}m ${seconds}s\n\nThank you!`
      )

      // Reset
      setTimeout(() => {
        setStep('select-member')
        setSelectedMember(null)
        setEntryTime(null)
      }, 2000)
    } catch (err) {
      console.error('Error logging exit:', err)
      alert('Error saving. Please try again.')
    }
  }

  if (loading) {
    return <div className="loading">Loading members...</div>
  }

  if (step === 'select-member') {
    return (
      <div className="container">
        <div className="content">
          <h1>Team Arogya Attendance</h1>
          <p className="subtitle">Select your name to start</p>

          <div className="members-grid">
            {members.map((member) => (
              <button
                key={member.id}
                className="member-button"
                onClick={() => handleSelectMember(member)}
              >
                {member.name}
              </button>
            ))}
          </div>

          <div className="info">
            <p>Token expires in 24 hours</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'timer') {
    return (
      <div className="container">
        <div className="content">
          <h1>{selectedMember.name}</h1>
          <p className="date">{new Date().toLocaleDateString()}</p>

          <Timer
            running={timerActive}
            startTime={entryTime}
          />

          <div className="button-group">
            {!timerActive ? (
              <button
                className="btn btn-entry"
                onClick={handleEntry}
              >
                ENTRY
              </button>
            ) : (
              <button
                className="btn btn-exit"
                onClick={handleExit}
              >
                EXIT
              </button>
            )}
          </div>

          <button
            className="btn btn-back"
            onClick={() => {
              setStep('select-member')
              setSelectedMember(null)
              setTimerActive(false)
              setEntryTime(null)
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }
}
