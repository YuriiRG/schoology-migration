# Schoology migration script

A script that can be used to extract lesson names and links from `.imscc` files.

It is not perfect, and I claim no responsibility for any incorrect data produced by it.

## Usage

**Step 0. Prerequisites.** [Node.js](https://nodejs.org) and npm (installed with Node.js) or pnpm are required to execute the script.

**Step 1. Install the script.** Download the files from the repository and run `pnpm install`. `npm install` should work too.

**Step 2. Import the data.** Unarchive the `.imscc` file you want to analyze. Call the resulting folder `data` and put the folder into the project directory, alongside `main.ts` and `package.json` files.

**Step 3. Run the script.** Use `pnpm execute` or `npm run execute` commands.

**Step 4. Read the results.** The results should appear in `results.txt`. It contains names of blocks from the input data and individual elements with links that they contain. Names of the elements and their links are separated by tab for easier copypasting to Google Sheets.
