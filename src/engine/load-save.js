import { remote } from "electron";
import * as path from "path";
import * as fs from "fs";

export default class LoadSaveStore {
  constructor() {
    this.saveFileName = "open-sourceror-savegame.json";

    const userDataPath = remote.app.getPath("userData");
    this.path = path.join(userDataPath, saveFileName);
    this.saveData = {};
  }
  saveFileExists() {
    return fs.existsSync(this.path);
  }
  load() {
    const rawContents = fs.readFileSync(this.path);
    this.saveData = JSON.parse(rawContents);
    return this.saveData;
  }
  save(data) {
    fs.writeFileSync(this.path, JSON.stringify(this.saveData));
  }
}
