import app from "./app";
import Config from "./src/config";
import logger from "./src/utils/logger";

app.listen(Config.serverPort);
logger.info("started on port " + Config.serverPort);
