import express from "express";
const app1 = express();
app1.use(express.static("app1"));
app1.listen(3000);
