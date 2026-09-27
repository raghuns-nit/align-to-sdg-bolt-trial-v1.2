const STOP_WORDS = new Set([
  'a','an','the','and','or','but','if','then','else','when','where','why','how','all','any','both','each',
  'few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very',
  'can','will','just','should','now','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','would','could','may','might','must','shall','of','to','in','on','at','for','with','by',
  'from','as','this','that','these','those','i','you','he','she','it','we','they','about','into','through',
  'during','before','after','above','below','up','down','out','off','over','under','again','further',
])

class TFIDFVectorizer {
  private vocabulary = new Map<string, number>()
  private idf = new Float64Array(0)
  private stopWords: Set<string>
  private sublinearTf: boolean

  constructor(opts: { stopWords?: string[]; sublinearTf?: boolean } = {}) {
    this.stopWords = new Set(opts.stopWords || STOP_WORDS)
    this.sublinearTf = opts.sublinearTf ?? true
  }

  fitTransform(docs: string[]): Float64Array[] { this.fit(docs); return this.transform(docs) }

  fit(docs: string[]): void {
    const docCount = docs.length
    const docTokens = docs.map((d) => this.tokenize(d))
    const df = new Map<string, number>()
    for (const tokens of docTokens) { const unique = new Set(tokens); for (const tok of unique) df.set(tok, (df.get(tok) || 0) + 1) }
    const vocabList: string[] = []
    for (const [tok, count] of df) { if (count >= 1) { this.vocabulary.set(tok, vocabList.length); vocabList.push(tok) } }
    this.idf = new Float64Array(vocabList.length)
    for (let i = 0; i < vocabList.length; i++) { this.idf[i] = Math.log((docCount + 1) / ((df.get(vocabList[i]) || 1) + 1)) + 1.0 }
  }

  transform(docs: string[]): Float64Array[] {
    const vocabSize = this.vocabulary.size
    return docs.map((doc) => {
      const tokens = this.tokenize(doc)
      const tf = new Map<number, number>()
      for (const tok of tokens) { const idx = this.vocabulary.get(tok); if (idx !== undefined) tf.set(idx, (tf.get(idx) || 0) + 1) }
      const vec = new Float64Array(vocabSize)
      for (const [idx, count] of tf) { vec[idx] = (this.sublinearTf ? 1 + Math.log(count) : count) * this.idf[idx] }
      let norm = 0; for (let i = 0; i < vocabSize; i++) norm += vec[i] * vec[i]
      norm = Math.sqrt(norm); if (norm > 0) for (let i = 0; i < vocabSize; i++) vec[i] /= norm
      return vec
    })
  }

  private tokenize(text: string): string[] {
    const words = text.toLowerCase().match(/[a-z][a-z0-9-]*/g) || []
    const filtered = words.filter((w) => !this.stopWords.has(w) && w.length >= 2)
    const ngrams: string[] = [...filtered]
    for (let i = 0; i < filtered.length - 1; i++) ngrams.push(`${filtered[i]} ${filtered[i + 1]}`)
    return ngrams
  }
}

function normalize(v: Float64Array): Float64Array {
  let norm = 0; for (let i = 0; i < v.length; i++) norm += v[i] * v[i]
  norm = Math.sqrt(norm)
  if (norm > 0) { const r = new Float64Array(v.length); for (let i = 0; i < v.length; i++) r[i] = v[i] / norm; return r }
  return v
}

export interface EmbeddingBackend {
  name: string; version: string; dimension: number
  similarity(query: string, ids: string[]): Map<string, number>
  encode(texts: string[]): Float64Array[]
}

export class LSAEmbeddingBackend implements EmbeddingBackend {
  name = 'lsa-256-surrogate'
  version = 'lsa-256d'
  dimension: number
  private ids: string[]
  private vectorizer: TFIDFVectorizer
  private embeddings: Float64Array[]
  private index: Map<string, number>

  constructor(corpus: Map<string, string>) {
    this.ids = Array.from(corpus.keys())
    const docs = this.ids.map((id) => corpus.get(id) || '')
    this.vectorizer = new TFIDFVectorizer({ sublinearTf: true })
    const X = this.vectorizer.fitTransform(docs)
    this.embeddings = X.map(normalize)
    this.index = new Map()
    for (let i = 0; i < this.ids.length; i++) this.index.set(this.ids[i], i)
    this.dimension = X[0]?.length || 0
    this.version = `lsa-${this.dimension}d`
  }

  encode(texts: string[]): Float64Array[] { return this.vectorizer.transform(texts).map(normalize) }

  similarity(query: string, ids: string[]): Map<string, number> {
    const result = new Map<string, number>()
    if (!query.trim()) { for (const id of ids) result.set(id, 0); return result }
    const q = this.encode([query])[0]
    for (const id of ids) {
      const idx = this.index.get(id)
      if (idx === undefined) { result.set(id, 0) }
      else { const emb = this.embeddings[idx]; let dot = 0; for (let i = 0; i < q.length; i++) dot += q[i] * emb[i]; result.set(id, dot) }
    }
    return result
  }
}
