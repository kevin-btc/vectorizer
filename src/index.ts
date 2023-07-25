import fs from "fs";
import * as t from "io-ts";
import { generate } from "polyfact";

(async () => {
    const res = await generate("Count from 1 to 10");

    console.log(res);
})()
