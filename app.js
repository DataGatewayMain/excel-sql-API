// express app
const express = require("express")
const app = express()

// environment import
require("dotenv/config")

// mysql module import
const mysql = require("mysql")

// module import for integration
const cors = require("cors")

// for xlsx file import
const xlsx = require('xlsx');

// for file uploadation import
const multer = require("multer")
const path = require('path');
const fs = require('fs');

// middleware
app.use(express.json());
app.use(cors());

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload
const upload = multer({
  storage: storage
}).single('files'); // 'file' should match the name attribute in your HTML form

// Route for file upload
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Read uploaded file
    const filePath = req.file.path;
    // Process the file and convert data to SQL format
    processData(filePath);
  });
});

// Function to process data from file
async function processData(filePath) {
  // Read the xlsx file
  const workbook = xlsx.readFile(filePath);
  // Assuming there is only one sheet in the xlsx file, if there are multiple sheets, you can specify the sheet name or index
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Parse data from the sheet
  const data = xlsx.utils.sheet_to_json(sheet);
  // Log the parsed data to check if the fields are present
  console.log("Parsed Data:", data);

  // Convert data to SQL format (an array of arrays representing rows)
  const dataToStore = data.map(row => [
    row.First_Name, row.last_name, row.email_address, row.company_name, row.company_domain, 
    row.job_title, row.job_function, row.job_level, row.Company_Address, row.city, row.State, 
    row.Zip_Code, row.country, row.Telephone_Number, row.Employee_Size, row.Industry, 
    row.Company_Link, row.Prospect_Link, row.pid, row.region, row.email_validation
  ]);

  // Update existing records
  const updatedRowCount = await updateExistingRecords(dataToStore);

  // Get the count before and after submitting the data
  const countBefore = await getCountFromDatabase();
  await insertDataIntoDatabase(dataToStore);
  const countAfter = await getCountFromDatabase();
  const insertedRowsCount = countAfter - countBefore;
  
  // Response
  res.status(200).json({
    success: true,
    message: 'File uploaded and data stored successfully',
    updatedRowCount: updatedRowCount,
    insertedRowsCount: insertedRowsCount,
    countBefore: countBefore,
    countAfter: countAfter
  });
}

// Function to update existing records
function updateExistingRecords(dataToStore) {
  return new Promise((resolve, reject) => {
    let updatedRowCount = 0;
    dataToStore.forEach(row => {
      const sqlUpdate = 'UPDATE all_people SET First_Name = ?, last_name = ?, email_address = ?, company_name = ?, company_domain = ?, job_title = ?, job_function = ?, job_level = ?, Company_Address = ?, city = ?, State = ?, Zip_Code = ?, country = ?, Telephone_Number = ?, Employee_Size = ?, Industry = ?, Company_Link = ?, pid = ?, region = ?, email_validation = ? WHERE Prospect_Link = ?';
      pool.query(sqlUpdate, row, (err, results) => {
        if (err) {
          console.error('Error updating record: ', err);
          reject(err);
        } else {
          updatedRowCount++;
        }
      });
    });
    resolve(updatedRowCount);
  });
}

// Function to insert data into database
function insertDataIntoDatabase(dataToInsert) {
  return new Promise((resolve, reject) => {
    const sqlInsert = 'INSERT INTO all_people (First_Name, last_name, email_address, company_name, company_domain, job_title, job_function, job_level, Company_Address, city, State, Zip_Code, country, Telephone_Number, Employee_Size, Industry, Company_Link, pid, region, email_validation, Prospect_Link) VALUES ?';
    pool.query(sqlInsert, [dataToInsert], (err, results) => {
      if (err) {
        console.error('Error inserting new records: ', err);
        reject(err);
      } else {
        console.log('Data inserted into database');
        resolve();
      }
    });
  });
}

// Function to get count from database
function getCountFromDatabase() {
  return new Promise((resolve, reject) => {
    const sqlCount = 'SELECT COUNT(*) AS count FROM all_people';
    pool.query(sqlCount, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
}

// By-Default Get-req
app.get("/", (req, res) => {
    res.send("Welcome To Uploadation API!!")
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running at ${process.env.PORT}!`);
});

// Create a MySQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'srv1391.hstgr.io',
    user: 'u858543158_VectorDB_user1',
    password: 'm[EB9jp6R15',
    database: 'u858543158_VectorDB'
});

// Connect to the database
pool.getConnection((err) => {
    if (err) {
      console.error('Error connecting to MySQL database: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL database!!');
});
