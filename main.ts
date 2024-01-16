import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { createWriteStream, existsSync, readFileSync, rmSync } from "fs";
import { HTMLElement, parse as parseHtml } from "node-html-parser";
import { z } from "zod";

const lessonSchema = z.object({
  title: z.string().optional(),
  "@_identifierref": z.string().optional(),
});

type Lesson = z.infer<typeof lessonSchema>;

type Block = Lesson & {
  item?: Block | Block[];
};

const blockSchema: z.ZodType<Block> = lessonSchema.extend({
  item: z.lazy(() => z.union([blockSchema, z.array(blockSchema)]).optional()),
});

const file = process.argv.findLast((arg) => arg.endsWith(".imscc"));

if (file === undefined) {
  console.log("No input file specified");
  process.exit(1);
}

const zip = new AdmZip(file);

zip.extractAllTo("./temp");

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  numberParseOptions: {
    hex: false,
    leadingZeros: false,
    eNotation: false,
    skipLike: /.*/,
  },
});
let manifest: Block[];
try {
  manifest = z
    .array(blockSchema)
    .parse(
      xmlParser.parse(
        readFileSync("./temp/imsmanifest.xml", { encoding: "utf-8" })
      ).manifest.organizations.organization.item.item
    );
} catch (e) {
  console.log("File manifest is not in a format that the program understands");
  console.log(
    "It likely would have caused some issues. Report the issue to the program author"
  );
  process.exit(1);
}

const printer = createWriteStream("results.txt");

processBlocks(manifest);

rmSync("./temp", { recursive: true, force: true });

function processBlocks(blocks: Block[]) {
  for (const block of blocks) {
    if (block.item !== undefined) {
      printer.write(`Block: "${block.title}"\n`);
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
  if (lesson["@_identifierref"] !== undefined) {
    const markupFilePathStart = `./temp/${lesson["@_identifierref"]}/${lesson["@_identifierref"]}`;
    let html: HTMLElement;
    if (existsSync(`${markupFilePathStart}.html`)) {
      html = parseHtml(
        readFileSync(`${markupFilePathStart}.html`, { encoding: "utf-8" })
      );
    } else if (existsSync(`${markupFilePathStart}.xml`)) {
      html = parseHtml(
        readFileSync(`${markupFilePathStart}.xml`, { encoding: "utf-8" })
      );
    } else {
      console.log(
        `No html or xml found in "${lesson["title"]}" ${lesson["@_identifierref"]}`
      );
      return;
    }

    let links = html
      .querySelectorAll("iframe")
      .map((elem) => elem.attributes.src)
      .concat(html.querySelectorAll("a").map((elem) => elem.attributes.href))
      .concat(html.querySelectorAll("url").map((elem) => elem.attributes.href))
      .filter((url) => url && !url.startsWith("/"))
      .concat(html.textContent.match(/https:\/\/[a-zA-Z.\/\-_?=0-9]+/g) ?? [])
      .filter((url) => !url.includes(".pptx"))
      .map((url) =>
        url.includes("youtube.com/embed/")
          ? `https://youtu.be/${url.split("/").at(-1)!}`
          : url
      );
    links = links.filter((item, pos) => links.indexOf(item) == pos);
    printer.write(`${lesson.title}\t${links.join(" ")}\n`);
  } else {
    console.log(`No identifier ref found for "${lesson["title"]}"`);
  }
}
