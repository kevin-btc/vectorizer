import Vectorizer, { TFile, SourceType } from "../lib";

const paths = ["/Users/Kev/Downloads/The-Final-Reinold.mp3"];

const clientOptions = {
  token: "<YOUR_POLYFACT_TOKEN>" as string,
  endpoint: "http://localhost:8080",
};

(async () => {
  const vectorizer = new Vectorizer(clientOptions, 512);

  const files = await vectorizer.readFiles(paths, SourceType.AUDIO);

  console.log(files);

  function progress(file: TFile) {
    console.log(file);
  }

  await vectorizer.vectorize(files, progress).then((result) => {
    console.log(result);
  });

  console.log(vectorizer.getMemoryId());
})();
