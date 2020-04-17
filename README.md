[![Coverage Status](https://coveralls.io/repos/github/rjyo/hybrid-disk-cache/badge.svg?branch=master)](https://coveralls.io/github/rjyo/hybrid-disk-cache?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/270469eb02421e5c7547/maintainability)](https://codeclimate.com/github/rjyo/hybrid-disk-cache/maintainability)

# hybrid-disk-cache

A hybrid disk cache library that utilized both the solid SQLite3 database and the file system.

When the value is larger than 10 kilobytes, it will be written to the file system, otherwise saved in SQLite3 database.

The benefits of using this kind of hybrid cache are:

- Always use the small footprint and high performace SQLite3 index.
- Using file system for larger files. No need to run `vacuum` for releasing space

Also, here are some bonus:

- 100% test coverage
- Pure Typescript
- Used in production with 300K keys

Searching for the index will always use SQLite3's index.

This hybrid idea is inspired by [`python-diskcache`](https://github.com/grantjenks/python-diskcache). We used it in our Python production stack, and it works just as great as what we'd expected.

## API

```javascript
// tbd, time before deletion: This is used to control how long a key
// should remain in the cache after expired (ttl)
// And `cache.purge` will delete all records with ttl + tbd < now
const cache = new Cache({ path, ttl, tbd })

// set. if ttl empty, use the cache's ttl
cache.set(key, value, ttl)

// get
cache.get(key, defaultValue)

// del
cache.del(key)

// check cache availability and status
// not exist:  status ==== false
// when stale: status === 'stale'
// when hit:   status === 'hit'
const status = cache.has(key)

// if you want to serve even the stale value
if (cache.has(key)) {
    const value = cache.get(key)
}

// if you only want the unexpired one
if (cache.has(key) === 'hit') {
    const value = cache.get(key)
}

// delete all expired keys
cache.purge()
```

Check [`index.test.ts`](https://github.com/rjyo/hybrid-disk-cache/blob/master/test/index.test.ts) for examples.

## Benchmarks

With a series of 10B ~ 500KB data writing and reading, here are the results on a Samsung 860 EVO SATA SSD:

Here is the [benchmark source code](https://github.com/rjyo/hybrid-disk-cache/blob/master/src/bench.ts).

```
> cache located at: /tmp/hdc
> generating bench data from 10B to 500000B
> starting 3000 x 15 writes
  done: 69.34 μs/record.
> starting 3000 x 15 reads
  done: 26.65 μs/record.
```

## License

MIT. Copyright 2020, Rakuraku Jyo.