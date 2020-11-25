export {};
import { normalizeSource } from "../src/stratum/translator/normalizer.ts";

const source = await Deno.readTextFile("source.txt");
const result = normalizeSource(source);
console.log(result);
