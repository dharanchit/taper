import { CachingType, StatusEnum } from "./types";
import fs from 'fs';

class LRU {
    capacity: number;
    type: string;
    cacheMap: Map<string, string>;
    fileData: string;
    readStatus: StatusEnum;
    writeStatus: StatusEnum;

    constructor(capacity: number, type: CachingType) {
        this.capacity = capacity;
        this.type = type.value;
        this.cacheMap = new Map();
        this.fileData = '';
        this.readStatus = StatusEnum.INIT;
        this.writeStatus = StatusEnum.INIT;
    }

    fileOps(method: string) {
        if (method === 'write') {
            const writeStream = fs.createWriteStream('/tmp/cache.json');
            writeStream.on('open', (fd) => {
                console.log('Opened a new file to write')
                this.writeStatus = StatusEnum.STARTED;
                writeStream.write(this.fileData);
            }).on('end', () => {
                console.log(this.fileData, "end");
                this.writeStatus = StatusEnum.COMPLETED;
                writeStream.end();
            });
        } else {
            const readStream = fs.createReadStream('/tmp/cache.json');
            readStream.on('open', (e) => {
                console.log('File Opened');
                this.readStatus = StatusEnum.STARTED;
            }).on('data', (chunk) => {
                this.fileData = Buffer.from(chunk).toString('utf-8');
            }).on('end', () => {
                this.readStatus = StatusEnum.COMPLETED;
                console.log('Read completed')
            });
        }
    }

    get(key: string) {
        if(this.type === 'in-memory') {
            if (this.cacheMap.has(key)){
                const value = this.cacheMap.get(key);
                this.cacheMap.delete(key);
                this.cacheMap.set(key, value);
                return value;
            }
            return false;
        }
        else {
            this.fileOps("read");
            let poll = setInterval(() => {
                if (this.readStatus === StatusEnum.COMPLETED) {
                    let parsedData = JSON.parse(this.fileData);
                    if (parsedData.hasOwnProperty(key)) {
                        const value = parsedData[key];
                        this.fileData = JSON.parse(this.fileData);
                        console.log(this.fileData, "old");
                        delete this.fileData[key];
                        this.fileData = Object.assign(this.fileData, {[key]: value});
                        console.log(this.fileData, "new");
                        this.fileData = JSON.stringify(this.fileData);
                        this.fileOps('write')
                        let writePoll = setInterval(() => {
                            if (this.writeStatus === StatusEnum.COMPLETED) {
                                console.log(value);
                                clearInterval(writePoll);
                            }
                            console.log('Polling New File Write');
                        }, 1000)
                    } else {
                        console.log(false);
                    }
                    clearInterval(poll);
                }
            }, 1000);
        }
    }

    set(key: string, value: string) {
        if(this.type === 'in-memory'){
            if (this.cacheMap.has(key)) {
                this.cacheMap.delete(key)
            }

            this.cacheMap.set(key, value);
            if (this.cacheMap.size > this.capacity) {
                const firstKey = this.cacheMap.entries().next().value[0];
                this.cacheMap.delete(firstKey)
            }
            return this.cacheMap[key];
        } else {
            if (this.fileData.length) {
                this.fileData = JSON.parse(this.fileData);

                if (Object.keys(this.fileData).length > this.capacity) {
                    const firstKey = Object.keys(this.fileData)[0];
                    delete this.fileData[firstKey];
                }
                this.fileData = Object.assign(this.fileData, {[key]: value})
                this.fileData = JSON.stringify(this.fileData);
            } else {
                this.fileData = JSON.stringify({[key] : value});
            }
            this.fileOps("write");

        }
    }

    log() {
        console.log(this.cacheMap);
    }
}

const lruObj = new LRU(2, {value: 'disk'});
// lruObj.set("2", "10", {value: "in-memory"});
// lruObj.set("10", "15", {value: "in-memory"});
// lruObj.log();
// lruObj.get("2", {value: 'in-memory'});
// lruObj.set("11", "12", {value: 'in-memory'});
// lruObj.log();

lruObj.set("2", "10");
lruObj.set("4", "10");
lruObj.set("6", "15");
lruObj.get("4");
lruObj.get("11");