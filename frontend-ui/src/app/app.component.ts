import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './app.config.server'; 
import { FolderModel, FileModel, ProgressModel } from './app.model'; 
import { NgFor, NgIf } from '@angular/common';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgFor, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [ConfigService],   
})
export class AppComponent implements OnInit { 

  constructor(private configService: ConfigService) {}
  
  title = 'frontend-ui';

  folderList: FolderModel[] = [];

  folderName: String = "";
  videoFiles: FileModel[] = [];

  isMergedPage: Boolean = false;
  
  httpErrMsg: String | null = null;
  progressModels: ProgressModel[] = [];
  
  ngOnInit(): void { 
    this.configService.getFolderList()
    .subscribe(
    (response) => {  
      this.folderList = (response as any).data;  
    });  

    // this.isMergedPage = window.location.href.endsWith("?folder=merged") 
  }

  getVideoFileList(date: String) { 
    this.folderName = date;
    this.configService.getFileList(date)
    .subscribe(
    (response) => {   
      this.videoFiles = (response as any).data;  
    });
  }

  startMerging(folder: String) { 
    this.httpErrMsg = "";
    this.configService.startMerging(folder)
    .subscribe(
    (response) => {   
      if (response && (response as any).message) {
        this.httpErrMsg = (response as any).message;
      }
    });
  }

  queryMergingStatus(folder: String) {
    this.httpErrMsg = "";
    this.progressModels = [];
    this.configService.getMergeStatus(folder)
    .subscribe(
    (response) => {   
      if (response && (response as any).data) {
        let data = (response as any).data; 
        let arrKeys = Object.keys((response as any).data);
        for (let aa of arrKeys) { 
          let b = data[aa];  
          var targetsize = "";
          if (b.data.targetSize) {
            targetsize = (b.data.targetSize / 1000) as any
          }   
          this.progressModels.push({
            "name": aa,
            "timemark": b.data.timemark,
            "status": b.status,
            "targetsize": targetsize, 
          })
        }
      } else if (response && (response as any).message) {
        this.httpErrMsg = (response as any).message;
      }
    });
  }

}
