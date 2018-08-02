const fs = require('fs');
const child_process = require('child_process');
const subjectParser = require('./Subject-Parser');
const MongoClient = require('mongodb').MongoClient;
const studentParser = require('./Student-Parser');


const fileName = process.argv[2].match(/Upload\/(.+?).pdf/)[1];
child_process.execSync(`pdftotext -raw Upload/${fileName}.pdf TXT/${fileName}.txt`);

const pdf = fs.readFileSync(`TXT/${fileName}.txt`, 'utf8');

const regexForStudents = /Result of Programme Code:([^]*?)\f/g;
const regexForSubjects = /S\.No\. Paper([^]*?)RESULT TAB/g;

const allStudents = pdf.match(regexForStudents);
const allSubjects = pdf.match(regexForSubjects);

// flush all available records to files
fs.writeFileSync('subjectsData.json', JSON.stringify(allSubjects, null, 2));
fs.writeFileSync('studentsData.json', JSON.stringify(allStudents, null, 2));

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/Result';
MongoClient.connect(mongoUrl, function (err, db) {
    if (err) {
        console.log("Crashed while connecting to db", err);
        process.exit();
    }

    // parse all available subjects and flush to disk,
    // later when this is done, parse and store the student
    // information available.
    subjectParser(allSubjects, db, function (subjects) {
        if (subjects.length) {
            fs.writeFileSync(`./FinalLists/Subjects/${fileName}-Subjects.txt`, JSON.stringify(subjects, null, 2));
        }

        console.log('Subjects parsed.');

        // Properly parse students and store them in MongoDB.
        studentParser(allStudents, subjects, db, function (final) {
            if (final.length) {
                fs.writeFileSync(`./FinalLists/Students/${fileName}-Students.txt`, JSON.stringify(final, null, 2));
            }

            console.log('Students parsed.');
            db.close();
        });
    });
});
