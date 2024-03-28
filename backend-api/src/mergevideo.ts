import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
const FS = require('fs');
import { Request } from "express";
import { StateManager } from './state';


export class MergeVideoManager {

  videoDirectoryPath = "/home/user/桌面/Video/";

  constructor() {

  }

  async getListOfVideos(req: Request) {
    if (req.query.type == "dossier") {
      const files = await fs.readdir(this.videoDirectoryPath);  
      let folders = [];
      for (const file of files) { 
        if (file == ".DS_Store" || file == "tmp" || file == "merged") continue;
        const filePath = path.join(this.videoDirectoryPath, file); 
        const stats = await fs.stat(filePath); 
        if (stats.isDirectory() || file.endsWith(".mp4")) {
          folders.push({
            "name": file,
            "created": stats.birthtimeMs,
            "createdstr": stats.birthtime
          }); 
        }
      }
      folders.sort((a, b) => {
        if (a.name < b.name) {
          return 1; // b vient avant a
        }
        if (a.name > b.name) {
          return -1; // a vient avant b
        }
        return 0; // a et b sont égaux
      });
      return folders; 
    } else if (req.query.type == "fichier" && req.query.folder) {
      const files = await fs.readdir(this.videoDirectoryPath + req.query.folder); 
      let fileList = [];
      for (const file of files) { 
        if (file == ".DS_Store") continue;
        const filePath = path.join(this.videoDirectoryPath + req.query.folder, file); 
        const stats = await fs.stat(filePath); 
        if (stats.isFile()) { 
          fileList.push({
            "name": file,
            "created": stats.birthtimeMs,
            "createdstr": stats.birthtime
          }); 
        }
      } 
      return fileList;
    } else {
      return [];
    }
  }

  async merge(req: Request) { 
    if (StateManager.getInstance().isProcessing) {
      return "当前有视频处理中，请等待处理完毕后再开始另一组";
    }
    let folder = req.query.folder;
    if (!folder) {   
      return "视频文件夹不存在";
    }   
    let headFilePath = `${this.videoDirectoryPath}/head.mp4`;
    if (!FS.existsSync(headFilePath)) { 
      return "头部视频不存在";
    }
    let tailFilePath = `${this.videoDirectoryPath}/tail.mp4`
    if (!FS.existsSync(tailFilePath)) { 
      return "尾部视频不存在";
    }

    let outputMergedDir = `${this.videoDirectoryPath}merged/${folder}`;
    if (!FS.existsSync(outputMergedDir)) { 
      FS.mkdirSync(outputMergedDir, { recursive: true });
    }
    let outputTmpDir = `${this.videoDirectoryPath}tmp/${folder}`;
    if (!FS.existsSync(outputTmpDir)) { 
      FS.mkdirSync(outputTmpDir, { recursive: true });
    }

    const files = await fs.readdir(this.videoDirectoryPath + folder);   
    for (const file of files) {  
      if (!file.endsWith(".mp4")) continue; 
      let videoFilePath = `${this.videoDirectoryPath}/${folder}/${file}`;
      if (!FS.existsSync(videoFilePath)) {  
        continue; 
      } 

      ffmpeg()
      .videoCodec('libx264')
      // .audioCodec('libmp3lame') 
      .input(headFilePath)
      .input(videoFilePath)
      .input(tailFilePath) 
      .on('error', function(err) {
        console.log('An error occurred: ' + err.message);
      })
      .on('start', function() { 
        StateManager.getInstance().update(`${folder}`, file, {"status":"开始了", "data": {}});
        console.log(`File ${folder}/${file} Merging started`);
      })
      .on('end', function() { 
        StateManager.getInstance().update(`${folder}`, file, {"status":"已结束", "data": {}});
        console.log(`File ${folder}/${file} Merging finished`);
      })
      .on("progress", function (progress) { 
        StateManager.getInstance().update(`${folder}`, file, {"status":"进行中", "data": progress}); 
        // console.log(progress);
      })
      // .withSize('720x1280')
      // .mergeToFile(targetDir+'videos/merged.mp4', targetDir+'tmps');
      .mergeToFile(`${outputMergedDir}/merged_${file}`, `${outputTmpDir}/`);
    }

    return "";
  }


}