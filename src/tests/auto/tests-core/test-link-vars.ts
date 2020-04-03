import { createClassScheme } from "~/core/createClassScheme";
import { readProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { equal } from "assert";

async function load(name: string) {
    const zip = await openZipFromUrl([`/test_projects/${name}.zip`, "/data/library.zip"]);
    const { collection, rootName } = await readProjectData(zip);
    return createClassScheme(rootName, collection).mmanager;
}

(async function () {
    equal((await load("balls")).varCount, 1235);
    equal((await load("balls_stress_test")).varCount, 2328);
    console.log("var count test completed");
})();
