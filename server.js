const http=require("http")
const fs=require("fs")
const {TuyaContext}=require("@tuya/tuya-connector-nodejs")

/* CONFIG */

const ACCESS_ID="n8mk9r8yxmrrjkcnxcaa"
const ACCESS_SECRET="7c3d743b128a4d4d9374c2602b82025a"

const DEVICE_METER="eb05c25bc0a2e77f74zp0r"
const DEVICE_SOLAR="35162172483fda634069"

const RATE=4.40

const context=new TuyaContext({
baseUrl:"https://openapi.tuyaus.com",
accessKey:ACCESS_ID,
secretKey:ACCESS_SECRET
})

/* GRAPH DATA */

let graphData={
solar:new Array(1440).fill(null),
load:new Array(1440).fill(null),
day:new Date().getDate()
}

try{
graphData=JSON.parse(fs.readFileSync("graph_data.json"))
}catch{}

/* MIDNIGHT ENERGY */

let midnightData
try{
midnightData=JSON.parse(fs.readFileSync("midnight_energy.json"))
}catch{
midnightData={day:new Date().getDate(),energy:0}
}

/* DECODE PHASE */

function decodePhaseA(base64){

const buf=Buffer.from(base64,"base64")

let voltage=0
let power=0

if(buf.length>=2)
voltage=buf.readUInt16BE(0)/10

if(buf.length>=8)
power=buf.readUInt16BE(6)

return {voltage,power}
}

/* SERVER */

const server=http.createServer(async(req,res)=>{

if(req.url==="/power"){

try{

const meter=await context.request({
path:`/v1.0/devices/${DEVICE_METER}/status`,
method:"GET"
})

const solar=await context.request({
path:`/v1.0/devices/${DEVICE_SOLAR}/status`,
method:"GET"
})

let power=0
let voltage=0
let current=0
let energyTotal=0

let solarPower=0
let solarToday=0

/* METER */

meter.result.forEach(i=>{

if(i.code==="phase_a"){

const data=decodePhaseA(i.value)

power=Math.round(data.power)
voltage=data.voltage

}

if(i.code==="total_forward_energy")
energyTotal=i.value/100

})

if(voltage>0)
current=(power/voltage).toFixed(2)

/* SOLAR */

solar.result.forEach(i=>{

if(i.code==="cur_power")
solarPower=Math.round(i.value/10)

if(i.code==="today_energy")
solarToday=i.value/100

})

/* MIDNIGHT RESET */

let today=new Date().getDate()

if(today!==midnightData.day){

midnightData={
day:today,
energy:energyTotal
}

fs.writeFileSync("midnight_energy.json",JSON.stringify(midnightData))

graphData={
solar:new Array(1440).fill(null),
load:new Array(1440).fill(null),
day:today
}

}

/* HOUSE ENERGY */

let houseToday=energyTotal-midnightData.energy

/* TODAY ENERGY BALANCE */

let netToday=houseToday-solarToday
let costToday=netToday*RATE

/* REAL GRID ENERGY */

let selfUse=Math.min(solarToday,houseToday)
let gridUse=houseToday-selfUse
let realCost=gridUse*RATE

/* GRAPH SAVE */

let now=new Date()
let index=now.getHours()*60+now.getMinutes()

graphData.solar[index]=solarPower
graphData.load[index]=power

fs.writeFileSync("graph_data.json",JSON.stringify(graphData))

/* RESPONSE */

const data={

solar:solarPower,
house:power,
grid:solarPower-power,

voltage:voltage,
current:current,

solarToday:solarToday.toFixed(2),
houseToday:houseToday.toFixed(2),
netToday:netToday.toFixed(2),
costToday:costToday.toFixed(2),

gridUse:gridUse.toFixed(2),
realCost:realCost.toFixed(2),

solarGraph:graphData.solar,
loadGraph:graphData.load

}

res.writeHead(200,{'Content-Type':'application/json'})
res.end(JSON.stringify(data))

}catch(e){

console.log(e)
res.writeHead(500)
res.end("error")

}

return
}

if(req.url==="/"||req.url==="/dashboard.html"){

const html=fs.readFileSync("dashboard.html")

res.writeHead(200,{'Content-Type':'text/html'})
res.end(html)

return
}

res.writeHead(404)
res.end()

})

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{

console.log("⚡ Solar Monitor V7.1.1 Patch")
console.log("http://localhost:"+PORT+"/dashboard.html")

})