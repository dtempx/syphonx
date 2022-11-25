import * as fs from "async-file";
import * as syphonx from "syphonx-lib";

export async function loadTemplate(file: string): Promise<syphonx.Template> {
    if (file.startsWith("$")) {
        const template = await syphonx.fetchTemplate(file);
        return template;
    }
    else {
        const text = await fs.readTextFile(file);
        const template = syphonx.parseTemplate(text);
        return template;
    }
}
