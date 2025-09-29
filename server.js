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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

//inserting user info and hashed password to db when signing up
async function passwordHashing(originalPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(originalPassword, saltRounds);

    await db.query(
        "INSERT INTO signup (full_name, email_address, phone_number, username, password) VALUES ($1, $2, $3, $4, $5)",
        [full_name, email_address, phone_number, username, hashedPassword]
    );
}

app.get("/" , async (req, res) => {
    try {
        res.sendFile("home.html", {root: "public"});
    } catch(err) {
        console.log(err);
    }
});
app.post("/login", async(req, res) => {
    try{
        const { username, password } = req.body;
        const result = await db.query(
            "SELECT password FROM signup WHERE username = $1",
            [username]
        );

        if(result.rows.length === 0) {
            return res.json({Error: "User not found"});
        }
        // hashed password stored in db
        const storedHashedPassword = result.rows[0].password;
        const matchedPassword = await bcrypt.compare(password, storedHashedPassword);

        if (matchedPassword) {
            return res.json({message: "Login successful"});
        } else {
            return res.json({message: "Invalid password."})
        }

    } catch (err) {
        console.log("Login error:", err);
        res.json({error: "Login failed. Please try again later."})
    };
});

app.post("/signup", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT username, password FROM signup", 
            [username, password]
        );

        if (result) {
            res.redirect("/");
        } else {
            res.redirect("/signup");
        }
        
    } catch (err) {
        console.log("Sign Up error:", err);
        res.json({Error: "Sign Up failed. Please try again later."})
    }
});




app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});