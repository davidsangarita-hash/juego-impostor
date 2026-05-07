const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "public")));

// ═══════════════════════════════════════════════════════════
// BANCO DE PALABRAS — Múltiples modos
// Cada palabra tiene: word, hint, image (URL Unsplash directa)
// ═══════════════════════════════════════════════════════════
const WORD_BANK = {

  // ── FÚTBOL ─────────────────────────────────────────────
  "futbol:Jugadores Legendarios": [
    { word:"Messi",        hint:"7 Balones de Oro, juega en Inter Miami",               image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg" },
    { word:"Cristiano Ronaldo", hint:"CR7, 5 Champions, juega en Al Nassr",            image:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/220px-Cristiano_Ronaldo_2018.jpg" },
    { word:"Pelé",         hint:"El Rey, tricampeón mundial con Brasil",                image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pel%C3%A9_1970.jpg/220px-Pel%C3%A9_1970.jpg" },
    { word:"Maradona",     hint:"La Mano de Dios, el Gol del Siglo en 1986",           image:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Maradona-Mundial_86_con_la_copa.JPG/220px-Maradona-Mundial_86_con_la_copa.JPG" },
    { word:"Zidane",       hint:"Gol de chilena en la final de Champions 2002",        image:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/220px-Zinedine_Zidane_by_Tasnim_03.jpg" },
    { word:"Ronaldinho",   hint:"El mago brasileño, jugó en Barcelona y Milan",        image:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ronaldinho_cropped.jpg/220px-Ronaldinho_cropped.jpg" },
    { word:"Beckham",      hint:"Especialista en tiros libres, esposo de Victoria",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/David_Beckham_at_the_2010_World_Cup.jpg/220px-David_Beckham_at_the_2010_World_Cup.jpg" },
    { word:"Neymar",       hint:"Brasileño, ex PSG, transferencia récord 222M€",       image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Bra-Col_%281%29_%28cropped%29.jpg/220px-Bra-Col_%281%29_%28cropped%29.jpg" },
    { word:"Mbappé",       hint:"Francés, goleador del Real Madrid, veloz como un rayo", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs_Paris_Saint-Germain_by_Sandro_Halank%E2%80%93081_%28cropped%29.jpg/220px-2019-07-17_SG_Dynamo_Dresden_vs_Paris_Saint-Germain_by_Sandro_Halank%E2%80%93081_%28cropped%29.jpg" },
    { word:"Iniesta",      hint:"Dio el gol del Mundial 2010 para España en la final", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Andres_iniesta_2012.jpg/220px-Andres_iniesta_2012.jpg" },
    { word:"Xavi",         hint:"Maestro del tiki-taka, ahora entrenador del Barça",   image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Xavi_Hernandez_2014.jpg/220px-Xavi_Hernandez_2014.jpg" },
    { word:"Lewandowski",  hint:"Delantero polaco, 5 goles en 9 minutos vs Wolfsburgo", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Robert_Lewandowski%2C_FC_Bayern_M%C3%BCnchen_%28by_Sven_Mandel%2C_2019-10-05%29.jpg/220px-Robert_Lewandowski%2C_FC_Bayern_M%C3%BCnchen_%28by_Sven_Mandel%2C_2019-10-05%29.jpg" },
    { word:"Lamine Yamal", hint:"Joya del Barça, debutó con 15 años en la Eurocopa",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Lamine_Yamal_2024_%28cropped%29.jpg/220px-Lamine_Yamal_2024_%28cropped%29.jpg" },
    { word:"Vinicius Jr",  hint:"Extremo brasileño del Real Madrid, campeón Champions", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vinicius_Jr_2023.jpg/220px-Vinicius_Jr_2023.jpg" },
  ],

  "futbol:Equipos Famosos": [
    { word:"Real Madrid",       hint:"14 veces campeón de Champions League",           image:"https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/220px-Real_Madrid_CF.svg.png" },
    { word:"Barcelona",         hint:"Equipo del Camp Nou, tierra del tiki-taka",      image:"https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/220px-FC_Barcelona_%28crest%29.svg.png" },
    { word:"Manchester United",  hint:"Los Diablos Rojos, Old Trafford",               image:"https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/220px-Manchester_United_FC_crest.svg.png" },
    { word:"Bayern Munich",     hint:"Dominador de la Bundesliga, Allianz Arena",      image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg/220px-FC_Bayern_M%C3%BCnchen_logo_%282002%E2%80%932017%29.svg.png" },
    { word:"Liverpool",         hint:"You'll Never Walk Alone, Anfield",               image:"https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/220px-Liverpool_FC.svg.png" },
    { word:"PSG",               hint:"París Saint-Germain, Torre Eiffel al fondo",     image:"https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/220px-Paris_Saint-Germain_F.C..svg.png" },
    { word:"Juventus",          hint:"La Vecchia Signora, blanco y negro, Turín",      image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Juventus_FC_2017_icon_%28black%29.svg/220px-Juventus_FC_2017_icon_%28black%29.svg.png" },
    { word:"Chelsea",           hint:"Los Blues de Londres, Stamford Bridge",          image:"https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/220px-Chelsea_FC.svg.png" },
    { word:"Atlético de Madrid",hint:"El Colchonero, campeón de Liga 2021",            image:"https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/220px-Atletico_Madrid_2017_logo.svg.png" },
    { word:"Inter Miami",       hint:"El equipo rosa de la MLS donde juega Messi",     image:"https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Inter_Miami_CF_crest.svg/220px-Inter_Miami_CF_crest.svg.png" },
    { word:"Boca Juniors",      hint:"Club argentino de La Bombonera, azul y amarillo", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Boca_Juniors_logo18.svg/220px-Boca_Juniors_logo18.svg.png" },
    { word:"River Plate",       hint:"El Millonario, rival eterno de Boca en Argentina", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/River_Plate_logo.svg/220px-River_Plate_logo.svg.png" },
  ],

  "futbol:Torneos": [
    { word:"Champions League",  hint:"La orejona, el torneo europeo más prestigioso",  image:"https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/220px-UEFA_Champions_League_logo_2.svg.png" },
    { word:"Copa del Mundo",    hint:"Se juega cada 4 años, el máximo torneo de selecciones", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/2022_FIFA_World_Cup_emblem.svg/220px-2022_FIFA_World_Cup_emblem.svg.png" },
    { word:"Copa América",      hint:"El torneo más antiguo de selecciones, nació en 1916", image:"https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Copa_Am%C3%A9rica_2024_logo.svg/220px-Copa_Am%C3%A9rica_2024_logo.svg.png" },
    { word:"Eurocopa",          hint:"Torneo de selecciones europeas cada 4 años",     image:"https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/UEFA_Euro_2024_Logo.svg/220px-UEFA_Euro_2024_Logo.svg.png" },
    { word:"Premier League",    hint:"La liga inglesa, la más seguida del mundo",      image:"https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/220px-Premier_League_Logo.svg.png" },
    { word:"La Liga",           hint:"Liga española, hogar del Barça y el Madrid",     image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/LaLiga.svg/220px-LaLiga.svg.png" },
    { word:"Libertadores",      hint:"La Champions de Sudamérica, el más grande del continente", image:"https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/CONMEBOL_Libertadores.svg/220px-CONMEBOL_Libertadores.svg.png" },
  ],

  "futbol:Estadios": [
    { word:"Camp Nou",          hint:"El estadio más grande de Europa, en Barcelona",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Camp_Nou_aerial_%282015%29.jpg/320px-Camp_Nou_aerial_%282015%29.jpg" },
    { word:"Wembley",           hint:"El estadio nacional de Inglaterra, el arco icónico", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Wembley_Stadium_in_April_2008.jpg/320px-Wembley_Stadium_in_April_2008.jpg" },
    { word:"Maracaná",          hint:"El templo del fútbol en Río de Janeiro, Brasil", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Maracan%C3%A3_2014.jpg/320px-Maracan%C3%A3_2014.jpg" },
    { word:"Bernabéu",          hint:"Casa del Real Madrid en Madrid, España",         image:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Estadio_Santiago_Bernab%C3%A9u_2019_front.jpg/320px-Estadio_Santiago_Bernab%C3%A9u_2019_front.jpg" },
    { word:"Old Trafford",      hint:"El Teatro de los Sueños, Manchester United",     image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Old_Trafford_inside_20060726_1.jpg/320px-Old_Trafford_inside_20060726_1.jpg" },
    { word:"Allianz Arena",     hint:"El estadio que cambia de color en Munich",       image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Allianz_Arena_Abend.jpg/320px-Allianz_Arena_Abend.jpg" },
    { word:"Azteca",            hint:"El más grande de Latinoamérica, en Ciudad de México", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Estadio_azteca.jpg/320px-Estadio_azteca.jpg" },
  ],

  // ── PELÍCULAS ──────────────────────────────────────────
  "peliculas:Blockbusters": [
    { word:"Titanic",         hint:"Un barco que se hunde, amor imposible en 1912",    image:"https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Titanic_%281997_film%29_poster.png/220px-Titanic_%281997_film%29_poster.png" },
    { word:"El Rey León",     hint:"Hakuna Matata, Simba, Mufasa en África",           image:"https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/The_Lion_King_poster.jpg/220px-The_Lion_King_poster.jpg" },
    { word:"Avatar",          hint:"Planeta Pandora, los Na'vi, James Cameron",        image:"https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Avatar-Teaser-Poster.jpg/220px-Avatar-Teaser-Poster.jpg" },
    { word:"El Padrino",      hint:"Le haré una oferta que no podrá rechazar",         image:"https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Godfather_ver1.jpg/220px-Godfather_ver1.jpg" },
    { word:"Inception",       hint:"Sueños dentro de sueños, Leonardo DiCaprio, la peonza", image:"https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Inception_%282010%29_theatrical_poster.jpg/220px-Inception_%282010%29_theatrical_poster.jpg" },
    { word:"Avengers: Endgame", hint:"Thanos chasquea los dedos, 3 horas de épica Marvel", image:"https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/Avengers_Endgame_poster.jpg/220px-Avengers_Endgame_poster.jpg" },
    { word:"La La Land",      hint:"Musical en Los Ángeles, Ryan Gosling y Emma Stone", image:"https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/La_La_Land_%28film%29.png/220px-La_La_Land_%28film%29.png" },
    { word:"Joker",           hint:"Arthur Fleck, payaso que se convierte en villano", image:"https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Joker_%282019_film%29_poster.jpg/220px-Joker_%282019_film%29_poster.jpg" },
    { word:"Spider-Man",      hint:"Con gran poder, viene una gran responsabilidad",   image:"https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Spider-Man_No_Way_Home_poster.jpg/220px-Spider-Man_No_Way_Home_poster.jpg" },
    { word:"Interstellar",    hint:"Agujeros negros, viaje en el tiempo, Christopher Nolan", image:"https://upload.wikimedia.org/wikipedia/en/thumb/b/bc/Interstellar_film_poster.jpg/220px-Interstellar_film_poster.jpg" },
    { word:"Toy Story",       hint:"Woody, Buzz Lightyear, los juguetes cobran vida",  image:"https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Toy_Story.jpg/220px-Toy_Story.jpg" },
    { word:"Shrek",           hint:"Ogro verde en un pantano, con Burro y Fiona",      image:"https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Shrek.jpg/220px-Shrek.jpg" },
    { word:"Harry Potter",    hint:"El niño mago, Hogwarts, Voldemort, la varita",     image:"https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Harry_Potter_and_the_Philosopher%27s_Stone_banner.jpg/320px-Harry_Potter_and_the_Philosopher%27s_Stone_banner.jpg" },
    { word:"Matrix",          hint:"Pastilla roja o azul, Neo, el mundo simulado",     image:"https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/The_Matrix_Poster.jpg/220px-The_Matrix_Poster.jpg" },
  ],

  "peliculas:Terror": [
    { word:"It",              hint:"Pennywise el payaso, alcantarilla, globos rojos",  image:"https://upload.wikimedia.org/wikipedia/en/thumb/5/55/It_%28poster%29.jpg/220px-It_%28poster%29.jpg" },
    { word:"El Exorcista",    hint:"Niña poseída, cabeza girando, película de 1973",   image:"https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/TheExorcist_ver2.jpg/220px-TheExorcist_ver2.jpg" },
    { word:"Scream",          hint:"Máscara de Ghostface, teléfono, ¿cuál es tu película de terror favorita?", image:"https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Scream1996poster.jpg/220px-Scream1996poster.jpg" },
    { word:"Annabelle",       hint:"Muñeca espeluznante, universo de El Conjuro",      image:"https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Annabelle_%28film%29.jpg/220px-Annabelle_%28film%29.jpg" },
    { word:"Get Out",         hint:"Pareja interracial, hipnosis, thriller racial",    image:"https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Get_Out_poster.png/220px-Get_Out_poster.png" },
  ],

  // ── FAMOSOS ───────────────────────────────────────────
  "famosos:Músicos": [
    { word:"Michael Jackson", hint:"El Rey del Pop, Thriller, moonwalk",               image:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Michael_Jordan_in_2014.jpg/220px-Michael_Jordan_in_2014.jpg" },
    { word:"Shakira",         hint:"Colombiana, caderas que no mienten, Waka Waka",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakira_2010.jpg/220px-Shakira_2010.jpg" },
    { word:"Bad Bunny",       hint:"El conejo malo, reggaeton, Puerto Rico",            image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Bad_Bunny_2019.jpg/220px-Bad_Bunny_2019.jpg" },
    { word:"Taylor Swift",    hint:"Eras Tour, la artista más famosa del planeta 2024", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png/220px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png" },
    { word:"Beyoncé",         hint:"Queen Bey, Destiny's Child, Lemonade",             image:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Beyonc%C3%A9_-_The_Formation_World_Tour%2C_at_Wembley_Stadium_in_London%2C_England_%282016-06-29%29_07_%28cropped%29.jpg/220px-Beyonc%C3%A9_-_The_Formation_World_Tour%2C_at_Wembley_Stadium_in_London%2C_England_%282016-06-29%29_07_%28cropped%29.jpg" },
    { word:"Peso Pluma",      hint:"Cantante mexicano de corridos tumbados, cabello rizado", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Peso_Pluma_2023_%28cropped%29.jpg/220px-Peso_Pluma_2023_%28cropped%29.jpg" },
    { word:"Karol G",         hint:"La Bichota, colombiana, reggaeton y pop latino",   image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Karol_G_%40_RodeoHouston_2022_%28cropped%29.jpg/220px-Karol_G_%40_RodeoHouston_2022_%28cropped%29.jpg" },
    { word:"Eminem",          hint:"Slim Shady, rapero de Detroit, 8 Mile",            image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Eminem_-_Concert_for_Valor_in_Washington%2C_D.C._Nov._11%2C_2014_%28Amon%29_%28cropped%29.jpg/220px-Eminem_-_Concert_for_Valor_in_Washington%2C_D.C._Nov._11%2C_2014_%28Amon%29_%28cropped%29.jpg" },
  ],

  "famosos:Actores": [
    { word:"Leonardo DiCaprio", hint:"Titanic, Inception, ganó el Oscar con El Renacido", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Leonardo_Dicaprio_Cannes_2019.jpg/220px-Leonardo_Dicaprio_Cannes_2019.jpg" },
    { word:"Dwayne Johnson",  hint:"La Roca, ex luchador de WWE, Fast and Furious",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Dwayne_Johnson_2014_%28cropped%29.jpg/220px-Dwayne_Johnson_2014_%28cropped%29.jpg" },
    { word:"Tom Hanks",       hint:"Forrest Gump, Cast Away, ganó 2 Oscars seguidos",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Tom_Hanks_TIFF_2019.jpg/220px-Tom_Hanks_TIFF_2019.jpg" },
    { word:"Scarlett Johansson", hint:"Viuda Negra en Marvel, Ghost in the Shell",     image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Scarlett_Johansson_2010.jpg/220px-Scarlett_Johansson_2010.jpg" },
    { word:"Will Smith",      hint:"El Príncipe del Rap, bofeada en los Oscars 2022",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Will_Smith_2011.jpg/220px-Will_Smith_2011.jpg" },
    { word:"Ryan Reynolds",   hint:"Deadpool, humor constante en y fuera de pantalla", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Ryan_Reynolds_2016.jpg/220px-Ryan_Reynolds_2016.jpg" },
  ],

  // ── CIUDADES ──────────────────────────────────────────
  "ciudades:Europa": [
    { word:"París",           hint:"Torre Eiffel, croissants, ciudad del amor",        image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/220px-Camponotus_flavomarginatus_ant.jpg" },
    { word:"Roma",            hint:"El Coliseo, la pizza, el Papa, ciudad eterna",     image:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/320px-Colosseo_2020.jpg" },
    { word:"Barcelona",       hint:"Gaudí, La Sagrada Familia, Las Ramblas, Cataluña", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image-Sagrada_Familia_01.jpg/220px-Image-Sagrada_Familia_01.jpg" },
    { word:"Londres",         hint:"Big Ben, el Big Bus rojo, la reina, la niebla",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/320px-London_Skyline_%28125508655%29.jpeg" },
    { word:"Ámsterdam",       hint:"Canales, bicicletas, tulipanes, Holanda",          image:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Amsterdam_Centraal_20101106.jpg/320px-Amsterdam_Centraal_20101106.jpg" },
    { word:"Dubái",           hint:"Rascacielos en el desierto, Burj Khalifa, oro",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Burj_Khalifa_Cropped.jpg/220px-Burj_Khalifa_Cropped.jpg" },
    { word:"Tokio",           hint:"Capital de Japón, neón, sushi, Monte Fuji",        image:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/320px-Skyscrapers_of_Shinjuku_2009_January.jpg" },
  ],

  "ciudades:América": [
    { word:"Nueva York",      hint:"La Gran Manzana, Estatua de la Libertad, Broadway", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg/320px-Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg" },
    { word:"Río de Janeiro",  hint:"Cristo Redentor, Carnaval, playa de Copacabana",   image:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cristo_Redentor_-_Rio_de_Janeiro%2C_Brasil.jpg/220px-Cristo_Redentor_-_Rio_de_Janeiro%2C_Brasil.jpg" },
    { word:"Bogotá",          hint:"Capital de Colombia, 2600m de altitud, La Candelaria", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/BogotaDC.jpg/320px-BogotaDC.jpg" },
    { word:"Buenos Aires",    hint:"La París de Sudamérica, tango, asado, Argentina",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Buenos_Aires_-_Aerial_03.jpg/320px-Buenos_Aires_-_Aerial_03.jpg" },
    { word:"Ciudad de México", hint:"La capital más grande de habla hispana, el Zócalo", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Mexico_City_at_sunset.jpg/320px-Mexico_City_at_sunset.jpg" },
    { word:"Lima",            hint:"Capital de Perú, ceviche, Machu Picchu cerca",     image:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lima_sunset.jpg/320px-Lima_sunset.jpg" },
    { word:"Los Ángeles",     hint:"Hollywood, Venice Beach, tráfico legendario",      image:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Los_Angeles_Skyline_Dusk.jpg/320px-Los_Angeles_Skyline_Dusk.jpg" },
    { word:"Miami",           hint:"South Beach, calor, palmeras, latinos, Art Deco",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Miami_FL_USA_at_night_-_panoramio_%281%29.jpg/320px-Miami_FL_USA_at_night_-_panoramio_%281%29.jpg" },
  ],

  // ── ANIMALES ──────────────────────────────────────────
  "animales:Salvajes": [
    { word:"León",            hint:"El rey de la selva, melena, ruge en África",       image:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/320px-Lion_waiting_in_Namibia.jpg" },
    { word:"Tiburón Blanco",  hint:"El depredador marino más temido, 5 metros",        image:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_shark.jpg/320px-White_shark.jpg" },
    { word:"Elefante",        hint:"El animal terrestre más grande, memoria prodigiosa", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/320px-African_Bush_Elephant.jpg" },
    { word:"Gorila",          hint:"El primate más grande, hasta 200kg, África",       image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Western_gorilla_%28Gorilla_gorilla%29_-_Maurits_Vermeulen.jpg/220px-Western_gorilla_%28Gorilla_gorilla%29_-_Maurits_Vermeulen.jpg" },
    { word:"Cocodrilo",       hint:"Reptil prehistórico, mandíbulas mortales, pantanos", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Buaya.JPG/320px-Buaya.JPG" },
    { word:"Pingüino",        hint:"Ave que no vuela, vive en la Antártida, blanco y negro", image:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Emperor_Penguin_Manchot_empereur.jpg/220px-Emperor_Penguin_Manchot_empereur.jpg" },
    { word:"Panda",           hint:"Oso blanco y negro chino, come bambú",             image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grosser_Panda.JPG/220px-Grosser_Panda.JPG" },
  ],

  // ── COMIDAS ───────────────────────────────────────────
  "comidas:Platos del Mundo": [
    { word:"Pizza",           hint:"Italiana, masa redonda, mozzarella, tomate",       image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/220px-Eq_it-na_pizza-margherita_sep2005_sml.jpg" },
    { word:"Sushi",           hint:"Japonés, arroz, pescado crudo, wasabi, palillos",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sashimi_platter.jpg/320px-Sashimi_platter.jpg" },
    { word:"Tacos",           hint:"Mexicanos, tortilla, carne, cilantro, limón",      image:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_calle_Moctezuma%2C_Poza_Rica%2C_Veracruz%2C_M%C3%A9xico..jpg/320px-001_Tacos_de_carnitas%2C_calle_Moctezuma%2C_Poza_Rica%2C_Veracruz%2C_M%C3%A9xico..jpg" },
    { word:"Ceviche",         hint:"Peruano, pescado marinado en limón, con ají",      image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Cebiche.jpg/320px-Cebiche.jpg" },
    { word:"Hamburguesa",     hint:"Pan, carne, queso, lechuga, ketchup, americana",   image:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/220px-PNG_transparency_demonstration_1.png" },
    { word:"Paella",          hint:"Española, arroz con azafrán, mariscos, Valencia",  image:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Paella_mixta.jpg/320px-Paella_mixta.jpg" },
    { word:"Arepa",           hint:"Colombiana y venezolana, maíz, rellena o sola",    image:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Arepas_colombianas.jpg/320px-Arepas_colombianas.jpg" },
  ],
};

// ── MODOS disponibles para el selector ──────────────────────
const MODES = {
  futbol:    { label: "⚽ Fútbol",    categories: ["futbol:Jugadores Legendarios","futbol:Equipos Famosos","futbol:Torneos","futbol:Estadios"] },
  peliculas: { label: "🎬 Películas", categories: ["peliculas:Blockbusters","peliculas:Terror"] },
  famosos:   { label: "⭐ Famosos",   categories: ["famosos:Músicos","famosos:Actores"] },
  ciudades:  { label: "🌍 Ciudades",  categories: ["ciudades:Europa","ciudades:América"] },
  animales:  { label: "🦁 Animales",  categories: ["animales:Salvajes"] },
  comidas:   { label: "🍕 Comidas",   categories: ["comidas:Platos del Mundo"] },
  mixto:     { label: "🎲 Mixto",     categories: Object.keys(WORD_BANK) },
};

// ─────────────────────────────────────────────────────────────
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getRandomCategory(mode) {
  const cats = MODES[mode]?.categories || MODES.mixto.categories;
  return cats[Math.floor(Math.random() * cats.length)];
}

function getRandomWord(category) {
  const words = WORD_BANK[category];
  if (!words || !words.length) return { word:"Fútbol", hint:"El deporte rey", image:"" };
  return words[Math.floor(Math.random() * words.length)];
}

function createRoom(hostId, settings) {
  let code;
  do { code = generateRoomCode(); } while (rooms[code]);
  rooms[code] = {
    code, hostId,
    settings: {
      mode:       settings.mode       || "futbol",
      impostors:  settings.impostors  || 1,
      duration:   settings.duration   || 10,
      maxPlayers: settings.maxPlayers || 8,
    },
    players: {}, state: "lobby", round: 0,
    category: null, currentWord: null, currentHint: null, currentImage: null,
    impostorIds: [], votes: {}, scores: {}, chat: [],
    roundWords: {}, roundTimer: null, votingTimer: null,
  };
  return rooms[code];
}

function getRoomSafeData(room) {
  return {
    code: room.code,
    settings: room.settings,
    state: room.state,
    round: room.round,
    category: room.category,
    players: Object.values(room.players).map(p => ({
      id: p.id, name: p.name, avatar: p.avatar,
      ready: p.ready, isHost: p.isHost,
      score: room.scores[p.id] || 0,
      eliminated: p.eliminated || false,
      roundWord: room.roundWords[p.id] || null,
    })),
    chat: room.chat.slice(-50),
    roundWords: room.roundWords || {},
    modes: MODES,
  };
}

function startGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const players = Object.values(room.players).filter(p => !p.eliminated);
  if (players.length < 2) return io.to(roomCode).emit("error_msg","Se necesitan al menos 2 jugadores.");

  room.state = "playing";
  room.round++;
  room.roundWords = {};

  const category = getRandomCategory(room.settings.mode);
  const wordData  = getRandomWord(category);
  room.category     = category.split(":")[1]; // mostrar solo la parte legible
  room.currentWord  = wordData.word;
  room.currentHint  = wordData.hint;
  room.currentImage = wordData.image || "";

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const numImpostors = Math.min(room.settings.impostors, Math.max(1, Math.floor(players.length / 3)));
  room.impostorIds = shuffled.slice(0, numImpostors).map(p => p.id);
  room.votes = {};

  players.forEach(player => {
    const isImpostor = room.impostorIds.includes(player.id);
    io.to(player.socketId).emit("game_start", {
      category: room.category,
      word:     isImpostor ? null : wordData.word,
      hint:     isImpostor ? null : wordData.hint,
      image:    isImpostor ? null : (wordData.image || ""),
      isImpostor,
      round: room.round,
      duration: room.settings.duration * 60,
    });
  });

  io.to(roomCode).emit("room_update", getRoomSafeData(room));
  clearTimeout(room.roundTimer);
  room.roundTimer = setTimeout(() => startVoting(roomCode), room.settings.duration * 60 * 1000);
}

function startVoting(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.state !== "playing") return;
  room.state = "voting";
  room.votes = {};
  io.to(roomCode).emit("voting_start", {
    players: Object.values(room.players).filter(p => !p.eliminated)
      .map(p => ({ id: p.id, name: p.name, avatar: p.avatar, roundWord: room.roundWords[p.id] || null })),
    timeLeft: 30,
    word: room.currentWord,
    image: room.currentImage,
  });
  io.to(roomCode).emit("room_update", getRoomSafeData(room));
  clearTimeout(room.votingTimer);
  room.votingTimer = setTimeout(() => resolveVoting(roomCode), 30000);
}

function resolveVoting(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const tally = {};
  Object.values(room.votes).forEach(tid => { tally[tid] = (tally[tid]||0)+1; });

  let maxVotes = 0, eliminated = null;
  Object.entries(tally).forEach(([pid, count]) => {
    if (count > maxVotes) { maxVotes = count; eliminated = pid; }
  });

  // Empate → nadie eliminado
  const tied = Object.entries(tally).filter(([,c]) => c === maxVotes);
  if (tied.length > 1) eliminated = null;

  const eliminatedPlayer = eliminated ? room.players[eliminated] : null;
  const wasImpostor = eliminated ? room.impostorIds.includes(eliminated) : false;

  if (eliminatedPlayer) {
    eliminatedPlayer.eliminated = true;
    if (wasImpostor) {
      Object.keys(room.players).forEach(pid => {
        if (!room.impostorIds.includes(pid) && room.votes[pid] === eliminated)
          room.scores[pid] = (room.scores[pid]||0) + 150;
      });
    } else {
      room.impostorIds.forEach(pid => { room.scores[pid] = (room.scores[pid]||0) + 100; });
    }
  }

  const alivePlayers  = Object.values(room.players).filter(p => !p.eliminated);
  const aliveImpostors = alivePlayers.filter(p => room.impostorIds.includes(p.id));
  const aliveCrew      = alivePlayers.filter(p => !room.impostorIds.includes(p.id));

  let gameOver = false, winner = null;
  if (aliveImpostors.length === 0) {
    gameOver = true; winner = "crew";
    aliveCrew.forEach(p => { room.scores[p.id] = (room.scores[p.id]||0) + 200; });
  } else if (aliveImpostors.length >= aliveCrew.length) {
    gameOver = true; winner = "impostors";
    aliveImpostors.forEach(p => { room.scores[p.id] = (room.scores[p.id]||0) + 300; });
  }

  room.state = gameOver ? "results" : "playing";

  io.to(roomCode).emit("voting_result", {
    eliminated: eliminatedPlayer ? { id: eliminatedPlayer.id, name: eliminatedPlayer.name } : null,
    wasImpostor, impostorIds: room.impostorIds,
    word: room.currentWord, image: room.currentImage,
    tally, gameOver, winner,
    scores: room.scores,
    players: getRoomSafeData(room).players,
    tied: tied.length > 1,
  });

  if (!gameOver) {
    setTimeout(() => startGame(roomCode), 5000);
  } else {
    Object.values(room.players).forEach(p => { p.eliminated = false; p.ready = false; });
    room.impostorIds = [];
  }
}

// ─────────────────────────────────────────────────────────────
io.on("connection", socket => {
  console.log(`[+] ${socket.id}`);

  socket.on("create_room", ({ name, avatar, settings }) => {
    const room = createRoom(socket.id, settings || {});
    room.players[socket.id] = { id:socket.id, socketId:socket.id, name, avatar:avatar||0, ready:false, isHost:true, eliminated:false };
    room.scores[socket.id] = 0;
    socket.join(room.code);
    socket.emit("room_created", { code: room.code, room: getRoomSafeData(room) });
    io.to(room.code).emit("room_update", getRoomSafeData(room));
  });

  socket.on("join_room", ({ code, name, avatar }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) return socket.emit("join_error", "Sala no encontrada.");
    if (room.state !== "lobby") return socket.emit("join_error", "La partida ya comenzó.");
    if (Object.keys(room.players).length >= room.settings.maxPlayers) return socket.emit("join_error", "Sala llena.");
    room.players[socket.id] = { id:socket.id, socketId:socket.id, name, avatar:avatar||0, ready:false, isHost:false, eliminated:false };
    room.scores[socket.id] = 0;
    socket.join(code.toUpperCase());
    socket.emit("room_joined", { code: room.code, room: getRoomSafeData(room) });
    io.to(room.code).emit("room_update", getRoomSafeData(room));
    io.to(room.code).emit("chat_msg", { system:true, text:`⚽ ${name} entró a la sala`, ts:Date.now() });
  });

  socket.on("toggle_ready", ({ code }) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id]) return;
    room.players[socket.id].ready = !room.players[socket.id].ready;
    io.to(code).emit("room_update", getRoomSafeData(room));
  });

  socket.on("update_settings", ({ code, settings }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    room.settings = { ...room.settings, ...settings };
    io.to(code).emit("room_update", getRoomSafeData(room));
  });

  // ★ FIX: host no necesita estar "ready", simplemente arranca
  socket.on("start_game", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    const nonHostPlayers = Object.values(room.players).filter(p => !p.isHost);
    const allReady = nonHostPlayers.every(p => p.ready);
    if (nonHostPlayers.length > 0 && !allReady)
      return socket.emit("error_msg", "No todos los jugadores están listos.");
    startGame(code);
  });

  socket.on("submit_word", ({ code, word }) => {
    const room = rooms[code];
    if (!room || room.state !== "playing") return;
    if (!room.players[socket.id] || room.players[socket.id].eliminated) return;
    if (room.roundWords[socket.id]) return socket.emit("error_msg", "Ya enviaste tu palabra esta ronda.");
    const clean = word.trim().slice(0, 60);
    if (!clean) return;
    room.roundWords[socket.id] = clean;
    io.to(code).emit("room_update", getRoomSafeData(room));
    io.to(code).emit("word_submitted", { playerId:socket.id, playerName:room.players[socket.id].name, word:clean });
    const active = Object.values(room.players).filter(p => !p.eliminated);
    if (active.every(p => room.roundWords[p.id])) {
      clearTimeout(room.roundTimer);
      setTimeout(() => startVoting(code), 1500);
    }
  });

  socket.on("send_chat", ({ code, text }) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id]) return;
    const p = room.players[socket.id];
    const msg = { playerId:socket.id, playerName:p.name, text:text.slice(0,200), ts:Date.now() };
    room.chat.push(msg);
    io.to(code).emit("chat_msg", msg);
  });

  socket.on("cast_vote", ({ code, targetId }) => {
    const room = rooms[code];
    if (!room || room.state !== "voting" || room.votes[socket.id]) return;
    room.votes[socket.id] = targetId;
    const active = Object.values(room.players).filter(p => !p.eliminated);
    io.to(code).emit("vote_update", { voted: Object.keys(room.votes).length, total: active.length });
    if (Object.keys(room.votes).length >= active.length) {
      clearTimeout(room.votingTimer);
      resolveVoting(code);
    }
  });

  socket.on("force_vote", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id || room.state !== "playing") return;
    clearTimeout(room.roundTimer);
    startVoting(code);
  });

  socket.on("return_lobby", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    clearTimeout(room.roundTimer); clearTimeout(room.votingTimer);
    room.state = "lobby"; room.round = 0;
    room.impostorIds = []; room.votes = {}; room.roundWords = {};
    room.category = null; room.currentWord = null;
    Object.values(room.players).forEach(p => { p.eliminated = false; p.ready = false; });
    io.to(code).emit("room_update", getRoomSafeData(room));
  });

  socket.on("disconnect", () => {
    Object.entries(rooms).forEach(([code, room]) => {
      if (!room.players[socket.id]) return;
      const pname = room.players[socket.id].name;
      delete room.players[socket.id]; delete room.scores[socket.id];
      if (Object.keys(room.players).length === 0) {
        clearTimeout(room.roundTimer); clearTimeout(room.votingTimer);
        delete rooms[code]; return;
      }
      if (room.hostId === socket.id) {
        const next = Object.values(room.players)[0];
        room.hostId = next.id; next.isHost = true;
      }
      io.to(code).emit("room_update", getRoomSafeData(room));
      io.to(code).emit("chat_msg", { system:true, text:`🚪 ${pname} salió`, ts:Date.now() });
      if (room.state === "voting") {
        const rem = Object.values(room.players).filter(p=>!p.eliminated).length;
        if (Object.keys(room.votes).length >= rem) { clearTimeout(room.votingTimer); resolveVoting(code); }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const total = Object.values(WORD_BANK).reduce((a,b)=>a+b.length,0);
  console.log(`\n🟢 Servidor en http://localhost:${PORT}`);
  console.log(`📦 ${total} palabras en ${Object.keys(WORD_BANK).length} categorías — ${Object.keys(MODES).length} modos\n`);
});