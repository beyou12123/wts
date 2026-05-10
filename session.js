const { createSession, sessions } = require("./whatsapp");
const QRCode = require("qrcode");

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();

router.get("/create", (req, res) => {

    const sessionId = crypto.randomUUID();

    const sessionPath = path.join(__dirname, "sessions", sessionId);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    createSession(sessionId);

    res.json({
        success: true,
        sessionId: sessionId,
        connectUrl: `/session/${sessionId}`
    });

});


/* =========================
   NEW: LIVE STATUS API
========================= */
router.get("/status/:id", (req, res) => {

    const sessionId = req.params.id;

    if (!sessions[sessionId]) {
        return res.json({
            success: false,
            message: "Session not found"
        });
    }

    return res.json({
        success: true,
        connected: !!sessions[sessionId].connected,
        qr: sessions[sessionId].qr || null
    });

});


router.get("/:id", async (req, res) => {

    const sessionId = req.params.id;

    if (!sessions[sessionId]) {
        return res.status(404).send("Session not found");
    }

    let qrImage = "";

    if (sessions[sessionId].qr) {

        qrImage = await QRCode.toDataURL(
            sessions[sessionId].qr
        );

    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Session ${sessionId}</title>
        </head>
        <body>

            <h1>WhatsApp Session</h1>

            <p><strong>Session ID:</strong> ${sessionId}</p>

            <p id="status">
                Status:
                ${
                    sessions[sessionId].connected
                    ? "Connected"
                    : "Waiting for scan"
                }
            </p>

            <div id="qr">
                ${
                    qrImage
                    ? `<img src="${qrImage}" width="300" />`
                    : "<p>No QR yet...</p>"
                }
            </div>

            <!-- LIVE UPDATE SCRIPT -->
            <script>

                async function updateSession() {

                    try {

                        const res = await fetch("/session/status/${sessionId}");
                        const data = await res.json();

                        if (!data.success) return;

                        document.getElementById("status").innerHTML =
                            "Status: " + (data.connected ? "Connected" : "Waiting for scan");

                        if (data.qr) {
                            document.getElementById("qr").innerHTML =
                                '<img width="300" src="https://api.qrserver.com/v1/create-qr-code/?data='
                                + encodeURIComponent(data.qr)
                                + '" />';
                        } else if (data.connected) {
                            document.getElementById("qr").innerHTML =
                                "<p>Connected - QR removed</p>";
                        }

                    } catch (err) {
                        console.log("update error", err);
                    }

                }

                setInterval(updateSession, 2000);
                updateSession();

            </script>

        </body>
        </html>
    `);

});


module.exports = router;