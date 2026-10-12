const { ONE_DAY_MS } = require('../constants/app.constants');

// appointments are stored at local midnight, see createAppointment
const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (value) => new Date(startOfDay(value).getTime() + ONE_DAY_MS);

module.exports = { startOfDay, endOfDay };
