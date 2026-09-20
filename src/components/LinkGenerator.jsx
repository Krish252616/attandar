import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LinkGenerator({ baseUrl }) {
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  const generateLink = async () => {
    setLoading(true)
    setGeneratedLink('')

    try {
      // Create unique token
      const today = new Date().toISOString().split('T')[0]
      const randomPart = Math.random().toString(36).substring(2, 15)
      const token = `${today}_${randomPart}`

      // Expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // Insert into database
      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          token,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()

      if (error) throw error

      const link = `${baseUrl}?token=${token}`
      setGeneratedLink(link)
      setCopied(false)
    } catch (err) {
      console.error('Error generating link:', err)
      alert('Failed to generate link. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="link-generator">
      <h2>Generate Daily Access Link</h2>
      <p className="subtitle">Members will use this link to mark attendance</p>

      <button
        className="btn btn-primary"
        onClick={generateLink}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate New Link'}
      </button>

      {generatedLink && (
        <div className="generated-link">
          <div className="link-box">
            <code>{generatedLink}</code>
            <button
              className="btn btn-copy"
              onClick={copyToClipboard}
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>
          <p className="link-info">
            Valid for 24 hours. Share this link with team members.
          </p>
        </div>
      )}
    </div>
  )
}
