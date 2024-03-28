import { Request } from "express";

export class StateManager {

    private data: { [key: string]: any } = {}

    public isProcessing: boolean = false;

    private static instance: StateManager;
    private constructor() { }
    public static getInstance(): StateManager {
      if (!StateManager.instance) {
        StateManager.instance = new StateManager();
      } 
      return StateManager.instance;
    }

    update(folder: string, file: string, value: any) : void {  
      if (!this.data[`${folder}`]) {
        this.data[`${folder}`] = {}
      }
      this.data[`${folder}`][`${file}`]  = value;

      if (value && value.status) {
        this.isProcessing = value.status == "end" ? false : true;
      }
    }

    get(req: Request) : any {
      let folder = req.query.folder;
      if (!folder) {   
        return {"message":"参数错误"};
      }   
      let d = this.data[`${folder}`];
      if (!d) {
        return {"message":"还没开始处理"};
      }
      return {"message":"success", "data": d};
    }

} 


export interface FileModel {
  name: String;
  created: Number;
  createdstr: String;
} 
