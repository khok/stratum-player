import { initCollections } from "./Collections";
import { initObjects } from "./Objects";
import { initTools } from "./Tools";

export const headerReaders = {};
export const itemReaders = {};

(function () {
    initCollections(headerReaders);
    initObjects(itemReaders);
    initTools(itemReaders);
})();
