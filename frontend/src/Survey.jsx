import { useState } from 'react'
import { SURVEY_FIELDS } from './surveyFields.js'

function emptyAnswers() {
  const answers = {}
  for (const field of SURVEY_FIELDS) {
    answers[field.column] = field.type === 'multi-select' ? [] : ''
  }
  return answers
}

function fieldIsEmpty(field, value) {
  if (field.type === 'multi-select') return !value || value.length === 0
  return String(value ?? '').trim() === ''
}

export default function Survey({ students, onBack }) {
  const [answers, setAnswers] = useState(emptyAnswers)
  const [missing, setMissing] = useState([])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function setField(column, value) {
    setAnswers((prev) => ({ ...prev, [column]: value }))
  }

  function toggleMulti(column, option) {
    setAnswers((prev) => {
      const current = prev[column] || []
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      return { ...prev, [column]: next }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const missingFields = SURVEY_FIELDS.filter(
      (field) => !field.optional && fieldIsEmpty(field, answers[field.column]),
    )
    if (missingFields.length > 0) {
      setMissing(missingFields.map((f) => f.column))
      setError(null)
      return
    }

    setMissing([])
    setError(null)
    setSubmitting(true)
    try {
      const payload = {}
      for (const field of SURVEY_FIELDS) {
        const value = answers[field.column]
        payload[field.column] =
          field.type === 'multi-select' ? value.join('; ') : String(value).trim()
      }
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Backend responded ${res.status}`)
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <section className="survey">
        <h2>Thanks — your response was saved.</h2>
        <p>You can close this page or submit another response.</p>
        <div className="survey-actions">
          <button
            type="button"
            className="randomize"
            onClick={() => {
              setAnswers(emptyAnswers())
              setDone(false)
              setError(null)
              setMissing([])
            }}
          >
            Submit another response
          </button>
          <button type="button" className="nav-link" onClick={onBack}>
            Back to groups
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="survey">
      <h2>Student survey</h2>
      <p className="subtitle">All fields are required unless marked optional.</p>

      <form onSubmit={handleSubmit} noValidate>
        {SURVEY_FIELDS.map((field) => {
          const isMissing = missing.includes(field.column)
          return (
            <div
              className={`survey-field${isMissing ? ' is-missing' : ''}`}
              key={field.column}
            >
              <label htmlFor={field.column}>
                {field.question}
                {field.optional ? ' (optional)' : ''}
              </label>
              {isMissing ? (
                <p className="field-error">This field is required.</p>
              ) : null}
              <FieldInput
                field={field}
                students={students}
                value={answers[field.column]}
                onChange={setField}
                onToggleMulti={toggleMulti}
              />
            </div>
          )
        })}

        {missing.length > 0 ? (
          <p className="error">
            Please fill in:{' '}
            {missing
              .map((col) => SURVEY_FIELDS.find((f) => f.column === col)?.question)
              .join('; ')}
          </p>
        ) : null}
        {error ? <p className="error">Could not save: {error}</p> : null}

        <div className="survey-actions">
          <button className="randomize" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  )
}

function FieldInput({ field, students, value, onChange, onToggleMulti }) {
  if (field.type === 'name') {
    return (
      <select
        id={field.column}
        value={value}
        onChange={(e) => onChange(field.column, e.target.value)}
      >
        <option value="">Select your name</option>
        {students.map((s) => (
          <option key={s.id} value={s.name}>
            {s.name}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'dropdown') {
    return (
      <select
        id={field.column}
        value={value}
        onChange={(e) => onChange(field.column, e.target.value)}
      >
        <option value="">Select one</option>
        {field.values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'scale') {
    return (
      <div className="scale" id={field.column}>
        {(field.values || [1, 2, 3, 4, 5]).map((n) => (
          <label key={n} className="scale-option">
            <input
              type="radio"
              name={field.column}
              value={n}
              checked={String(value) === String(n)}
              onChange={(e) => onChange(field.column, e.target.value)}
            />
            {n}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'multi-select') {
    return (
      <div className="multi-select" id={field.column}>
        {field.values.map((option) => (
          <label key={option} className="check-option">
            <input
              type="checkbox"
              checked={(value || []).includes(option)}
              onChange={() => onToggleMulti(field.column, option)}
            />
            {option}
          </label>
        ))}
      </div>
    )
  }

  return (
    <textarea
      id={field.column}
      rows={3}
      value={value}
      onChange={(e) => onChange(field.column, e.target.value)}
    />
  )
}
