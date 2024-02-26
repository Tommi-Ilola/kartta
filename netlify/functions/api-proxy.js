const axios = require('axios');
exports.handler = async function(event) {
  const response = await axios.get('URL', { tässä voisi olla konfiguraatiosi });
  return {
    statusCode: 200,
    body: JSON.stringify(response.data)
  };
};
