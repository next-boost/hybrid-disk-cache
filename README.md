# hybrid-disk-cache

A hybrid disk cache library that utilized both the solid SQLite3 and file system.

When value larger than 10 kilobyptes, the value will be cached on disk. Other wise save in SQLite3 database.

Searching for the index will always use SQLite3's index.

## API

Check this `index.test.ts` for examples.

## Benchmarks

Will be added soon.

## License

MIT. Copyright 2020, Rakuraku Jyo.