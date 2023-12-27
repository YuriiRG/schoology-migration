# Schoology migration script

A script that can be used to extract lesson names and links from `.imscc` files.

It is not perfect, and I claim no responsibility for any incorrect data produced by it.

## Usage

You can skip the first 2 steps if you are using the binary distribution from the Releases page.

**Step 0. Prerequisites.** If you are executing from source, [Node.js](https://nodejs.org) and npm (installed with Node.js) or pnpm are required to execute the script.

**Step 1. Install the script.** If you are executing from source, download the files from the repository and run `pnpm install`. `npm install` should work too.

**Step 2. Run the script.** If you are executing from source, use `pnpm execute -- PATH_TO_YOUR_FILE.imscc` or `npm run execute -- PATH_TO_YOUR_FILE.imscc` commands. If you are using the binary, run `.\script.exe PATH_TO_YOUR_FILE.imscc` in PowerShell.

**Step 3. Read the results.** The results should appear in `results.txt`. It contains names of blocks from the input data and individual elements with links that they contain. Names of the elements and their links are separated by tab for easier copypasting to Google Sheets.
