export default async (req, res) => {
  try {
    const response = await fetch('https://rata.digitraffic.fi/infra-api/0.7/radat.geojson');
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Virhe ladattaessa radat.geojson dataa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
