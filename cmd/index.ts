import { Command } from "commander";
import ProgressBar from "progress";
import { version } from "../package.json";
import Vectorizer, { TFile, SourceType } from "../lib";

const progressBarFormat = "  processing [:bar] :percent :etas";
const progressBarConfig = {
  complete: "▓",
  incomplete: "░",
  width: 60,
};

const program = new Command();

program.name("vectorizer").version(version);

// Command for handling repositories
program
  .command("repo")
  .description("Transform your entire repository into a vector representation")
  .argument("<files...>", "The paths of folders or the files to vectorize")
  .option(
    "-t, --max-token <maxToken>",
    "The maximum number of tokens for a chunk (default to 2000)",
    "2000"
  )
  .option(
    "-k, --token <token>",
    "Your polyfact token. You can generate one here: https://app.polyfact.com",
    ""
  )
  .action(async (files: string[], { maxToken, token }) => {
    const vectorizer = new Vectorizer(
      token,
      parseInt(maxToken),
      SourceType.DIRECTORY
    );

    const splitProgress = new ProgressBar(progressBarFormat, {
      ...progressBarConfig,
      total: files.length,
    });

    const vectorizeProgress = new ProgressBar(progressBarFormat, {
      ...progressBarConfig,
      total: files.length,
    });

    let isSplitDone = false;
    let isVectorizeDone = false;

    const progress = (file: any, totalFiles: number, step: string) => {
      if (step === "split" && !isSplitDone) {
        splitProgress.tick();
        if (splitProgress.complete) {
          console.info("Split Done!");
          isSplitDone = true;
        }
      } else if (step === "vectorize" && !isVectorizeDone) {
        vectorizeProgress.tick();
        if (vectorizeProgress.complete) {
          console.info("Vectorization Done!");
          isVectorizeDone = true;
        }
      }
    };

    const readFiles: TFile[] = await vectorizer.readFiles(files);

    await vectorizer.vectorize(readFiles, progress);

    const memoryId = vectorizer.getMemoryId();

    console.info(
      `Your memory ID to use in your project to retrive the vectorized data using polyfact SDK`
    );
    console.info(memoryId);
  });

program
  .command("pdf")
  .description("Transform your entire PDFs into a vector representation")
  .argument("<files...>", "The paths of the PDF files to vectorize")
  .option(
    "-t, --max-token <maxToken>",
    "The maximum number of tokens for a chunk (default to 2000)",
    "2000"
  )
  .option(
    "-k, --token <token>",
    "Your polyfact token. You can generate one here: https://app.polyfact.com",
    ""
  )
  .action(async (files: string[], { maxToken, token }) => {
    const vectorizer = new Vectorizer(
      token,
      parseInt(maxToken),
      SourceType.PDF
    );

    const readFiles: TFile[] = await vectorizer.readFiles(files);

    const splitProgress = new ProgressBar(progressBarFormat, {
      ...progressBarConfig,
      total: readFiles.length,
    });

    const vectorizeProgress = new ProgressBar(progressBarFormat, {
      ...progressBarConfig,
      total: readFiles.length,
    });

    let isSplitDone = false;
    let isVectorizeDone = false;

    const progress = (file: any, totalFiles: number, step: string) => {
      if (step === "split" && !isSplitDone) {
        splitProgress.tick();
        if (splitProgress.complete) {
          console.info("Split Done!");
          isSplitDone = true;
        }
      } else if (step === "vectorize" && !isVectorizeDone) {
        vectorizeProgress.tick();
        if (vectorizeProgress.complete) {
          console.info("Vectorization Done!");
          isVectorizeDone = true;
        }
      }
    };

    await vectorizer.vectorize(readFiles, progress);
    const memoryId = vectorizer.getMemoryId();

    console.info(
      `Your memory ID to use in your project to retrive the vectorized data using polyfact SDK`
    );
    console.info(memoryId);
  });

program.parse();
