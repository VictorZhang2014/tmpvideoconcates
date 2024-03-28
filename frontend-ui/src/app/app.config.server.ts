import { mergeApplicationConfig, ApplicationConfig, Injectable } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { HttpClient } from '@angular/common/http';
import { FolderModel, FileModel } from './app.model'; 



const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(), 
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);


@Injectable()
export class ConfigService {

  private apiUrl = "http://172.16.10.112:3000";

  constructor(private http: HttpClient) { }

  getFolderList() {
    return this.http.get<FolderModel>(`${this.apiUrl}/video/list?type=dossier`);
  }

  getFileList(folder: String) {
    return this.http.get<FileModel>(`${this.apiUrl}/video/list?type=fichier&folder=${folder}`);
  }

  startMerging(folder: String) {
    return this.http.post(`${this.apiUrl}/video/merge?folder=${folder}`, {});
  }

  getMergeStatus(folder: String) {
    return this.http.get<FileModel>(`${this.apiUrl}/video/merge/status?folder=${folder}`);
  }

}



