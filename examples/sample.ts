import Vectorizer, { TFile, SourceType } from "../lib";

const paths = ["lib/index.ts", "package.json"];

(async () => {
  const vectorizer = new Vectorizer(
    process.env.POLYFACT_TOKEN as string,
    512,
    SourceType.DIRECTORY
  );

  const files = await vectorizer.readFiles(paths);

  function progress(file: TFile) {
    console.log(file);
  }

  vectorizer.vectorize(files, progress).then((result) => {
    console.log(result);
  });
})();
