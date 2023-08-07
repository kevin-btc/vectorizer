import { createMemory, updateMemory, splitString } from "polyfact";
import _ from "lodash";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import * as path from "path";
import fs from "fs";

export type TFile = {
  path: string;
  content: string;
  page?: number;
  filename?: string;
  saved?: boolean;
};

export enum SourceType {
  DIRECTORY,
  PDF,
}

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
  private apiKey: string;
  private readonly maxToken: number;
  private sourceType: SourceType;

  constructor(
    api_key: string,
    maxToken: number,
    sourceType: SourceType,
    memoryId?: string
  ) {
    if (maxToken <= 0) {
      throw new Error("maxToken must be a positive number");
    }

    this.apiKey = api_key;
    this.memoryId = memoryId || null;
    this.maxToken = maxToken;
    this.sourceType = sourceType;
  }

  private async ensureMemoryInitialized(): Promise<void> {
    if (!this.memoryId) {
      this.memoryId = (await createMemory()).id;
    }
  }

  private async readPDFs(files: string[]): Promise<TFile[]> {
    const output: TFile[] = [];

    async function extractPDFContent(
      filePath: string,
      perPage: boolean = true
    ) {
      const loaderOptions = perPage ? {} : { splitPages: false };
      const loader = new PDFLoader(filePath, loaderOptions);

      try {
        const docs = await loader.load();
        const filename = path.basename(filePath);

        if (perPage) {
          for (let i = 0; i < docs.length; i++) {
            output.push({
              content: docs[i].pageContent, // Assuming each doc has a text attribute
              page: i + 1,
              filename: filename,
              path: filePath,
            });
          }
        } else {
          output.push({
            content: docs[0].pageContent, // Assuming the complete document's content is in the first doc
            page: 1,
            filename: filename,
            path: filePath,
          });
        }
      } catch (error: any) {
        throw new Error(`Error reading "${filePath}": ${error.message}`);
      }
    }

    const promises = files.map((file) => extractPDFContent(path.resolve(file)));
    await Promise.all(promises);

    return output;
  }

  private readFilesFromRepo(files: string[]): TFile[] {
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

  public async readFiles(files: string[]): Promise<TFile[]> {
    if (this.sourceType === SourceType.DIRECTORY) {
      return this.readFilesFromRepo(files);
    } else if (this.sourceType === SourceType.PDF) {
      return this.readPDFs(files);
    } else {
      throw new Error("Unknown source type");
    }
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
            this.maxToken,
            { token: this.apiKey }
          );

          file = { ...file, saved: Boolean(updated) };
          result.push(file);

          vectorizeProgress(file);
        })
      );
    }

    return result;
  }

  public getMemoryId(): string {
    if (this.memoryId === null) {
      throw new Error("Memory ID is not set.");
    }
    return this.memoryId;
  }
}

export default Vectorizer;
