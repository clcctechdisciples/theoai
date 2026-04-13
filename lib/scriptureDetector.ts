// Regex looking for typical Bible book references (e.g., John 3:16, 1 Corinthians 13:4)
const BIBLE_REGEX = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\b/gi

export function detectScripture(transcript: string): string | null {
  const matches = [...transcript.matchAll(BIBLE_REGEX)]
  if (matches.length > 0) {
    // Return the last detected scripture to display
    return matches[matches.length - 1][0]
  }
  return null
}
