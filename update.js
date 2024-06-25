import * as fs from "fs";
import { exec } from 'child_process';
import "dotenv/config";
import { createServer } from "https";
import express from 'express';
const app = express();
const server = createServer({
    cert: fs.readFileSync(process.env.PATH_TO_CERT),
    key: fs.readFileSync(process.env.PATH_TO_KEY),
  }, app);

app.get('/update', (req, res) => {
    if (req.query.b == 'AXX') {
        update();
    }
  res.send('Updated!');
})
function update() {
 exec('git pull');
 exec('npm install');
 process.chdir('./new-front');
 exec('cp -r * /var/www/html');
 exec('systemctl restart andback');
}

server.listen(8082);