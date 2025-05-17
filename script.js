
const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let serialPort, writer;

async function init() {
  model = await tmImage.load(URL + "model.json", URL + "metadata.json");
  maxPredictions = model.getTotalClasses();

  try {
    webcam = new tmImage.Webcam(224, 224, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    window.requestAnimationFrame(loop);
  } catch (err) {
    console.error("حدث خطأ أثناء محاولة تشغيل الكاميرا:", err);
    alert("⚠️ لم نستطع فتح الكاميرا. تأكد من السماح للمتصفح بالوصول إليها.");
  }

  labelContainer = document.getElementById("label");
}

async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  prediction.sort((a, b) => b.probability - a.probability);
  const topClass = prediction[0];
  const label = topClass.className;
  const confidence = (topClass.probability * 100).toFixed(2);
  labelContainer.innerText = `الحالة: ${label} (${confidence}%)`;

  const letterMap = {
    right: "r",
    left: "l",
    stop: "s",
    back: "b",
    front: "f"
  };

  const charToSend = letterMap[label.toLowerCase()] || "";

  if (writer && charToSend) {
    try {
      await writer.write(charToSend);
      console.log("📤 تم إرسال:", charToSend);
    } catch (err) {
      console.error("❌ فشل الإرسال إلى Arduino:", err);
    }
  }
}

async function connectSerial() {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });

    const encoder = new TextEncoderStream();
    encoder.readable.pipeTo(serialPort.writable);
    writer = encoder.writable.getWriter();

    alert("✅ تم الاتصال بـ Arduino بنجاح!");
  } catch (err) {
    alert("❌ فشل الاتصال بـ Arduino: " + err);
  }
}

init();
