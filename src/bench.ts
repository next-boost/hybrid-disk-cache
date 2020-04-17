import Cache from '.'

function log(start: [number, number], count: number): void {
  const [secs, ns] = process.hrtime(start)
  const ms = ns / 1000
  const speed = (secs * 1000000 + ms) / count
  console.log('  done: %s μs/record.', speed.toFixed(2))
}

function benchData(size = 6) {
  const base = [1, 2, 5]
  // from 10B to 5MB
  const full = new Array(size)
    .fill(0)
    .flatMap((_, exp) => base.map((b) => b * Math.pow(10, exp)))
    .map((i) => Buffer.from(new Array(i).fill(0)))
  return full
}

function benchWrite(cache: Cache, batch: number, size = 6) {
  console.log('> generating bench data from 10B to %sB', 5 * Math.pow(10, size))
  const full = benchData(size)

  let count = 0
  console.log('> starting %s x %s writes', batch, full.length)
  const start = process.hrtime()
  for (let i = 0; i < batch; i++) {
    for (let j = 0; j < full.length; j++) {
      cache.set('key-' + j, full[j])
      count += 1
    }
  }

  log(start, count)
  return full.map((_, i) => 'key-' + i)
}

function benchRead(cache: Cache, batch: number, keys: string[]) {
  let count = 0
  console.log('> starting %s x %s reads', batch, keys.length)
  const start = process.hrtime()
  for (let i = 0; i < batch; i++) {
    for (const key of keys) {
      cache.get(key)
      count += 1
    }
  }

  log(start, count)
}

if (require.main === module) {
  const cache = new Cache()
  console.log('> cache located at: %s', cache.path)
  const batch = 3000
  const keys = benchWrite(cache, batch, 5)
  benchRead(cache, batch, keys)
}
