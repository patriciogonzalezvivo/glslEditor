export function saveAs(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("download", filename);
    link.setAttribute("href", url);
    link.click();
}