import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
const FS = require('fs');
import { Request } from "express";
import { StateManager } from './state';


export class MergeVideoManager {

  videoDirectoryPath = "/home/user/桌面/Video/";
  // videoDirectoryPath = "/Users/admin/Documents/Video/";

  constructor() {

  }

  async getListOfVideos(req: Request) { 
    if (req.query.type == "dossier") {
      const files = await fs.readdir(this.videoDirectoryPath);  
      let folders = [];
      for (const file of files) { 
        if (file == ".DS_Store" || file == "tmp" || file == "merged" || file == "head" || file == "tail") continue;
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

    let outputMergedDir = `${this.videoDirectoryPath}merged/${folder}`;
    if (!FS.existsSync(outputMergedDir)) { 
      FS.mkdirSync(outputMergedDir, { recursive: true });
    }
    let outputTmpDir = `${this.videoDirectoryPath}tmp/${folder}`;
    if (!FS.existsSync(outputTmpDir)) { 
      FS.mkdirSync(outputTmpDir, { recursive: true });
    }

    const files = await fs.readdir(this.videoDirectoryPath + folder); 
    if (files && files.length == 0) {
      return "没有原片视频";
    } 
    const headFiles = await fs.readdir(this.videoDirectoryPath + "head");
    if (headFiles && headFiles.length == 0) {
      return "没有头视频";
    } 
    const tailFiles = await fs.readdir(this.videoDirectoryPath + "tail"); 
    if (tailFiles && tailFiles.length == 0) {
      return "没有尾视频";
    } 

    var mIndex = 0;
    for (const file of files) {  
      if (!file.endsWith(".mp4")) continue; 
      let videoFilePath = `${this.videoDirectoryPath}/${folder}/${file}`;
      if (file == ".DS_Store" || !FS.existsSync(videoFilePath)) {  
        continue; 
      }   

      for (const hfile of headFiles) {  
        if (!hfile.endsWith(".mp4")) continue; 
        let hPath = `${this.videoDirectoryPath}/head/${hfile}`;
        if (hfile == ".DS_Store" || !FS.existsSync(hPath)) {  
          continue; 
        }  

        for (const tfile of tailFiles) {  
          if (!tfile.endsWith(".mp4")) continue; 
          let tPath = `${this.videoDirectoryPath}/tail/${tfile}`;
          if (tPath == ".DS_Store" || !FS.existsSync(tPath)) {  
            continue; 
          }  
          mIndex ++;

          let outputFileName = `${file.replace(".mp4", "")}_${mIndex}.mp4`;
        
          ffmpeg() 
          .input(hPath)
          .input(videoFilePath)
          .input(tPath) 
          .videoCodec('libx264') 
          .addOptions([ 
            '-preset ultrafast', // Utilise le preset 'ultrafast' pour la vitesse
            '-crf 23', // Le Constant Rate Factor, équilibre entre qualité et taille de fichier (les valeurs typiques sont entre 18 et 28, 23 étant un bon milieu)
          ])
          .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
          })
          .on('start', function() { 
            StateManager.getInstance().update(`${folder}`, outputFileName, {"status":"开始了", "data": {}});
            console.log(`File ${folder}/${outputFileName} Merging started`);
          })
          .on('end', function() { 
            StateManager.getInstance().update(`${folder}`, file, {"status":"已结束", "data": {}});
            console.log(`File ${folder}/${outputFileName} Merging finished`);
          })
          .on("progress", function (progress) { 
            StateManager.getInstance().update(`${folder}`, outputFileName, {"status":"进行中", "data": progress}); 
            // console.log(progress);
          }) 
          .mergeToFile(`${outputMergedDir}/${outputFileName}`, `${outputTmpDir}/`);
        
        }

      
      }
    }

    return "";
  }

}
