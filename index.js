const express=require('express');
const app=express();

require('dotenv').config();
connectDB=require('./config/db');
connectDB();
app.set('view engine','ejs');
app.set('views','./views');

app.use(express.json());
app.use(express.urlencoded({extended:false}));

const path=require('path');
app.use(express.static(path.join(__dirname, "public")));

app.get('/',(req,res)=>{
    // res.send('Hello World!');
    res.render('index');
});

app.listen(3000,()=>{
    console.log('Server is running on http://localhost:3000');
})