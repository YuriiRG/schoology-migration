import { XMLParser } from "fast-xml-parser";
import { createWriteStream, existsSync, readFileSync, readdirSync } from "fs";
import { parse as parseHtml } from "node-html-parser";
type Lesson = {
  title: string | number;
  "@_identifierref"?: string;
};

type Block =
  | {
      title: string;
      item: Block[] | Block;
    }
  | Lesson;

const xmlParser = new XMLParser({ ignoreAttributes: false });
const manifest: Block[] = xmlParser.parse(
  readFileSync("./data/imsmanifest.xml", { encoding: "utf-8" })
).manifest.organizations.organization.item.item;

const printer = createWriteStream("results.txt");

processBlocks(manifest);

function processBlocks(blocks: Block[]) {
  for (const block of blocks) {
    if ("item" in block) {
      printer.write(`Block: ${block.title}\n`);
      if (Array.isArray(block.item)) {
        processBlocks(block.item);
      } else {
        processBlocks([block.item]);
      }
    } else {
      processLesson(block);
    }
  }
}

function processLesson(lesson: Lesson) {
  if (typeof lesson.title === "number") {
    lesson.title = lesson.title.toFixed(2).padStart(5, "0");
  }
  //printer.write(`${lesson.title}: ${lesson["@_identifierref"]}`);
  if (
    lesson["@_identifierref"] !== undefined &&
    readdirSync(`./data/${lesson["@_identifierref"]}`).length > 0
  ) {
    if (
      !existsSync(
        `./data/${lesson["@_identifierref"]}/${lesson["@_identifierref"]}.html`
      )
    ) {
      console.log(
        `No html in "${lesson["title"]}" ${lesson["@_identifierref"]}`
      );
      return;
    }
    const html = parseHtml(
      readFileSync(
        `./data/${lesson["@_identifierref"]}/${lesson["@_identifierref"]}.html`,
        { encoding: "utf-8" }
      )
    );
    let links = html
      .querySelectorAll("iframe")
      .map((elem) => elem.attributes.src)
      .concat(html.querySelectorAll("a").map((elem) => elem.attributes.href))
      .filter((url) => !url.startsWith("/"))
      .map((url) =>
        url.includes("youtube.com/embed/")
          ? `https://youtu.be/${url.split("/").at(-1)!}`
          : url
      );
    links = links.filter((item, pos) => links.indexOf(item) == pos);
    printer.write(`${lesson.title}\t${links.join(" ")}\n`);
  } else {
    printer.write(`${lesson.title}\n`);
  }
}
