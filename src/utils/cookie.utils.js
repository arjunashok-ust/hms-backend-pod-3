const config = require('../config/app.config');
const { REFRESH_COOKIE_NAME } = require('../constants/app.constants');

const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, config.refreshCookie);
};

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, config.refreshCookie);
};

const getRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

module.exports = { setRefreshCookie, clearRefreshCookie, getRefreshCookie };
