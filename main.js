document.addEventListener('DOMContentLoaded', function() {
    console.log('全畫面波浪動畫已載入！');
    
    // 建立 canvas 元素並插入 body
    let canvas = document.getElementById('waveCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'waveCanvas';
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    
    // 設定基本參數，使用隨機值
    const verticalCenter = window.innerHeight * (0.3 + Math.random() * 0.4); // 隨機位置在畫面30%-70%之間
    let baseAmplitude = (97.5 + Math.random() * 39); // 增加 30%（從 75-105 增加到 97.5-136.5）
    
    // 波形參數 - 使用隨機值初始化
    const waveParams = {
        frequency: (0.0013 + Math.random() * 0.00195), // 增加 30%
        phase: Math.random() * Math.PI * 2, // 隨機相位
        speed: 0.01 + Math.random() * 0.02, // 隨機速度
        horizontalSpeed: 1 + Math.random() * 0.5, // 水平移動速度 (每幀移動的像素數)
        floatSpeed: 0.0008 + Math.random() * 0.0004, // 飄浮速度
        floatAmplitude: 30 + Math.random() * 20 // 飄浮幅度
    };
    
    // 用於創建自然變化的多個波
    const subWaves = [
        { 
            frequency: waveParams.frequency * (0.325 + Math.random() * 0.13), // 增加 30%
            amplitude: baseAmplitude * 0.195, // 增加 30%
            speed: waveParams.speed * 0.7,
            phase: Math.random() * Math.PI * 2
        },
        { 
            frequency: waveParams.frequency * (0.975 + Math.random() * 0.195), // 增加 30%
            amplitude: baseAmplitude * 0.0975, // 增加 30%
            speed: waveParams.speed * 1.3,
            phase: Math.random() * Math.PI * 2
        }
    ];
    
    // 時間變數
    let time = Math.random() * 100; // 隨機的起始時間
    
    // 水平偏移量 - 用於實現右至左的移動
    let horizontalOffset = 0;
    
    // 儲存前一幀的波形，用於高比例平滑過渡
    let previousWavePoints = [];
    
    // 延伸參數 - 讓線條延伸到畫面外
    const extensionFactor = 0.3; // 每側延伸畫面寬度的30%

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // 重設前一幀波形
        previousWavePoints = Array(Math.ceil(canvas.width * (1 + extensionFactor * 2))).fill(verticalCenter);
    }

    // 使用平滑曲線繪製波浪
    function drawSmoothWave(points) {
        if (points.length < 2) return;
        
        const startX = -canvas.width * extensionFactor;
        
        ctx.beginPath();
        ctx.moveTo(startX, points[0]);
        
        // 使用平滑的曲線連接點
        for (let i = 1; i < points.length; i++) {
            const x = startX + i;
            ctx.lineTo(x, points[i]);
        }
        
        ctx.stroke();
    }
    
    // 自然平滑波形函數 - 加入水平偏移
    function generateWavePoint(x, time, offset, amplitudeOverride) {
        // 添加水平偏移，實現右至左移動
        const adjustedX = x + offset;
        let amplitude = amplitudeOverride !== undefined ? amplitudeOverride : baseAmplitude;
        // 主波
        let value = Math.sin(adjustedX * waveParams.frequency + time * waveParams.speed + waveParams.phase) * amplitude;
        
        // 添加子波，創造更自然的波形
        for (const wave of subWaves) {
            value += Math.sin(adjustedX * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
        }
        
        return value;
    }

    // === 產生 10 條心電圖線 ===
    const waveCount = 10;
    // 顏色動態變化（藍、粉、白）
    function getWaveColor(idx, t) {
        // 顏色在藍、粉、白之間循環
        const phase = (t / 2 + idx * 0.2) % 3;
        if (phase < 1) {
            // 藍到粉
            const r = Math.floor(0 + 255 * phase);
            const g = Math.floor(160 * (1 - phase) + 100 * phase);
            const b = Math.floor(255 - 55 * phase);
            return `rgb(${r},${g},${b})`;
        } else if (phase < 2) {
            // 粉到白
            const p = phase - 1;
            const r = Math.floor(255 - 55 * p);
            const g = Math.floor(100 + 155 * p);
            const b = Math.floor(200 + 55 * p);
            return `rgb(${r},${g},${b})`;
        } else {
            // 白到藍
            const p = phase - 2;
            const r = Math.floor(200 * (1 - p));
            const g = Math.floor(255 - 95 * p);
            const b = Math.floor(255);
            return `rgb(${r},${g},${b})`;
        }
    }
    // 心電圖波形產生器（加上震動感）
    function ekgWave(x, t, freq, amp) {
        // 週期性心電圖：P-QRS-T
        const period = 220;
        const pos = (x * freq + t * 60) % period;
        let base = 0;
        // P波
        if (pos < 30) base = amp * 0.15 * Math.sin(Math.PI * pos / 30);
        // Q波
        else if (pos < 50) base = -amp * 0.12 * Math.exp(-Math.pow((pos-40)/5,2));
        // R波
        else if (pos < 70) base = amp * 0.7 * Math.exp(-Math.pow((pos-60)/3,2));
        // S波
        else if (pos < 90) base = -amp * 0.18 * Math.exp(-Math.pow((pos-80)/4,2));
        // T波
        else if (pos < 150) base = amp * 0.25 * Math.sin(Math.PI * (pos-90)/60);
        // 基線
        return base;
    }

    // === 畫星星的函數 ===
    function drawStar(ctx, x, y, r, color) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(
                x + r * Math.cos((18 + i * 72) * Math.PI / 180),
                y - r * Math.sin((18 + i * 72) * Math.PI / 180)
            );
            ctx.lineTo(
                x + r * 0.5 * Math.cos((54 + i * 72) * Math.PI / 180),
                y - r * 0.5 * Math.sin((54 + i * 72) * Math.PI / 180)
            );
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = r * 0.7;
        ctx.fill();
        ctx.restore();
    }

    function drawWave() {
        // 增加時間
        time += 0.01;
        
        // 增加水平偏移量，實現從右到左的移動
        horizontalOffset += waveParams.horizontalSpeed;
        
        // 計算垂直位置的緩慢自然變化 - 使用新的飄浮參數
        const verticalShift = Math.sin(time * waveParams.floatSpeed) * waveParams.floatAmplitude;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 依據 latestSensorValue (0~1023) 動態調整 baseAmplitude
        let mappedAmplitude = 40 + (latestSensorValue / 1023) * 60; // 40~100
        // 背景色為黑色
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        // 星星動畫進度（0~1）
        let starProgress = isRotating ? Math.min(rotateMagnitude / 200, 1) : 0;
        // 產生 10 條心電圖線
        for (let w = 0; w < waveCount; w++) {
            let freq = 0.012 + (latestSensorValue / 1023) * 0.018 + w * 0.0015;
            let amp = mappedAmplitude * (1 - w * 0.03);
            let width = 1.2 - w * 0.045;
            let color = getWaveColor(w, time);
            const totalWidth = Math.ceil(canvas.width * (1 + extensionFactor * 2));
            const currentWavePoints = [];
            for (let i = 0; i < totalWidth; i++) {
                const x = i;
                // 垂直分布：從上到下平均分布
                let y = (canvas.height * (w + 1) / (waveCount + 1)) + ekgWave(x, time, freq, amp);
                currentWavePoints[i] = y;
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width > 0.2 ? width : 0.2;
            drawSmoothWave(currentWavePoints);
            // 旋轉時每條線上不規律地出現星星
            if (starProgress > 0) {
                // 決定這條線要畫幾顆星星（1~3顆，隨旋轉幅度與亂數）
                let starCount = 1 + Math.floor(Math.random() * 3 * starProgress);
                for (let s = 0; s < starCount; s++) {
                    // 隨機選一個區間
                    let seg = Math.floor(Math.random() * 5);
                    let segStart = Math.floor(currentWavePoints.length * seg / 5);
                    let segEnd = Math.floor(currentWavePoints.length * (seg + 1) / 5);
                    let idx = segStart + Math.floor(Math.random() * (segEnd - segStart));
                    let y = currentWavePoints[idx];
                    let starSize = 12 + starProgress * 30 + Math.random() * 8;
                    ctx.globalAlpha = 1; // 透明度100%
                    drawStar(ctx, idx - canvas.width*extensionFactor, y - starSize, starSize, '#fff9b0');
                    ctx.globalAlpha = 1;
                }
            }
            // 根據旋轉幅度與狀態決定是否顯示貓咪
            if (catLoaded && isRotating && rotateMagnitude > 30 && w === Math.floor(waveCount/2)) {
                // 在中間那條線的波峰上顯示貓咪
                let peakIdx = 0;
                let peakY = -Infinity;
                for (let j = 0; j < currentWavePoints.length; j++) {
                    if (currentWavePoints[j] > peakY) {
                        peakY = currentWavePoints[j];
                        peakIdx = j;
                    }
                }
                let catSize = 40 + Math.min(rotateMagnitude, 100); // 旋轉越大貓咪越大
                ctx.drawImage(catImg, peakIdx - catSize/2 - canvas.width*extensionFactor, peakY - catSize, catSize, catSize);
            }
        }
        requestAnimationFrame(drawWave);
    }

    window.addEventListener('resize', function() {
        resizeCanvas();
    });
    
    resizeCanvas();
    // 開始動畫循環
    requestAnimationFrame(drawWave);
});
// === Web Serial 相關變數 ===
let serialPort = null;
let serialReader = null;
let lastSensorValue = 512;
let isRotating = false;
let rotateStartValue = 512;
let rotateMagnitude = 0;
let latestSensorValue = 512; // <--- 修正：補上這一行

// === 載入貓咪圖案 ===
const catImg = new Image();
catImg.src = 'https://cdn.jsdelivr.net/gh/jasonkayzk/pic-repo/cat/cat-clipart.png'; // 可換成你想要的貓咪圖
let catLoaded = false;
catImg.onload = () => { catLoaded = true; };

// 連接按鈕事件
const connectBtn = document.getElementById('connectSerialBtn');
const statusDiv = document.getElementById('serialStatus');
connectBtn.addEventListener('click', async () => {
    if (!('serial' in navigator)) {
        statusDiv.textContent = '此瀏覽器不支援 Web Serial API';
        return;
    }
    try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 9600 });
        statusDiv.textContent = '已連接，等待資料...';
        serialReader = serialPort.readable.getReader();
        readSerialLoop();
    } catch (e) {
        statusDiv.textContent = '連接失敗: ' + e;
    }
});

// 修改 Serial 讀取，偵測是否旋轉
async function readSerialLoop() {
    let buffer = '';
    while (serialPort && serialReader) {
        try {
            const { value, done } = await serialReader.read();
            if (done) break;
            if (value) {
                buffer += new TextDecoder().decode(value);
                let lines = buffer.split('\n');
                buffer = lines.pop();
                for (let line of lines) {
                    let v = parseInt(line.trim());
                    if (!isNaN(v)) {
                        // 判斷是否旋轉
                        if (Math.abs(v - lastSensorValue) > 10) {
                            isRotating = true;
                            rotateStartValue = lastSensorValue;
                            rotateMagnitude = Math.abs(v - rotateStartValue);
                        } else {
                            isRotating = false;
                            rotateMagnitude = 0;
                        }
                        lastSensorValue = v;
                        latestSensorValue = v;
                        statusDiv.textContent = '數值: ' + v;
                    }
                }
            }
        } catch (e) {
            statusDiv.textContent = '讀取錯誤: ' + e;
            break;
        }
    }
}