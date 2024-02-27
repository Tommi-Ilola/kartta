exports.handler = async function(event) {
  try {
    const response = await axios.get('https://rata.digitraffic.fi/infra-api/0.7/radat.geojson');
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
