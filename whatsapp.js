const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const path = require("path");
const fs = require("fs");
const P = require("pino");

const sessions = {};

async function createSession(sessionId) {

    console.log(`[SESSION] Creating session: ${sessionId}`);


    const sessionPath = path.join(
      process.cwd(),
      "src",
      "sessions",
      sessionId
    );

    console.log(`[SESSION] Path: ${sessionPath}`);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
        console.log(`[SESSION] Folder created`);
    }

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionPath);

    console.log(`[SESSION] Auth state loaded`);

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    });

    sessions[sessionId] = {
        sock,
        qr: null,
        connected: false
    };

    console.log(`[SESSION] Socket initialized`);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

        const { connection, qr, lastDisconnect } = update;

        /* =========================
           QR LOG
        ========================= */
        if (qr) {
            sessions[sessionId].qr = qr;
            console.log(`[SESSION:${sessionId}] QR received`);
        }

        /* =========================
           CONNECTION OPEN
        ========================= */
        if (connection === "open") {

            sessions[sessionId].connected = true;

            console.log(`[SESSION:${sessionId}] CONNECTED SUCCESSFULLY`);
        }

        /* =========================
           CONNECTION CLOSE
        ========================= */
        if (connection === "close") {

            sessions[sessionId].connected = false;

            console.log(`[SESSION:${sessionId}] CONNECTION CLOSED`);

            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            console.log(`[SESSION:${sessionId}] Close code:`, statusCode);

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log(`[SESSION:${sessionId}] Reconnecting...`);

                setTimeout(() => {
                    createSession(sessionId);
                }, 3000);

            } else {
                console.log(`[SESSION:${sessionId}] Logged out - no reconnect`);
            }

        }

    });

}

module.exports = {
    createSession,
    sessions
};
