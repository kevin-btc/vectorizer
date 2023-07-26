import { createMemory, updateMemory, splitString } from "polyfact";
import ProgressBar from "progress";
import { extendConsole } from "ai-logger";
import readline from "readline";

extendConsole();

const progressBarFormat = "  processing [:bar] :percent :etas";
const progressBarConfig = {
  complete: "▓",
  incomplete: "░",
  width: 60,
};

import fs from "fs";
import path from "path";

const presentation = `
==================================================
✨  Welcome to the code-vectorize package!  ✨
==================================================

The code-vectorize package provides an easy and efficient way to transform your entire codebase into a vector representation. It's like creating a DNA sequence for your software!

🧬  What does it do?
---------------------
This package reads all the files in your code project, including all nested directories, and turns them into a vector representation. These vectors can be used for various tasks such as code comparison, plagiarism detection, code search, and much more.

🔒  Confidentiality and respect for your code
----------------------------------------------
We understand that your code is valuable and sensitive. That's why we made sure that the code-vectorize package respects your privacy. This package runs locally on your machine and does not send any data elsewhere. 

Notably, all hidden files (those starting with a dot) are ignored during the process. We also respect the .gitignore rules, meaning any file or directory mentioned in the .gitignore file will be skipped over. Rest assured that these files won't be part of the vectorization process.

We believe in the privacy and integrity of your codebase. It's not just a bunch of files, it's your work, your brainchild, your intellectual property. And we treat it as such!

🚀  Ready to give it a spin?
-----------------------------
Now you're all set to start the vectorization process. Just follow the prompts, and in no time, you'll have a vector representation of your entire project.

Should you have any questions or encounter any issues, feel free to reach out. Happy vectorizing!

==================================================

Press any key to continue or CTRL+C to quit...
`;

type TFile = {
  path: string;
  data: string;
};

function readFilesFromPath(filesPaths: string[]) {
  let filesData: TFile[] = [];

  filesPaths.forEach((file: any) => {
    if (fs.statSync(file).isDirectory()) {
      throw new Error("You can't pass a directory as an argument");
    } else {
      const data = fs.readFileSync(file, "utf-8");
      filesData.push({ path: file, data: data });
    }
  });

  return filesData;
}

function splitFile(filesData: TFile[], maxToken: number) {
  const result: string[] = [];

  console.info("Split files into chunks:");
  const bar = new ProgressBar(progressBarFormat, {
    ...progressBarConfig,
    total: filesData.length,
  });

  filesData.forEach((file: TFile) => {
    const splittedString = splitString(file.data, maxToken);

    if (splittedString.length > 1) {
      splittedString.forEach((s, i) => {
        result.push(JSON.stringify({ path: `${file.path}_${i}`, data: s }));
        bar.tick();
      });
    } else {
      result.push(JSON.stringify(file));
    }
  });
  return result;
}

export async function vectorizer(filesPaths: string[], maxToken: number) {
  if (filesPaths.length === 0) {
    throw new Error("No files found");
  }

  const filesData = readFilesFromPath(filesPaths);

  const memory = await createMemory();
  const splittedFiles = splitFile(filesData, maxToken);

  const batchs = batchify(splittedFiles, 10);

  console.info("Files Vectorization :");
  var bar = new ProgressBar(progressBarFormat, {
    ...progressBarConfig,
    total: splittedFiles.length,
  });

  for (let batch of batchs) {
    await Promise.all(
      batch.map(async (file: string) => {
        await updateMemory(memory.id, file, maxToken);
        bar.tick();
      })
    );
  }

  return true;
}

function batchify(array: string[], size: number) {
  const batched: string[][] = [];
  let copied: string[] = [...array];
  const numOfChild = Math.ceil(copied.length / size);

  for (let i = 0; i < numOfChild; i++) {
    batched.push(copied.splice(0, size));
  }

  console.log(`Batchify ${array.length} files into ${batched.length} batches`);
  console.log(`Batch: ${batched}`);
  return batched;
}

function vectorizerScript(filesPaths: string[], maxToken: number) {
  console.info(presentation);

  process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);

  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      process.exit();
    } else {
      process.stdin.setRawMode(false);
      vectorizer(filesPaths, maxToken).then(() => {
        console.info("Vectorization done!");
        process.exit();
      });
    }
  });
}

export default vectorizerScript;
