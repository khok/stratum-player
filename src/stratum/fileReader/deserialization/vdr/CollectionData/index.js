import initObjects from "./Objects";
import initTools from "./Tools";
import initCollections from "./Collections";

export const itemReaders = {};
export const headerReaders = {};

(function () {
    initObjects(itemReaders);
    initTools(itemReaders);
    initCollections(headerReaders);
})();
