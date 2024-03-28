import express, { Express, Request, Response } from "express";
import { MergeVideoManager } from "./src/mergevideo";
import cors from "cors";
import { StateManager } from "./src/state";

const app: Express = express();
app.use(cors())
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/video/list", async (req: Request, res: Response) => { 
  res.set('Content-Type', 'application/json'); 
  const data = await new MergeVideoManager().getListOfVideos(req);
  res.status(200).send(JSON.stringify({"data":data}));  
});

app.post("/video/merge", async (req: Request, res: Response) => {
  let errmsg = await new MergeVideoManager().merge(req);
  res.set('Content-Type', 'application/json');  
  res.status(200).send({"message":errmsg});  
});

app.get("/video/merge/status", async (req: Request, res: Response) => { 
  let data = StateManager.getInstance().get(req);
  res.set('Content-Type', 'application/json');  
  res.status(200).send(data);  
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
 