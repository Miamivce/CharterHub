import React from 'react'

interface PasswordStrengthMeterProps {
  password: string
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (): { score: number; text: string; color: string } => {
    if (!password) {
      return { score: 0, text: 'Weak', color: 'bg-red-400' }
    }

    let score = 0

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1 // Has uppercase
    if (/[a-z]/.test(password)) score += 1 // Has lowercase
    if (/[0-9]/.test(password)) score += 1 // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special char

    // Normalize to 0-4 range
    score = Math.min(4, Math.floor(score / 1.5))

    const strengthMap = [
      { text: 'Weak', color: 'bg-red-400' },
      { text: 'Fair', color: 'bg-orange-400' },
      { text: 'Good', color: 'bg-yellow-400' },
      { text: 'Strong', color: 'bg-green-400' },
      { text: 'Very Strong', color: 'bg-green-600' },
    ]

    return {
      score,
      text: strengthMap[score].text,
      color: strengthMap[score].color,
    }
  }

  const strength = calculateStrength()

  return (
    <div className="mt-1">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-gray-500">Password Strength:</div>
        <div
          className="text-xs font-medium"
          style={{ color: strength.color.replace('bg-', 'text-') }}
        >
          {strength.text}
        </div>
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${(strength.score / 4) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}

export default PasswordStrengthMeter
