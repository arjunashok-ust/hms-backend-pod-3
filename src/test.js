const mail = require('./utils/mail.utils');

const sendTestMail = async (req,res) => {
    const response = await mail.sendMail({
        to: "dashayush1235@gmail.com",
        subject: "Test Mail",
        html:  `
        <p> Hey Ayush</p>
        `
    });
}

module.exports = sendTestMail;