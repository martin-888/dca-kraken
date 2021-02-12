const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(404).send("");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})