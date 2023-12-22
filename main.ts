import { XMLParser } from "fast-xml-parser";
import { createWriteStream, existsSync, readFileSync } from "fs";
import { parse as parseHtml } from "node-html-parser";
type Lesson = {
  title: string | number;
  "@_identifierref"?: string;
};

const xmlParser = new XMLParser({ ignoreAttributes: false });
const manifest: {
  // block
  title: string;
  item: (
    | {
        // group / lesson
        title: string;
        item: Lesson[];
      }
    | Lesson
  )[];
}[] = xmlParser.parse(
  readFileSync("./data/imsmanifest.xml", { encoding: "utf-8" })
).manifest.organizations.organization.item.item;

const printer = createWriteStream("results.txt");

for (const block of manifest) {
  printer.write(`${block.title}\n`);
  for (const group of block.item) {
    if ("item" in group) {
      printer.write(`  ${group.title}\n`);
      for (const lesson of group.item) {
        if ("item" in lesson) {
          // skip very nested groups because they are not records
          continue;
        }
        processLesson(lesson);
      }
    } else {
      processLesson(group);
    }
  }
}

function processLesson(lesson: Lesson) {
  //printer.write(`${lesson.title}: ${lesson["@_identifierref"]}`);
  if (
    lesson["@_identifierref"] !== undefined &&
    existsSync(
      `./data/${lesson["@_identifierref"]}/${lesson["@_identifierref"]}.html`
    )
  ) {
    const html = parseHtml(
      readFileSync(
        `./data/${lesson["@_identifierref"]}/${lesson["@_identifierref"]}.html`,
        { encoding: "utf-8" }
      )
    );
    const links = html
      .querySelectorAll("iframe")
      .map((elem) => elem.attributes.src)
      .concat(html.querySelectorAll("a").map((elem) => elem.attributes.href))
      .filter((url) => !url.startsWith("/"))
      .map((url) =>
        url.includes("youtube.com/embed/")
          ? `https://youtu.be/${url.split("/").at(-1)!}`
          : url
      );
    printer.write(`${lesson.title}\t${links.join(" ")}\n`);
  } else {
    printer.write(`${lesson.title}\n`);
  }
}
