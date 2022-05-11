import Turndown from "turndown";

export function formatHtml(html: string, site: string): string {
    if (typeof html === "string") {
        // expand href's with rooted url's to full url's
        html = html.replace(/href="(\/[^"]*)"/gi, `href="${site}$1"`);
        // move <br> before a closing tag to after closing tag to prevent markdown header formatting issue
        html = html.replace(/<br>(<\/\w+>)/gi, "$1<br>");
    }
    return html;
}

export function htmlToMarkdown(html: string): string {
    if (html) {
        const service = new Turndown({ headingStyle: "atx" });
        const markdown = service.turndown(html);
        return markdown;
    }
    else {
        return "";
    }
}
