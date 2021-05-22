export interface WindowAttribs {
    useVdrSettings?: boolean;
    child?: boolean;
    popup?: boolean;
    noResize?: boolean;
    autoOrg?: boolean;
    bySpaceSize?: boolean;
    noCaption?: boolean;
    noShadow?: boolean;
}

export function parseWindowAttribs(attrib: string): WindowAttribs {
    const a = attrib.toUpperCase();
    return {
        useVdrSettings: a.includes("WS_BYSPACE"),
        child: a.includes("WS_CHILD"),
        popup: a.includes("WS_POPUP"),
        noResize: a.includes("WS_NORESIZE"),
        autoOrg: a.includes("WS_AUTOORG"),
        bySpaceSize: a.includes("WS_SPACESIZE"),
        noCaption: a.includes("WS_NOCAPTION"),
        noShadow: a.includes("WS_NOSHADOW"),
    };
}
