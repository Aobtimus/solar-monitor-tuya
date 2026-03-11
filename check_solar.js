const {TuyaContext} = require("@tuya/tuya-connector-nodejs")

const ACCESS_ID="n8mk9r8yxmrrjkcnxcaa"
const ACCESS_SECRET="7c3d743b128a4d4d9374c2602b82025a"

const DEVICE_SOLAR="35162172483fda634069"

const context=new TuyaContext({
baseUrl:"https://openapi.tuyaus.com",
accessKey:ACCESS_ID,
secretKey:ACCESS_SECRET
})

async function run(){

const solar=await context.request({
path:`/v1.0/devices/${DEVICE_SOLAR}/status`,
method:"GET"
})

console.log(JSON.stringify(solar.result,null,2))

}

run()