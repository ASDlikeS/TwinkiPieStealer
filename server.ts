import { file } from "bun";
import "dotenv/config";

interface TwinkiPieData{
  pcName?: string;
  userName?: string;
  collectedAt?: string;
}

const AUTH_TOKEN = process.env.AUTH_TOKEN;
if(!AUTH_TOKEN){
  console.error("ERROR: AUTH_TOKEN doens't exist in .env");
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;
const LOGS_DIR = process.env.LOGS_DIR || "sys_pc_logs";

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",

  async fetch(req) {
    console.log(`${req.method} ${req.url}`);

    if(req.method !== "POST"){
      return new Response("Method not allowed", {status: 405})
    }

    const authHeader = req.headers.get("Authorization");
    if(authHeader !== AUTH_TOKEN){
      console.log(authHeader)
      console.log(AUTH_TOKEN)
      console.error(`!!! UNAUTHORIZED ACCESS ATTEMPT from ${req.headers.get("user-agent") || "unknown"} !!!`);
      return new Response("Unauthorized", {status: 401});
    }

    let body: TwinkiPieData;
    try {
      body = (await req.json() as TwinkiPieData); 
      console.log("Data received:");
      console.log(JSON.stringify(body, null, 2));
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    let fileName = body.collectedAt || body.pcName || body.userName;
    const logsDir = LOGS_DIR;

    fileName = fileName?.replace(/[/\\?%*:|"<>]/g, "_").trim();

    try {
      await Bun.$`mkdir -p ${logsDir}`;
    } catch (e) {
      console.error("Couldn't create directory:", e);
      return new Response("Server error", { status: 500 });
    }

    const filePath = `${logsDir}/${fileName}.json`;

    try {
      await Bun.write(filePath, JSON.stringify(body, null, 2));
      console.log(`Datas ${fileName} saved in path ${filePath}`)
    } catch (error) {
      console.error("Error to write file:", error);
      return new Response("Server error", {status: 500});
    }

    return new Response("Webhook Received!", { status: 200 });
  },
});

console.log("Server started at http://localhost:3001");
console.log(`Logs will save in: ${LOGS_DIR}`);