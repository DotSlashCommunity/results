const os = require('os');


var Sem             = null;
var Name            = null;
var Batch           = null;
var Examination     = null;
var Institution     = null;
var InstitutionCode = null;

var len             = 0;
var final           = [];
var currentSubjects = [];
var previousResult  = {};

module.exports = function (data, subjects, db, callback) {
    const regexForStudentsLinux = /\d{11}([^]*?)\n\w?\*?(\(..?\))?\n\w\w?\n\r/g;
    const regexForStudentsWindows = /\n\d{11}([^]*?)\n\w\w?\*?(\(..?\))?\r\n\w\w?\r/g;

    const regexForStudents = (os.platform() === 'linux')?
                                regexForStudentsLinux:
                                regexForStudentsWindows;

    data.forEach((students) => {
        var studentList = students.match(regexForStudents);

        if (studentList) {
            studentList = studentList.map((ele) => (ele.split(os.EOL)));

            Sem = students.match(/Sem\.\/Year: (\d+)/)[1];
            Name = students.match(/Programme Name: ([^]*?) Sem/)[1];

            if (students.match(/Batch: ([^]*?) Exa/))
                Batch = students.match(/Batch: ([^]*?) Exa/)[1];
            else
                return;

            Institution = students.match(new RegExp('Institution: ([^]*?)' + os.EOL))[1];
            InstitutionCode = students.match(/Institution Code: (\d+)/)[1];

            Examination = students.match(new RegExp('Examination: ([^]*?)' + os.EOL))[1];

            if (matchSubjectList())
                currentSubjects = subjects.shift();

            studentList.forEach((student) => {
                console.log(student);

                if (os.platform() === 'linux')
                    student.pop();

                var newStudent = new Student();
                newStudent.EnrollmentNumber = (os.platform() === 'linux')?
                                                student.shift():
                                                student.shift().substr(1);

                newStudent.Name = student.shift();
                newStudent.CreditsSecured = student.pop().match(/(\w+)/);
                newStudent.CreditsSecured = newStudent.CreditsSecured[1] || '';

                var present = false;
                while (student.length) {
                    const marks = new Marks();
                    const id = student.shift();

                    marks.Id = id.match(/\w+/)[0];
                    marks.Name = getNameFromCurrentList(marks.Id);

                    try { marks.Credits = id.match(/\((\w+)\)/)[1]; }
                    catch (_) {}

                    if (student.length)
                        marksValue = student.shift().split(' ');
                    else
                        return;

                    marks.Internal = marksValue[0];
                    marks.External = marksValue[1];

                    var total = student.shift();
                    if (!total) continue;

                    marks.Total = parseInt(total.match(/\w+/)[0]);
                    if (isNaN(marks.Total))
                        marks.Total = 0;
                    else
                        present = true;

                    if (total.match(/\((.+)\)/))
                        marks.Grade = total.match(/\((.+)\)/)[1];

                    newStudent.Marks.push(marks);
                }

                if (!present)
                    return;

                // Push the student data to the mongo database.
                db.collection('Student').insert(newStudent, (err) => {
                    if (err) console.error(err);
                });

                final[len++] = newStudent;
            });
        }
    });

    callback(final);
};


const Student = function() {
    this.Semester           = Sem;
    this.Programme          = Name;
    this.Batch              = Batch;
    this.Examination        = Examination;
    this.Institution        = Institution;
    this.CollegeCode        = InstitutionCode;
    this.EnrollmentNumber   = null;
    this.Name               = null;
    this.Marks              = [];
    this.CreditsSecured     = null;
};


const Marks = function () {
    this.Id         = null;
    this.Credits    = null;
    this.Internal   = null;
    this.External   = null;
    this.Total      = null;
    this.Grade      = null;
};


const matchSubjectList = function() {
    var currentResult = new Student();
    if (JSON.stringify(currentResult) === JSON.stringify(previousResult)) {
        return false;
    }

    previousResult = currentResult;
    return true;
};


const getNameFromCurrentList = function(id) {
    for (var i = 0; i < currentSubjects.length; i++) {
        if (currentSubjects[i]._id === id) {
            return currentSubjects[i].Name;
        }
    }
};
