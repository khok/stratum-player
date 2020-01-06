//@ts-ignore
import html from "./manual.html";
document.write(html);
import { _run_test_quick } from "./test-run-quick";
_run_test_quick("balls_stress_test", {}, 5000);
