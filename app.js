// express app
const express = require("express")
const app = express()

// environmentl import
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




  //  jksdddddd
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
    const dataToStore = processData(filePath);

    // Check if any records with the same Prospect_Link exist in the database
    const existingProspectLinks = dataToStore.map(row => row[16]); // Assuming Prospect_Link is at index 16
    const sqlCheckExisting = 'SELECT Prospect_Link FROM all_people WHERE Prospect_Link IN (?)';
    pool.query(sqlCheckExisting, [existingProspectLinks], (err, results) => {
      if (err) {
        console.error('Error checking existing records: ', err);
        return res.status(500).json({ success: false, message: "Error checking existing records" });
      }

      const existingLinks = results.map(row => row.Prospect_Link);

      // Separate data into two arrays: one for updating existing records and one for inserting new records
      const dataToUpdate = [];
      const dataToInsert = [];

      dataToStore.forEach(row => {
        if (existingLinks.includes(row[16])) { // Assuming Prospect_Link is at index 16
          dataToUpdate.push(row);
        } else {
          dataToInsert.push(row);
        }
      });

      // Update existing records
     const sqlUpdate = 'UPDATE all_people SET First_Name = ?, last_name = ?, email_address = ?, company_name = ?, company_domain = ?, job_title = ?, job_function = ?, job_level = ?, Company_Address = ?, city = ?, State = ?, Zip_Code = ?, country = ?, Telephone_Number = ?, Employee_Size = ?, Industry = ?, Company_Link = ?, pid = ?, region = ?, email_validation = ? WHERE Prospect_Link = ?';
      dataToUpdate.forEach(row => {
        const params = row.slice(0, 19); // Assuming 19 parameters
        params.push(row[16]); // Assuming Prospect_Link is at index 16
        pool.query(sqlUpdate, params, (err, results) => {
          if (err) {
            console.error('Error updating record: ', err);
          }
        });
      });

      // Insert new records
      const sqlInsert = 'INSERT INTO all_people (First_Name, last_name, email_address, company_name, company_domain, job_title, job_function, job_level, Company_Address, city, State, Zip_Code, country, Telephone_Number, Employee_Size, Industry, Company_Link, pid, region, email_validation, Prospect_Link) VALUES ?';
      pool.query(sqlInsert, [dataToInsert], (err, results) => {
        if (err) {
          console.error('Error inserting new records: ', err);
         return res.status(500).json({ success: false, message: "Error inserting new records" });
        }
        console.log('Data inserted into database');
        res.status(200).json({ success: true, message: 'File uploaded and data stored successfully' });
      });

    });
  });
});


function processData(filePath) {
// Read the xlsx file
const workbook = xlsx.readFile(filePath);
// Assuming there is only one sheet in the xlsx file, if there are multiple sheets, you can specify the sheet name or index
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
// Parse data from the sheet
const data = xlsx.utils.sheet_to_json(sheet);
// Log the parsed data to check if the fields are present
console.log("Parsed Data:", data);


   // Check if the values for Company_Address, city, and State are present and correctly formatted
   data.forEach(row => {
    console.log("Company_Address:", row.Company_Address);
    console.log("city:", row.city);
    console.log("State:", row.State);
});


 // Convert data to SQL format (an array of arrays representing rows)
 const dataToStore = data.map(row => {
  // Check if Company_Address, city, and State are empty or missing
  const companyAddress = row.Company_Address || 'Unknown';
  const city = row.city || 'Unknown';
  const state = row.State || 'Unknown';

  return [
      row.First_Name, row.last_name, row.email_address, row.company_name, row.company_domain, 
      row.job_title, row.job_function, row.job_level, companyAddress, city, state, row.Zip_Code, 
      row.country, row.Telephone_Number, row.Employee_Size, row.Industry, row.Company_Link, 
      row.Prospect_Link, row.pid, row.region, row.email_validation
  ];
});

return dataToStore;
}

// By-Default Get-req
app.get("/", (req, res) => {
    res.send("Welcome To Uploadation API!!")
})

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running at 5000!`);
});


// Create a MySQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'srv1391.hstgr.io',
    user: 'u858543158_VectorDB_user1',
    password: 'm[EB9jp6R15',
    database: 'u858543158_VectorDB'
})

// Connect to the database
pool.getConnection((err) => {
    if (err) {
      console.error('Error connecting to MySQL database: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL database!!');
});











  


