# Resume Agent Chrome prototype

This unpacked Manifest V3 extension provides the first template-review screen. It reads one selected `.tex` file in the side panel's memory and displays its section names, package names, external-file references, and source text. It does not save, upload, or edit the file.

## Load in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose this `extension` folder.
5. Select the Resume Agent toolbar icon to open the side panel, then choose a `.tex` file.

The prototype has no build step or third-party runtime dependency. Local template storage and TeX compilation are not implemented yet.
