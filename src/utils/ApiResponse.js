class ApiResponse {
  constructor(statusCode, message = "Success", data = {}, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}

module.exports = ApiResponse;