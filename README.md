# Code Vectorizer

Code Vectorizer is a tool written in Typescript that helps you vectorize your code. This tool uses a number of dependencies, including "polyfact" for creating and updating memories, and "progress" to keep track of the vectorization process.

## Features

- Vectorizes code from a list of file paths.
- Efficiently handles multiple files.
- Supports batch processing for better performance.
- Displays a progress bar to monitor the processing.
- Can handle large files by splitting them into chunks and vectorizing them separately.
- Includes error handling for common issues like passing a directory instead of a file path.

## Installation/Setup

You need to have Node.js and npm installed on your machine. Once you have these, you can install the project using:

```bash
npm install code-vectorizer
```

## Usage

You can use the vectorizer function directly in your code:

```javascript
import { vectorizer } from "../lib/index";

const filePaths = ["lib/index.ts", "package.json"];
vectorizer(filePaths, 512);
```

This will vectorize the files located at the paths specified in the filePaths array. The second argument is the maximum token count for splitting large files into manageable chunks.

## Frequently Asked Questions (FAQs)

**Q: What is a vectorizer?**

A: In the context of this application, a vectorizer is a tool that converts code into a vector form that can be processed by machine learning algorithms.

**Q: What files can I vectorize?**

A: You can vectorize any text file. It's designed to handle code files, but there's no hard restriction on the file type.

**Q: How do I handle errors?**

A: The vectorizer function will throw an error if it encounters an issue, such as attempting to process a directory instead of a file. You should use try/catch blocks to handle these errors in your own code.

## Contribution Guidelines

If you wish to contribute to this project, you're welcome to make a pull request. Please ensure that your code follows the existing style and that all tests pass before you make a pull request.

## Contact Information

For any further queries, please reach out to: kgricour <kevin@polyfact.com>

**Note:** Always remember to use this tool responsibly and make sure you have the right to vectorize the code you are processing.
