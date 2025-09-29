import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE_NAME,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT_NUMBER
});
db.connect();


app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

//Homepage
app.get("/" , async (req, res) => {
    try {
        res.sendFile("index.html", { root: "public" });
    } catch(err) {
        console.log(err);
    }
});

//inserting user info and hashed password to db when signing up
app.post("/signup", async (req, res) => {
    try {
        const { fullname, email, phonenumber, username, password } = req.body;

        if (!fullname || !email || !phonenumber || !username || !password) {
            return res.json({Error: "All fields are required"});
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await db.query(
        "INSERT INTO signup (full_name, email_address, phone_number, username, password) VALUES ($1, $2, $3, $4, $5)",
        [
            req.body.fullname, 
            req.body.email, 
            req.body.phonenumber, 
            req.body.username, 
            hashedPassword
        ]
        );
        res.redirect("/home.html");
    
    } catch(err) {
        console.log("Sign Up error:", err);
        res.json({Error: "Sign Up failed. Please try again later."});

    }
});

app.post("/login", async(req, res) => {
    try {
        const { username, password } = req.body;

        const result = await db.query(
            "SELECT username, password FROM signup WHERE username = $1", 
            [username]
        );
        // console.log(result);

        if(result.rows.length === 0) {
            return res.json({Error: "User not found"});
        }
        // compare hashed password stored in db to user password entered
        const storedHashedPassword = result.rows[0].password;
        const matchedPassword = await bcrypt.compare(password, storedHashedPassword);

        if (matchedPassword) {
            //res.json({message: "Login successful."});
            return res.redirect("/home.html");
        } else {
            //res.json({message: "Invalid password."});
            return res.send("Invalid password");
        }

    } catch(err) {
        console.log("Login error:", err);
        return res.json({error: "Login failed. Please try again later."});
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});