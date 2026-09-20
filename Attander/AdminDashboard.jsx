import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LinkGenerator from './LinkGenerator'

export default function AdminDashboard({ onLogout }) {
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [weeklyStats, setWeeklyStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLinkGenerator, setShowLinkGenerator] = useState(false)
  const baseUrl = window.location.origin

  useEffect(() => {
    fetchData()
    // Real-time subscription for attendance
    const subscription = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all members
      const { data: membersData } = await supabase.from('users').select('*')
      setMembers(membersData || [])

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('log_date', today)

      setAttendance(attendanceData || [])

      // Calculate weekly stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const { data: weeklyData } = await supabase
        .from('attendance')
        .select('*')
        .gte('log_date', weekAgo)

      calculateWeeklyStats(membersData, weeklyData)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoading(false)
    }
  }

  const calculateWeeklyStats = (members, weeklyAttendance) => {
    const stats = members.map((member) => {
      const memberAttendance = weeklyAttendance.filter(
        (a) => a.user_id === member.id
      )
      const totalSeconds = memberAttendance.reduce(
        (sum, a) => sum + (a.duration_seconds || 0),
        0
      )
      const hours = (totalSeconds / 3600).toFixed(1)

      return {
        id: member.id,
        name: member.name,
        hours: parseFloat(hours),
        status: parseFloat(hours) >= 24 ? 'done' : parseFloat(hours) >= 10 ? 'close' : 'behind',
      }
    })
    setWeeklyStats(stats)
  }

  const getTodayStatus = (memberId) => {
    const memberAttendance = attendance.filter((a) => a.user_id === memberId)
    const inOffice = memberAttendance.some((a) => a.entry_time && !a.exit_time)
    const hasLogged = memberAttendance.length > 0

    if (inOffice) return '⏱ In Office'
    if (hasLogged) return '✓ Logged'
    return '✗ Off'
  }

  const getTodayHours = (memberId) => {
    const memberAttendance = attendance.filter((a) => a.user_id === memberId)
    const totalSeconds = memberAttendance.reduce(
      (sum, a) => sum + (a.duration_seconds || 0),
      0
    )
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    return hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : '-'
  }

  const getEntryTime = (memberId) => {
    const memberAttendance = attendance.filter((a) => a.user_id === memberId)
    if (memberAttendance.length === 0) return '-'

    const entryTime = new Date(memberAttendance[0].entry_time)
    return entryTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="admin-content">
        {/* Link Generator Section */}
        <div className="section">
          <button
            className="btn btn-primary"
            onClick={() => setShowLinkGenerator(!showLinkGenerator)}
          >
            {showLinkGenerator ? 'Hide' : 'Generate Daily Link'}
          </button>

          {showLinkGenerator && <LinkGenerator baseUrl={baseUrl} />}
        </div>

        {/* Today's Status */}
        <div className="section">
          <h2>Today's Status - {new Date().toLocaleDateString()}</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Entry Time</th>
                  <th>Hours Today</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{getTodayStatus(member.id)}</td>
                    <td>{getEntryTime(member.id)}</td>
                    <td>{getTodayHours(member.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="section">
          <h2>Weekly Summary (Last 7 Days)</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Hours</th>
                  <th>Target</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {weeklyStats.map((stat) => (
                  <tr key={stat.id} className={`status-${stat.status}`}>
                    <td>{stat.name}</td>
                    <td>{stat.hours}h</td>
                    <td>24h</td>
                    <td>
                      {stat.status === 'done' && '✓ Done'}
                      {stat.status === 'close' && '⚠ Close'}
                      {stat.status === 'behind' && '✗ Behind'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="section info-section">
          <p>Dashboard updates in real-time as members log in/out</p>
          <p>Generate a new link daily for members to access</p>
        </div>
      </div>
    </div>
  )
}
