const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3001;

// ทดสอบ server
app.get("/api/test", (req, res) => {
  res.json({
    status: "Tuya server working"
  });
});

// จำลองการอ่าน Tuya (เดี๋ยวจะต่อ API จริง)
async function getTuyaStatus() {

  return {
    result: [
      { code: "cur_voltage", value: 2188 },
      { code: "cur_current", value: 527 },
      { code: "cur_power", value: 586 },
      { code: "add_ele", value: 7510460 }
    ]
  };

}

// API สำหรับ Solar Monitor
app.get("/api/tuya-status", async (req, res) => {

  try {

    const data = await getTuyaStatus();

    let voltage = 0;
    let current = 0;
    let power = 0;
    let energy = 0;

    data.result.forEach(dp => {

      if (dp.code === "cur_voltage") voltage = dp.value / 10;
      if (dp.code === "cur_current") current = dp.value / 1000;
      if (dp.code === "cur_power") power = dp.value;
      if (dp.code === "add_ele") energy = dp.value / 100;

    });

    res.json({
      voltage,
      current,
      power,
      energy
    });

  } catch (error) {

    res.json({
      error: "Tuya read error"
    });

  }

});

app.listen(PORT, () => {

  console.log(`Tuya server running on port ${PORT}`);

});