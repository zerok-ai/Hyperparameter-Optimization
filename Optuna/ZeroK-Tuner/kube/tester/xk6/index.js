const express = require('express')
const pkill = require('pkill');
const fs = require('fs');
const app = express()
const port = 3000

const execute = require('child_process').exec
var running = false;
app.get('/start', (req, res) => {
    if(running) {
        status((data) => res.send(data.toString()));
        return;
    }
    running = true;
    try {
        run();
        res.send('Started');
    } catch(error) {
        running = false;
        res.send(error);
        return;
    }
})

app.get('/reset', (req, res) => {
    running = false;
    pkill.full('k6');
    res.send("Reset done");
})

app.get('/status', (req, res) => {
    status((data) => res.send(data.toString()));
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

async function run() {
    try {
        console.log("init test run");
        // const passwdContent = await execute("cat /etc/passwd");
        execute('sh ./run_xk6.sh', (err, stdout, stderr) => {
            console.log(err, stdout, stderr)
            if(err === null) {
                running = false;
            }
        })
    } catch (error) {
        console.error(error.toString());
    }
}

async function status(callback) {
    fs.readFile('./lastrun.log', function read(err, data) {
        if (err) {
            throw err;
        }
        content = data;
        const template = "<html><body><pre> " + content + "</pre></body></html>";
        callback(template);
    });
}