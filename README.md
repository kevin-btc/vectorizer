Here is a README generated from the code snippet:

# @polyfact/vectorizer

Vectorize code repositories and PDFs into vector representations using Polyfact AI.

## Installation

```
npm install @polyfact/vectorizer
```

Or install globally to use the CLI:

```
npm install -g @polyfact/vectorizer
```

## Usage

### As a library

```js
import Vectorizer, { SourceType } from "@polyfact/vectorizer";

const vectorizer = new Vectorizer(token, maxTokens, SourceType.DIRECTORY);

const files = await vectorizer.readFiles(filePaths);
await vectorizer.vectorize(files, progressCallback);

const memoryId = vectorizer.getMemoryId();
```

### CLI

```
$ @polyfact/vectorizer --help

Usage: @polyfact/vectorizer [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  repo [files...]  Transform your entire repository into a vector representation
  pdf [files...]   Transform your entire PDFs into a vector representation
  help [command]   display help for command
```

Vectorize a code repository:

```
$ @polyfact/vectorizer repo src/ --token abc123 --max-token 1000
```

Vectorize PDF files:

```
$ @polyfact/vectorizer pdf file1.pdf file2.pdf --token abc123
```

The memory ID will be output after vectorization to use in your project with the Polyfact SDK.

## License

MIT
