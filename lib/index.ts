import { createMemory, updateMemory, splitString } from "polyfact";
import _ from "lodash";
import * as path from "path";
import fs from "fs";

export type TFile = {
  path: string;
  content: string;
  saved?: boolean;
};

function readDirRecursive(dir: string): TFile[] {
  const result: TFile[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      result.push(...readDirRecursive(filePath));
    } else {
      const content = fs.readFileSync(filePath, { encoding: "utf-8" });
      result.push({ path: filePath, content });
    }
  });
  return result;
}

function batchify(array: TFile[], size: number) {
  const batched: TFile[][] = [];
  let copied: TFile[] = [...array];
  const numOfChild = Math.ceil(copied.length / size);

  for (let i = 0; i < numOfChild; i++) {
    batched.push(copied.splice(0, size));
  }

  return batched;
}

function splitFiles(
  files: TFile[],
  maxToken: number,
  progress: (file: TFile) => void
): TFile[] {
  if (files.length === 0) {
    throw new Error("You need to add files to split !");
  }

  const result: TFile[] = [];

  files.forEach((file: TFile) => {
    const splittedString = splitString(file.content, maxToken);

    if (splittedString.length > 1) {
      splittedString.forEach((s: string, i: number) => {
        result.push({ path: `${file.path}_${i}`, content: s });
      });
    } else {
      result.push(file);
    }

    progress(file);
  });

  return result;
}

class Vectorizer {
  private memoryId: string | null;
  private readonly maxToken: number;

  constructor(maxToken: number, memoryId?: string) {
    if (maxToken <= 0) {
      throw new Error("maxToken must be a positive number");
    }

    this.memoryId = memoryId || null;
    this.maxToken = maxToken;
  }

  private async ensureMemoryInitialized(): Promise<void> {
    if (!this.memoryId) {
      this.memoryId = (await createMemory()).id;
    }
  }

  public readFilesFromPath(files: string[]): TFile[] {
    if (!Array.isArray(files)) {
      throw new Error(`Expected an array, but received ${typeof files}`);
    }

    return _.flatten(
      files.map((item) => {
        const filePath = path.resolve(item);
        if (fs.existsSync(filePath)) {
          if (fs.statSync(filePath).isDirectory()) {
            return readDirRecursive(filePath);
          } else {
            const content = fs.readFileSync(filePath, { encoding: "utf-8" });
            return [{ path: filePath, content }];
          }
        } else {
          throw new Error(`The path "${filePath}" does not exist.`);
        }
      })
    );
  }

  public async vectorize(
    files: TFile[],
    progress: (
      file: TFile,
      totalFiles: number,
      step: "split" | "vectorize"
    ) => void
  ): Promise<TFile[]> {
    if (files.length === 0) {
      throw new Error("No files provided for vectorization!");
    }

    await this.ensureMemoryInitialized();

    function splitProgess(file: TFile) {
      progress(file, files.length, "split");
    }

    function vectorizeProgress(file: TFile) {
      progress(file, files.length, "vectorize");
    }

    files = splitFiles(files, this.maxToken, splitProgess);

    const batchs = batchify(files, 10);
    const result: TFile[] = [];

    for (let i = 0; i < batchs.length; i++) {
      const batch = batchs[i];

      await Promise.all(
        batch.map(async (file: TFile) => {
          if (this.memoryId === null) {
            throw new Error("Memory ID is not set.");
          }
          const updated = await updateMemory(
            this.memoryId,
            JSON.stringify(file),
            this.maxToken
          );

          file = { ...file, saved: Boolean(updated) };
          result.push(file);

          vectorizeProgress(file);
        })
      );
    }

    return result;
  }
}

export default Vectorizer;
