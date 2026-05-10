const express = require("express");
const path = require("path");

const sessionRoutes = require("./session");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use("/session", sessionRoutes);

/* =========================
   HOME PAGE (FIXED)
   ========================= */
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Bot</title>
</head>
<body>

    <h1>WhatsApp Multi Session Bot</h1>

    <p>Use /session/create to create a new session</p>

</body>
</html>
`);
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});