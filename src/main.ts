import isOnline from "is-online";
import fs from "fs/promises";
import { v4 } from 'uuid';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());

const freqInternetDuration = 60000;
let prevIsOnline = true;

const statusEnum = {
  offline: 'offline',
  justOffline: 'justOffline',
  online: 'online',
  justOnline: 'justOnline',
};

(async () => {
  try {
    let id = v4();
    setInterval(async () => {
      const resultIsOnline: boolean = await isOnline();
      await getLogs();
      
      // Log that we don't have internet
      const date = new Date();
      if (!resultIsOnline && prevIsOnline) {
        prevIsOnline = false;
        await writeLog(id, date, statusEnum.justOffline)
        console.log(`${date}: Internet just went down`);
      }
      if (resultIsOnline && !prevIsOnline) {
        prevIsOnline = true;
        await writeLog(id, date, statusEnum.justOnline)
        console.log(`${date}: Internet is back up`);
        id = v4();
      }
      if (resultIsOnline && prevIsOnline) {
        console.log(`${date}: Internet is working`);
      }
      if (!resultIsOnline && !prevIsOnline) {
        console.log(`${date}: Internet is not working`);
      }
    }, freqInternetDuration);
    app.listen(8080, () => console.log('Server started'));
  } catch (error) {
    console.error('ERROR - Failed to start', error);
    process.exit(1);
  }
})();

const getLogs = async () => {
  const logs: any = await fs.readFile('./log.json')
  return JSON.parse(logs);
}

const writeLog = async (id, date, status) => {
  const logs = await getLogs();
  logs.push({
    id,
    date,
    status,
  });
  await fs.writeFile('./log.json', JSON.stringify(logs, null, 2));
}

app.get('/logs', async (_, res) => {
  const logs = await getLogs();
  res.json(logs);  
});
