// Esimerkki tiedostosta: pages/api/my-background-task.background.js

export default async (req, res) => {
  // Tässä voit suorittaa pitkäkestoisia tehtäviä, kuten API-kutsuja
  console.log('Taustatehtävä aloitettu.');

  // Oletetaan, että sinulla on jokin funktio, joka suorittaa API-kutsun:
  const data = await fetchSomeData();

  // Kun tehtävä on suoritettu, voit tallentaa tulokset tietokantaan,
  // lähettää sähköposti-ilmoituksen, jne.

  // Vastaus lähetetään välittömästi, ilmoittaen että tehtävä on vastaanotettu.
  res.status(200).json({ message: 'Tehtävä on vastaanotettu ja suoritetaan taustalla.' });
};

async function fetchSomeData() {
  // Esimerkki API-kutsusta
  const response = await fetch('https://rata.digitraffic.fi');
  const data = await response.json();
  return data;
}
