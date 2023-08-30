/* eslint-disable camelcase */
import { TiktokenEncoding, get_encoding } from "@dqbd/tiktoken";

function memoize(fn: (...args: any[]) => any): (...args: any[]) => any {
  const cache: { [key: string]: any } = {};
  return function (...args: any[]) {
    const key = JSON.stringify(args);
    if (key in cache) return cache[key];
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const stirling = memoize((n: number) => {
  return (n / Math.E) ** n * Math.sqrt(2.0 * Math.PI * n);
});

const binomialScore = memoize((curr: number, max: number) => {
  const n = 30.0;
  const k = (n - 2.0) * (curr / max) + 1;
  return Math.sqrt(
    (stirling(n) / (stirling(k) * stirling(n - k))) * 0.5 ** k * 0.5 ** (n - k)
  );
});

function newLineScore(s: string, i: number): number {
  if (s.length === i + 1 || s[i] !== "\n") return 1.0;
  return s[i + 1] === "\n" ? 50.0 : 5.0;
}

function binarySplit(s: string): [string, string] {
  let maxScore = 0.0;
  let maxScoreI = 0;
  let lastNewLine = -1;

  for (let i = 0; i < s.length; i++) {
    let score = binomialScore(i, s.length) * newLineScore(s, i);
    if (s[i] === "\n") {
      if (lastNewLine === -1 || s[lastNewLine + 1] !== "\t") {
        score *= 50.0;
      }
      lastNewLine = i;
    }
    if (s[i] === " ") score *= 2.0;
    if (score > maxScore) {
      maxScore = score;
      maxScoreI = i;
    }
  }

  return [s.slice(0, maxScoreI), s.slice(maxScoreI)];
}

export function tokenCount(s: string, model: TiktokenEncoding): number {
  const enc = get_encoding(model);
  return enc.encode(s).length;
}

export function splitString(
  s: string,
  maxToken: number,
  model: TiktokenEncoding = "cl100k_base"
): string[] {
  if (tokenCount(s, model) < maxToken) return [s];
  const [left, right] = binarySplit(s);
  return [
    ...splitString(left, maxToken, model),
    ...splitString(right, maxToken, model),
  ];
}
