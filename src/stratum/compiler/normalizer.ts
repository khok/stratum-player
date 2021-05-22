const qt = "'";
const dqt = '"';
export function normalizeSource(text: string) {
    let res: string = "";
    let escMode = null;
    for (let i = 0; i < text.length; ++i) {
        const c = text[i];
        if (c === qt && escMode !== dqt) escMode = escMode ? null : qt;
        else if (c === dqt && escMode !== qt) escMode = escMode ? null : dqt;

        if (escMode) {
            res += c;
            continue;
        }

        if (c === "/") {
            const nxt = text[i + 1];
            if (nxt === "*") {
                i += 2;
                while (i < text.length && (text[i] !== "*" || text[i + 1] !== "/")) ++i;
                ++i;
                continue;
            }
            if (nxt === "/") {
                ++i;
                while (i < text.length && text[++i] !== "\n");
                if (res[res.length - 1] !== "\n") res += "\n";
                continue;
            }
        }

        if (c === ";" || c === "\n") {
            if (res[res.length - 1] !== "\n") res += "\n";
            continue;
        }

        if (c === "\r") {
            if (text[i + 1] === "\n") ++i;
            if (res[res.length - 1] !== "\n") res += "\n";
            continue;
        }
        // if (c === " ") {
        //     const prev = res[res.length - 1];
        //     if (prev === " " || prev === "\n") continue;
        // }
        res += c;
    }
    return res[res.length - 1] === "\n" ? res : res + "\n";
}
