function readText(url) {
  try {
    const q = new URL(url || '', 'http://127.0.0.1').searchParams.get('text') || ''
    return q.trim().slice(0, 80)
  } catch {
    return ''
  }
}

async function fetchAudio(url) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Safari/537.36',
      Accept: 'audio/mpeg,audio/*,*/*',
    },
  })
  if (!r.ok) throw new Error(`http ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  const ctype = r.headers.get('content-type') || ''
  if (buf.length < 200) throw new Error('empty audio')
  if (/json|html|text\//i.test(ctype) && buf[0] !== 0xff) throw new Error(ctype || 'not audio')
  return { buf, ctype: /audio/i.test(ctype) ? ctype : 'audio/mpeg' }
}

export async function handleTts(req, res) {
  const text = readText(req.url)
  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'missing text' }))
    return
  }
  const q = encodeURIComponent(text)
  const urls = [
    `https://dict.youdao.com/dictvoice?le=zh&audio=${q}`,
    `https://fanyi.baidu.com/gettts?lan=zh&text=${q}&spd=4&source=web`,
  ]
  let last = ''
  for (const url of urls) {
    try {
      const { buf, ctype } = await fetchAudio(url)
      res.writeHead(200, {
        'Content-Type': ctype,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(buf)
      return
    } catch (err) {
      last = String(err?.message || err)
    }
  }
  res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ error: 'tts failed', detail: last }))
}
