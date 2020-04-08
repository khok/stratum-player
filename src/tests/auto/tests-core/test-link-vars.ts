import { createClassScheme } from "~/core/createClassScheme";
import { readProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { equal } from "assert";

async function load(name: string) {
    const zip = await openZipFromUrl([`/test_projects/${name}.zip`, "/data/library.zip"]);
    const { collection, rootName } = await readProjectData(zip);
    return createClassScheme(rootName, collection).mmanager;
}

(async function () {
    const [balls, balls2] = await Promise.all([load("balls"), load("balls_stress_test")]);
    //минус 3 под зарезервированные поля в начале.
    equal(
        balls.defaultDoubleValues.length + balls.defaultLongValues.length + balls.defaultStringValues.length - 3,
        1235
    );
    equal(
        balls2.defaultDoubleValues.length + balls2.defaultLongValues.length + balls2.defaultStringValues.length - 3,
        2328
    );
    console.log("var count test completed");
})();
