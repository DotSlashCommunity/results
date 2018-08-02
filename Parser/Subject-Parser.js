const os = require('os');


const final = [];
const currentList = [];
const previousList = [];

module.exports = (lists, db, callback) => {
    lists.forEach((list, index) => {
        // Get clean data about the subjects.
        var subjects = list.split(os.EOL).filter((ele) => {
            return !(/^(S\.No\.)|(RESULT)/.test(ele)||(/^\f/.test(ele)));
        });

        for (var i = 0; i < subjects.length; i++) {
            if (/^Prepared Date:/.test(subjects[i])) {
                subjects = subjects.slice(0, i);
                break;
            }
        }

        subjects.forEach((subject) => {
            subject = subject.split(' ');
            subject.shift();    // Get rid of the S.No.

            var newSubject = new Subject();
            newSubject._id = subject.shift();
            newSubject.PaperCode = subject.shift();
            newSubject.PassMarks = subject.pop();
            newSubject.MaxMarks  = subject.pop();
            newSubject.Major     = subject.pop();
            newSubject.Minor     = subject.pop();
            newSubject.Kind      = subject.pop();
            newSubject.Mode      = subject.pop();
            newSubject.Exam      = subject.pop();
            newSubject.Type      = subject.pop();
            newSubject.Credits   = subject.pop();
            newSubject.Name      = subject.join(' ');

            currentList.push(newSubject);
        });

        final.push(currentList);
        if (index == lists.length - 1) {
            callback(final);
        }
    });
};


// Subject Class
const Subject = function() {
    this._id         = null;
    this.paperCode   = null;
    this.name        = null;
    this.credits     = null;
    this.type        = null;
    this.exam        = null;
    this.mode        = null;
    this.kind        = null;
    this.minor       = null;
    this.major       = null;
    this.maxMarks    = null;
    this.passMarks   = null;
};
