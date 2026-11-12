const LITHUANIAN_ENDINGS = [
  'iomis',
  'omis',
  'ėmis',
  'iams',
  'iems',
  'ams',
  'ems',
  'iuose',
  'uose',
  'yse',
  'ose',
  'ėse',
  'ese',
  'iais',
  'ais',
  'eis',
  'ius',
  'ies',
  'ių',
  'os',
  'ės',
  'as',
  'is',
  'ys',
  'us',
  'ui',
  'ai',
  'ei',
  'oi',
  'uo',
  'ą',
  'ę',
  'į',
  'ų',
  'ė',
  'a',
  'e',
  'i',
  'o',
  'u',
]

const MIN_STEM_LENGTH = 4

function normalizeText(value) {
  return (value || '').toLocaleLowerCase('lt-LT')
}

function splitWords(value) {
  return normalizeText(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function stemLithuanianWord(word) {
  for (const ending of LITHUANIAN_ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= MIN_STEM_LENGTH) {
      return word.slice(0, -ending.length)
    }
  }

  return word
}

function wordMatchesQuery(queryWord, textWord) {
  if (textWord.includes(queryWord)) {
    return true
  }

  const queryStem = stemLithuanianWord(queryWord)
  const textStem = stemLithuanianWord(textWord)

  if (queryStem.length < MIN_STEM_LENGTH) {
    return false
  }

  return textStem === queryStem || textStem.startsWith(queryStem)
}

export function taskMatchesSearch(task, query) {
  const normalizedQuery = normalizeText(query).trim()
  if (!normalizedQuery) {
    return true
  }

  const title = task.title || ''
  const courseName = task.courses?.name || ''
  const combined = `${title} ${courseName}`
  const haystack = normalizeText(combined)

  if (haystack.includes(normalizedQuery)) {
    return true
  }

  const queryWords = splitWords(normalizedQuery)
  const textWords = splitWords(combined)

  return queryWords.every((queryWord) =>
    textWords.some((textWord) => wordMatchesQuery(queryWord, textWord)),
  )
}
