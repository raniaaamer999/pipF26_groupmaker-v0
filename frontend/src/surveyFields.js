// Schema from Survey PRD.md, plus `name` from the roster (required by the PRD).
export const SURVEY_FIELDS = [
  {
    column: 'name',
    question: 'What is your name?',
    type: 'name',
    optional: false,
  },
  {
    column: 'school_year',
    question: 'What year are you?',
    type: 'dropdown',
    values: ['First-year', 'Sophomore', 'Junior', 'Senior', 'Other'],
    optional: false,
  },
  {
    column: 'working_style',
    question: 'Describe your working style in 1–2 sentences',
    type: 'text',
    optional: false,
  },
]
