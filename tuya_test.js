const axios = require("axios");
const crypto = require("crypto");

const accessId = "n8mk9r8yxmrrjkcnxcaa";
const accessKey = "7c3d743b128a4d4d9374c2602b82025a";

const baseUrl = "https://openapi.tuyaus.com";

function sign(method, url, token=""){

    const t = Date.now().toString();

    const contentHash = crypto
        .createHash("sha256")
        .update("")
        .digest("hex");

    const stringToSign =
        method + "\n" +
        contentHash + "\n" +
        "\n" +
        url;

    let signStr;

    if(token){
        signStr = accessId + token + t + stringToSign;
    }else{
        signStr = accessId + t + stringToSign;
    }

    const sign = crypto
        .createHmac("sha256", accessKey)
        .update(signStr)
        .digest("hex")
        .toUpperCase();

    return {sign,t};
}

async function getToken(){

    const url="/v1.0/token?grant_type=1";

    const s=sign("GET",url);

    const res=await axios.get(baseUrl+url,{
        headers:{
            client_id:accessId,
            sign:s.sign,
            t:s.t,
            sign_method:"HMAC-SHA256"
        }
    });

    return res.data.result.access_token;
}

async function getDevices(token){

    const url="/v1.0/iot-02/assets/devices?page_no=1&page_size=50";

    const s=sign("GET",url,token);

    const res=await axios.get(baseUrl+url,{
        headers:{
            client_id:accessId,
            access_token:token,
            sign:s.sign,
            t:s.t,
            sign_method:"HMAC-SHA256"
        }
    });

    console.log("\nDEVICE LIST\n");
    console.log(JSON.stringify(res.data,null,2));
}

async function run(){

    console.log("\nCONNECTING TO TUYA CLOUD...\n");

    const token=await getToken();

    console.log("TOKEN OK\n");

    await getDevices(token);
}

run();