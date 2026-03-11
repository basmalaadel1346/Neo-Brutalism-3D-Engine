export function initGyroscope() {
    const motionBtn = document.getElementById('enable-motion');

    if (!motionBtn) return;

    motionBtn.addEventListener('click', async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    activateGyroscope(motionBtn);
                } else {
                    alert("تم رفض صلاحية الوصول لحساسات الحركة.");
                }
            } catch (error) {
                console.error("حدث خطأ في طلب الصلاحية:", error);
            }
        } else {
            activateGyroscope(motionBtn);
        }
    });
}

function activateGyroscope(motionBtn) {
    window.addEventListener('deviceorientation', (event) => {
        let tiltX = event.beta;
        let tiltY = event.gamma;

        const maxTilt = 30;
        tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
        tiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY));

        const normalizedX = tiltY / maxTilt;
        const normalizedY = tiltX / maxTilt;

        document.querySelectorAll('.card').forEach(card => {
            card.style.setProperty('--rx', `${normalizedY * 15}deg`);
            card.style.setProperty('--ry', `${normalizedX * 15}deg`);
        });
    });

    motionBtn.innerText = "✅ الحساسات تعمل";
    motionBtn.style.backgroundColor = "#4caf50";
    motionBtn.style.color = "white";
    motionBtn.disabled = true;
}