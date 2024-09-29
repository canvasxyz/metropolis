import path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// use dynamic import so .env vars are properly loaded
async function main() {
  const { do_github_sync } = await import("../handlers/github_sync");

  do_github_sync()
    .then((results) => {
      console.log("Finished github sync:", results);
    })
    .catch((err: Error) => {
      console.log("Error running github sync:", err);
    });
}

main();
