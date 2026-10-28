// Danh sách CLB và cầu thủ mùa 2026/27 (sau kỳ chuyển nhượng hè 2026, đóng cửa 1/9/2026).
// Mỗi CLB: 1 thủ môn [tên, chỉ số bắt] và 7 cầu thủ sút [tên, chỉ số sút 11m].
// Chỉ số là ước lượng cho game (60-95). Muốn sửa đội hình chỉ cần sửa file này.
// Dùng chung cho trình duyệt (window.PK_DATA) và máy chủ (require).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PK_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // [id, tên, viết tắt, màu chính, màu phụ, thủ môn, cầu thủ sút]
  const EPL = [
    ['arsenal', 'Arsenal', 'ARS', '#EF0107', '#FFFFFF', ['David Raya', 86], [['Bukayo Saka', 86], ['Viktor Gyökeres', 85], ['Martin Ødegaard', 84], ['Kai Havertz', 84], ['Eberechi Eze', 82], ['Declan Rice', 80], ['Bruno Guimarães', 80]]],
    ['aston-villa', 'Aston Villa', 'AVL', '#670E36', '#95BFE5', ['Zion Suzuki', 79], [['Leon Goretzka', 80], ['John McGinn', 79], ['Nicolas Jackson', 78], ['Alejandro Garnacho', 77], ['Johan Manzambi', 76], ['Ibrahim Mbaye', 74], ['Amadou Onana', 74]]],
    ['bournemouth', 'Bournemouth', 'BOU', '#DA291C', '#111111', ['Michele Di Gregorio', 81], [['Justin Kluivert', 84], ['Evanilson', 80], ['Marcus Tavernier', 80], ['Ryan Christie', 77], ['Álvaro Rodríguez', 76], ['Eli Junior Kroupi', 76], ['Alex Scott', 75]]],
    ['brentford', 'Brentford', 'BRE', '#E30613', '#FFFFFF', ['Caoimhín Kelleher', 81], [['Igor Thiago', 84], ['Callum Wilson', 80], ['Mikkel Damsgaard', 79], ['Kevin Schade', 76], ['Dango Ouattara', 76], ['Jaidon Anthony', 76], ['Yehor Yarmoliuk', 74]]],
    ['brighton', 'Brighton', 'BHA', '#0057B8', '#FFFFFF', ['Bart Verbruggen', 81], [['Georginio Rutter', 78], ['Kaoru Mitoma', 78], ['Diego Gómez', 76], ['Yankuba Minteh', 76], ['Stefanos Tzimas', 76], ['Jack Hinshelwood', 75], ['Charalampos Kostoulas', 75]]],
    ['chelsea', 'Chelsea', 'CHE', '#034694', '#FFFFFF', ['Emiliano Martínez', 85], [['Cole Palmer', 90], ['João Pedro', 82], ['Morgan Rogers', 80], ['Jordan Henderson', 80], ['Estêvão', 79], ['Pedro Neto', 78], ['Moisés Caicedo', 76]]],
    ['coventry', 'Coventry City', 'COV', '#59CBE8', '#0B2341', ['Carl Rushworth', 76], [['Haji Wright', 82], ['Ellis Simms', 77], ['Jack Rudoni', 77], ['Taiwo Awoniyi', 75], ['Victor Torp', 75], ['Ephron Mason-Clark', 75], ['Frank Onyeka', 72]]],
    ['crystal-palace', 'Crystal Palace', 'CRY', '#1B458F', '#C4122E', ['Dean Henderson', 82], [['Jean-Philippe Mateta', 85], ['Ismaïla Sarr', 80], ['Yeremy Pino', 78], ['Adam Wharton', 77], ['Daichi Kamada', 77], ['Dwight McNeil', 76], ['Quinten Timber', 75]]],
    ['everton', 'Everton', 'EVE', '#003399', '#FFFFFF', ['Jordan Pickford', 85], [['Jack Grealish', 80], ['Kiernan Dewsbury-Hall', 79], ['Brennan Johnson', 78], ['Thierno Barry', 77], ['James Garner', 77], ['Tyrique George', 75], ['Merlin Röhl', 74]]],
    ['fulham', 'Fulham', 'FUL', '#FFFFFF', '#111111', ['Bernd Leno', 82], [['Andreas Pereira', 82], ['Gonzalo García', 79], ['Emile Smith Rowe', 78], ['Rodrigo Muniz', 78], ['Alex Iwobi', 77], ['Samuel Chukwueze', 75], ['Hugo Larsson', 75]]],
    ['hull', 'Hull City', 'HUL', '#F5A12D', '#111111', ['Ivor Pandur', 74], [['Joe Gelhardt', 77], ['Oli McBurnie', 77], ['Mohamed Belloumi', 75], ['Kyle Joseph', 74], ['Matt Targett', 72], ['Regan Slater', 72], ['Tim Iroegbunam', 72]]],
    ['ipswich', 'Ipswich Town', 'IPS', '#0033A0', '#FFFFFF', ['Alex Palmer', 77], [['Conor Chaplin', 79], ['George Hirst', 78], ['Jack Clarke', 77], ['Sammie Szmodics', 76], ['Leif Davis', 75], ['Saša Lukić', 74], ['Issa Diop', 70]]],
    ['leeds', 'Leeds United', 'LEE', '#FFFFFF', '#1D428A', ['James Trafford', 80], [['Joël Piroe', 82], ['Lukas Nmecha', 80], ['Harry Wilson', 80], ['Dominic Calvert-Lewin', 79], ['Daniel James', 76], ['Brenden Aaronson', 75], ['Ethan Ampadu', 74]]],
    ['liverpool', 'Liverpool', 'LIV', '#C8102E', '#F6EB61', ['Alisson Becker', 87], [['Alexander Isak', 86], ['Florian Wirtz', 84], ['Dominik Szoboszlai', 83], ['Hugo Ekitiké', 82], ['Cody Gakpo', 82], ['Alexis Mac Allister', 81], ['Bradley Barcola', 79]]],
    ['man-city', 'Manchester City', 'MCI', '#6CABDD', '#1C2C5B', ['Gianluigi Donnarumma', 87], [['Erling Haaland', 88], ['Phil Foden', 83], ['Enzo Fernández', 82], ['Rayan Cherki', 82], ['Antoine Semenyo', 79], ['Iliman Ndiaye', 79], ['Elliot Anderson', 78]]],
    ['man-united', 'Manchester United', 'MUN', '#DA291C', '#FBE122', ['Senne Lammens', 80], [['Bruno Fernandes', 88], ['Bryan Mbeumo', 84], ['Youri Tielemans', 84], ['Matheus Cunha', 80], ['Benjamin Šeško', 79], ['Amad Diallo', 78], ['Carlos Baleba', 74]]],
    ['newcastle', 'Newcastle United', 'NEW', '#241F20', '#FFFFFF', ['Nick Pope', 82], [['Yoane Wissa', 80], ['Harvey Barnes', 78], ['Nico González', 76], ['Anthony Elanga', 76], ['Jacob Murphy', 76], ['Joelinton', 75], ['Bazoumana Touré', 75]]],
    ['nottm-forest', 'Nottingham Forest', 'NFO', '#DD0000', '#FFFFFF', ['Matz Sels', 82], [['Chris Wood', 85], ['Morgan Gibbs-White', 80], ['Liam Delap', 78], ['Callum Hudson-Odoi', 77], ['Dan Ndoye', 77], ['Igor Jesus', 77], ['Nicolás Domínguez', 74]]],
    ['sunderland', 'Sunderland', 'SUN', '#EB172B', '#FFFFFF', ['Robin Roefs', 80], [['Granit Xhaka', 81], ['Enzo Le Fée', 80], ['Wilson Isidor', 79], ['Brian Brobbey', 78], ['Chemsdine Talbi', 76], ['Malick Fofana', 76], ['Habib Diarra', 75]]],
    ['tottenham', 'Tottenham Hotspur', 'TOT', '#FFFFFF', '#132257', ['Antonín Kinský', 79], [['James Maddison', 84], ['Dominic Solanke', 82], ['Omar Marmoush', 81], ['Sandro Tonali', 80], ['Xavi Simons', 80], ['Mohammed Kudus', 79], ['Savinho', 78]]]
  ];

  const LALIGA = [
    ['alaves', 'Alavés', 'ALA', '#0761AF', '#FFFFFF', ['Antonio Sivera', 77], [['Toni Martínez', 79], ['Lucas Boyé', 77], ['Carlos Vicente', 76], ['Abde Rebbach', 75], ['Antonio Blanco', 74], ['Pablo Ibáñez', 73], ['Miguel Rodríguez', 73]]],
    ['athletic', 'Athletic Club', 'ATH', '#EE2523', '#FFFFFF', ['Unai Simón', 85], [['Oihan Sancet', 81], ['Nico Williams', 80], ['Iñaki Williams', 80], ['Gorka Guruzeta', 80], ['Álex Berenguer', 78], ['Robert Navarro', 76], ['Mikel Jauregizar', 74]]],
    ['atletico', 'Atlético Madrid', 'ATM', '#CB3524', '#FFFFFF', ['Jan Oblak', 87], [['Julián Álvarez', 87], ['Alexander Sørloth', 82], ['Jonathan David', 82], ['Álex Baena', 79], ['Lee Kang-in', 79], ['Koke', 78], ['Giuliano Simeone', 76]]],
    ['barcelona', 'Barcelona', 'BAR', '#A50044', '#004D98', ['Joan García', 85], [['Lamine Yamal', 84], ['Raphinha', 83], ['Dani Olmo', 82], ['Pedri', 80], ['Rodri', 80], ['Anthony Gordon', 79], ['Gabriel Jesus', 78]]],
    ['betis', 'Real Betis', 'BET', '#0BB363', '#FFFFFF', ['Álvaro Vallés', 78], [['Isco', 85], ['Giovani Lo Celso', 83], ['Cucho Hernández', 80], ['Antony', 79], ['Troy Parrott', 77], ['Pablo Fornals', 77], ['Abde Ezzalzouli', 76]]],
    ['celta', 'Celta Vigo', 'CEL', '#8AC3EE', '#C8102E', ['Ionuț Radu', 77], [['Iago Aspas', 88], ['Borja Iglesias', 84], ['Ferran Jutglà', 77], ['Williot Swedberg', 76], ['Pablo Durán', 75], ['Hugo Álvarez', 75], ['Ilaix Moriba', 74]]],
    ['deportivo', 'Deportivo La Coruña', 'DEP', '#005BAC', '#FFFFFF', ['Leo Román', 77], [['Pierre-Emerick Aubameyang', 82], ['Yeremay Hernández', 80], ['Mario Soriano', 77], ['Zakaria Eddahchouri', 76], ['Diego Villares', 73], ['Jonathan Asp Jensen', 73], ['Adama Traoré', 72]]],
    ['elche', 'Elche', 'ELC', '#05642C', '#FFFFFF', ['Matías Dituro', 77], [['Rafa Mir', 79], ['Thomas Lemar', 77], ['Germán Valera', 75], ['Facundo Buonanotte', 75], ['Josan', 74], ['Gonzalo Villar', 74], ['Marc Aguado', 73]]],
    ['espanyol', 'Espanyol', 'ESP', '#007FC8', '#FFFFFF', ['Marko Dmitrović', 80], [['Javi Puado', 82], ['Pere Milla', 78], ['Roberto Fernández', 77], ['Kike García', 77], ['Edu Expósito', 77], ['Bryan Zaragoza', 75], ['Tyrhys Dolan', 75]]],
    ['getafe', 'Getafe', 'GET', '#005999', '#FFFFFF', ['David Soria', 80], [['Borja Mayoral', 80], ['Enes Ünal', 79], ['Juanmi', 76], ['Martín Satriano', 74], ['Nemanja Gudelj', 74], ['Ramon Terrats', 73], ['Mario Martín', 72]]],
    ['levante', 'Levante', 'LEV', '#004C9B', '#A50044', ['Mathew Ryan', 79], [['Carlos Álvarez', 77], ['Iván Romero', 76], ['Roger Brugué', 75], ['Petar Ratkov', 74], ['Jon Ander Olasagasti', 74], ['Yanis Musayi', 72], ['Unai Elgezabal', 70]]],
    ['malaga', 'Málaga', 'MAL', '#5AB4E5', '#FFFFFF', ['Alfonso Herrero', 76], [['David Larrubia', 76], ['Joaquín Muñoz', 75], ['Chupe', 75], ['Dani Lorenzo', 74], ['Eneko Jauregi', 74], ['Haitam Abaida', 73], ['Pablo Martínez', 73]]],
    ['osasuna', 'Osasuna', 'OSA', '#D91A21', '#0A346F', ['Sergio Herrera', 80], [['Ante Budimir', 84], ['Aimar Oroz', 77], ['Rubén García', 77], ['Moi Gómez', 77], ['Raúl García', 76], ['Jonathan Dubasin', 75], ['Lucas Torró', 74]]],
    ['racing', 'Racing Santander', 'RAC', '#00843D', '#FFFFFF', ['Jokin Ezkieta', 75], [['Sergio Canales', 82], ['Andrés Martín', 79], ['Íñigo Vicente', 79], ['Juan Carlos Arana', 75], ['Asier Villalibre', 74], ['Maguette Gueye', 73], ['Iker Luque', 72]]],
    ['rayo', 'Rayo Vallecano', 'RAY', '#FFFFFF', '#E53027', ['Augusto Batalla', 78], [['Isi Palazón', 81], ['Jorge de Frutos', 77], ['Unai López', 77], ['Álvaro García', 76], ['Sergio Camello', 76], ['Alemão', 75], ['Pedro Díaz', 75]]],
    ['real-madrid', 'Real Madrid', 'RMA', '#FFFFFF', '#FEBE10', ['Thibaut Courtois', 89], [['Kylian Mbappé', 90], ['Jude Bellingham', 84], ['Federico Valverde', 83], ['Vinícius Júnior', 82], ['Bernardo Silva', 82], ['Arda Güler', 81], ['Yan Diomande', 78]]],
    ['real-sociedad', 'Real Sociedad', 'RSO', '#0067B1', '#FFFFFF', ['Álex Remiro', 82], [['Mikel Oyarzabal', 87], ['Takefusa Kubo', 80], ['Sergio Gómez', 78], ['Ander Barrenetxea', 77], ['Orri Óskarsson', 77], ['Gonçalo Guedes', 77], ['Pablo Marín', 74]]],
    ['sevilla', 'Sevilla', 'SEV', '#FFFFFF', '#D81E05', ['Odysseas Vlachodimos', 77], [['Rubén Vargas', 77], ['Isaac Romero', 76], ['Chidera Ejuke', 75], ['Youssouf Fofana', 74], ['Peque', 74], ['Lucien Agoumé', 72], ['Robbie Ure', 71]]],
    ['valencia', 'Valencia', 'VAL', '#FFFFFF', '#EE3524', ['Stole Dimitrievski', 77], [['Hugo Duro', 79], ['Harvey Elliott', 78], ['Arnaut Danjuma', 77], ['Luis Rioja', 76], ['Javi Guerra', 76], ['Diego López', 76], ['Ryunosuke Sato', 72]]],
    ['villarreal', 'Villarreal', 'VIL', '#FFE667', '#005187', ['Luiz Júnior', 80], [['Gerard Moreno', 86], ['Dani Parejo', 85], ['Ayoze Pérez', 81], ['Georges Mikautadze', 79], ['Nicolas Pépé', 79], ['Santi Comesaña', 74], ['Tajon Buchanan', 74]]]
  ];

  const BUNDESLIGA = [
    ['bayern', 'Bayern München', 'FCB', '#DC052D', '#FFFFFF', ['Manuel Neuer', 85], [['Harry Kane', 92], ['Michael Olise', 83], ['Jamal Musiala', 82], ['Joshua Kimmich', 82], ['Luis Díaz', 80], ['Serge Gnabry', 79], ['Ismael Saibari', 77]]],
    ['dortmund', 'Borussia Dortmund', 'BVB', '#FDE100', '#111111', ['Gregor Kobel', 85], [['Serhou Guirassy', 87], ['Julian Brandt', 80], ['Marcel Sabitzer', 79], ['Maximilian Beier', 77], ['Ethan Nwaneri', 76], ['Felix Nmecha', 75], ['Konstantinos Karetsas', 74]]],
    ['leverkusen', 'Bayer Leverkusen', 'B04', '#E32221', '#111111', ['Mark Flekken', 80], [['Patrik Schick', 84], ['Exequiel Palacios', 80], ['Malik Tillman', 78], ['Moussa Diaby', 77], ['Ibrahim Maza', 75], ['Ernest Poku', 74], ['Christian Kofane', 74]]],
    ['leipzig', 'RB Leipzig', 'RBL', '#FFFFFF', '#DD0741', ['Maarten Vandevoordt', 79], [['Christoph Baumgartner', 79], ['David Raum', 79], ['Rômulo', 76], ['Antonio Nusa', 75], ['Johan Bakayoko', 75], ['Marc Guiu', 74], ['Assan Ouédraogo', 74]]],
    ['frankfurt', 'Eintracht Frankfurt', 'SGE', '#E1000F', '#111111', ['Noah Atubolu', 80], [['Jonathan Burkardt', 81], ['Mario Götze', 80], ['Can Uzun', 79], ['Ritsu Dōan', 77], ['Farès Chaïbi', 76], ['Elye Wahi', 75], ['Ansgar Knauff', 74]]],
    ['stuttgart', 'VfB Stuttgart', 'VFB', '#FFFFFF', '#E32219', ['Alexander Nübel', 81], [['Deniz Undav', 82], ['Ermedin Demirović', 81], ['Angelo Stiller', 78], ['Chris Führich', 77], ['Bilal El Khannouss', 77], ['Jamie Leweling', 76], ['Dženan Pejčinović', 74]]],
    ['freiburg', 'SC Freiburg', 'SCF', '#E2001A', '#111111', ['Florian Müller', 76], [['Vincenzo Grifo', 89], ['Lucas Höler', 77], ['Igor Matanović', 76], ['Yuito Suzuki', 76], ['Junior Adamu', 75], ['Maximilian Eggestein', 75], ['Derry Scherhant', 73]]],
    ['mainz', 'Mainz 05', 'M05', '#C3141E', '#FFFFFF', ['Robin Zentner', 77], [['Nadiem Amiri', 82], ['Jae-sung Lee', 77], ['Paul Nebel', 76], ['Benedict Hollerbach', 75], ['Sheraldo Becker', 74], ['Armindo Sieb', 74], ['Kaishu Sano', 72]]],
    ['hoffenheim', 'TSG Hoffenheim', 'TSG', '#1961B5', '#FFFFFF', ['Oliver Baumann', 81], [['Andrej Kramarić', 85], ['Fisnik Asllani', 77], ['Tim Lemperle', 76], ['Ihlas Bebou', 75], ['Grischa Prömel', 75], ['Wouter Burger', 74], ['Max Moerstedt', 72]]],
    ['gladbach', 'Borussia Mönchengladbach', 'BMG', '#FFFFFF', '#111111', ['Moritz Nicolas', 78], [['Tim Kleindienst', 81], ['Kevin Stöger', 80], ['Nicolas Kühn', 78], ['Franck Honorat', 76], ['Haris Tabaković', 76], ['Rocco Reitz', 75], ['Robin Hack', 75]]],
    ['werder', 'Werder Bremen', 'SVW', '#1D9053', '#FFFFFF', ['Mio Backhaus', 77], [['Victor Boniface', 79], ['Romano Schmid', 78], ['Marco Grüll', 76], ['Jens Stage', 76], ['Justin Njinmah', 74], ['Samuel Mbangula', 74], ['Senne Lynen', 73]]],
    ['augsburg', 'FC Augsburg', 'FCA', '#BA3733', '#46714D', ['Finn Dahmen', 77], [['Alexis Claude-Maurice', 77], ['Fabian Rieder', 77], ['Phillip Tietz', 76], ['Michael Gregoritsch', 76], ['Elvis Rexhbeçaj', 74], ['Arijon Ibrahimović', 74], ['Mert Kömür', 72]]],
    ['union', 'Union Berlin', 'FCU', '#EB1923', '#FFFFFF', ['Frederik Rønnow', 78], [['Andrej Ilić', 75], ['Ilyas Ansah', 74], ['Rani Khedira', 74], ['Oliver Burke', 74], ['Tim Skarke', 73], ['Kastriot Imeri', 73], ['Leopold Querfeld', 70]]],
    ['koln', '1. FC Köln', 'KOE', '#FFFFFF', '#ED1C24', ['Marvin Schwäbe', 77], [['Florian Kainz', 79], ['Said El Mala', 77], ['Marius Bülter', 77], ['Jakub Kamiński', 76], ['Ragnar Ache', 76], ['Linton Maina', 74], ['Mikey Moore', 73]]],
    ['hamburg', 'Hamburger SV', 'HSV', '#FFFFFF', '#0A3F86', ['Daniel Heuer Fernandes', 77], [['Yussuf Poulsen', 77], ['Robert Glatzel', 77], ['Fábio Vieira', 77], ['Jean-Luc Dompé', 76], ['Rayan Philippe', 74], ['Ransford Königsdörffer', 74], ['Albert Sambi Lokonga', 73]]],
    ['schalke', 'Schalke 04', 'S04', '#004D9D', '#FFFFFF', ['Loris Karius', 75], [['Edin Džeko', 81], ['Kenan Karaman', 78], ['Moussa Sylla', 77], ['Robin Gosens', 76], ['Hwang Hee-chan', 75], ['Christopher Antwi-Adjei', 72], ['Soufiane El-Faouzi', 72]]],
    ['elversberg', 'SV Elversberg', 'SVE', '#1A1A1A', '#FFFFFF', ['Nicolas Kristof', 74], [['Bambasé Conté', 74], ['Younes Ebnoutalib', 74], ['Muhammed Damar', 74], ['Lukas Petkov', 73], ['Tom Zimmerschied', 72], ['Robin Fellhauer', 72], ['Luca Schnellbacher', 72]]],
    ['paderborn', 'SC Paderborn', 'SCP', '#0054A6', '#111111', ['Dennis Seimen', 74], [['Filip Bilbija', 75], ['Sven Michel', 74], ['Raphael Obermair', 73], ['Mattes Hansen', 72], ['Santiago Castañeda', 72], ['Stefano Marino', 72], ['Laurin Curda', 71]]]
  ];

  const SERIEA = [
    ['atalanta', 'Atalanta', 'ATA', '#1E71B8', '#111111', ['Marco Carnesecchi', 82], [['Gianluca Scamacca', 80], ['Ademola Lookman', 80], ['Mario Pašalić', 80], ['Charles De Ketelaere', 79], ['Nikola Krstović', 79], ['Gianluca Gaetano', 77], ['Kamaldeen Sulemana', 73]]],
    ['bologna', 'Bologna', 'BOL', '#A21C26', '#1A2F48', ['Łukasz Skorupski', 80], [['Riccardo Orsolini', 83], ['Lewis Ferguson', 78], ['Federico Bernardeschi', 78], ['Santiago Castro', 77], ['Thijs Dallinga', 76], ['Jens Odgaard', 76], ['Remo Freuler', 75]]],
    ['cagliari', 'Cagliari', 'CAG', '#A51E36', '#002350', ['Elia Caprile', 79], [['Andrea Belotti', 78], ['Sebastiano Esposito', 77], ['Leonardo Pavoletti', 76], ['Harry Winks', 75], ['Daniel Maldini', 75], ['Mattia Felici', 72], ['Michel Adopo', 72]]],
    ['como', 'Como', 'COM', '#00599C', '#FFFFFF', ['Jean Butez', 80], [['Nico Paz', 84], ['Álvaro Morata', 80], ['Luis Milla', 77], ['Assane Diao', 76], ['Lucas Da Cunha', 76], ['Jesús Rodríguez', 75], ['Máximo Perrone', 74]]],
    ['fiorentina', 'Fiorentina', 'FIO', '#482E92', '#FFFFFF', ['David de Gea', 84], [['Albert Guðmundsson', 84], ['Moise Kean', 82], ['Rolando Mandragora', 80], ['Franco Mastantuono', 77], ['Beto', 75], ['Arthur Atta', 74], ['João Mário', 72]]],
    ['frosinone', 'Frosinone', 'FRO', '#FFDD00', '#0055A4', ['Michele Cerofolini', 74], [['Riccardo Calò', 75], ['Farès Ghedjemis', 74], ['Giorgi Kvernadze', 74], ['Antonio Raimondo', 73], ['Alphadjo Cissè', 72], ['Ilias Koutsoupias', 72], ['Jérémy Oyono', 70]]],
    ['genoa', 'Genoa', 'GEN', '#A6192E', '#0D2240', ['Justin Bijlow', 77], [['Ruslan Malinovskyi', 82], ['Junior Messias', 78], ['Lorenzo Colombo', 77], ['Djibril Sow', 75], ['Hamed Traorè', 75], ['Vitinha', 75], ['Morten Frendrup', 73]]],
    ['inter', 'Inter', 'INT', '#0068A8', '#111111', ['Josep Martínez', 81], [['Hakan Çalhanoğlu', 90], ['Lautaro Martínez', 86], ['Piotr Zieliński', 83], ['Marcus Thuram', 81], ['Nicolò Barella', 79], ['Francesco Pio Esposito', 77], ['Curtis Jones', 76]]],
    ['juventus', 'Juventus', 'JUV', '#FFFFFF', '#111111', ['Guglielmo Vicario', 82], [['Dušan Vlahović', 84], ['Teun Koopmeiners', 81], ['Kenan Yıldız', 80], ['Manuel Locatelli', 80], ['Randal Kolo Muani', 79], ['Nick Woltemade', 78], ['Francisco Conceição', 77]]],
    ['lazio', 'Lazio', 'LAZ', '#87D8F7', '#0B2341', ['Christos Mandas', 79], [['Pedro', 82], ['Mattia Zaccagni', 81], ['Valentín Castellanos', 78], ['Davide Frattesi', 76], ['Matteo Guendouzi', 76], ['Tijjani Noslin', 75], ['Gustav Isaksen', 75]]],
    ['lecce', 'Lecce', 'LEC', '#FFD700', '#DA291C', ['Wladimiro Falcone', 80], [['Riccardo Sottil', 75], ['Nikola Štulić', 74], ['Lameck Banda', 74], ['Francesco Camarda', 74], ['Santiago Pierotti', 73], ['Ylber Ramadani', 73], ['Medon Berisha', 72]]],
    ['milan', 'AC Milan', 'MIL', '#FB090B', '#111111', ['Mike Maignan', 87], [['Christian Pulisic', 82], ['Christopher Nkunku', 82], ['Santiago Giménez', 81], ['Gonçalo Ramos', 80], ['Rafael Leão', 79], ['Adrien Rabiot', 77], ['Ruben Loftus-Cheek', 77]]],
    ['monza', 'Monza', 'MON', '#E2001A', '#FFFFFF', ['Demba Thiam', 74], [['Matteo Pessina', 79], ['Andrea Petagna', 78], ['Gianluca Caprari', 77], ['Dany Mota', 76], ['Patrick Ciurria', 74], ['Keita Baldé', 74], ['Ebenezer Akinsanmiro', 72]]],
    ['napoli', 'Napoli', 'NAP', '#12A0D7', '#FFFFFF', ['Vanja Milinković-Savić', 81], [['Kevin De Bruyne', 85], ['Scott McTominay', 80], ['Matteo Politano', 79], ['David Neres', 77], ['Noa Lang', 77], ['Lorenzo Lucca', 76], ['Alisson Santos', 74]]],
    ['parma', 'Parma', 'PAR', '#FFD200', '#1C4E9C', ['Edoardo Corvi', 75], [['Patrick Cutrone', 77], ['Mateo Pellegrino', 77], ['Adrián Bernabé', 77], ['Hernani', 74], ['Matija Frigan', 74], ['Enrico Delprato', 72], ['Mandela Keita', 72]]],
    ['roma', 'AS Roma', 'ROM', '#8E1F2F', '#F0BC42', ['Mile Svilar', 85], [['Paulo Dybala', 84], ['Artem Dovbyk', 80], ['Lorenzo Pellegrini', 80], ['Matías Soulé', 78], ['Evan Ferguson', 76], ['Bryan Cristante', 76], ['Manu Koné', 74]]],
    ['sassuolo', 'Sassuolo', 'SAS', '#00A752', '#111111', ['Arijanet Muric', 77], [['Domenico Berardi', 88], ['Andrea Pinamonti', 78], ['Armand Laurienté', 77], ['Nemanja Matić', 76], ['Kristian Thorstvedt', 75], ['Cristian Volpato', 74], ['Luca Lipani', 72]]],
    ['torino', 'Torino', 'TOR', '#8A1E03', '#FFFFFF', ['Franco Israel', 76], [['Duván Zapata', 80], ['Nikola Vlašić', 80], ['Ché Adams', 79], ['Giovanni Simeone', 77], ['Ivan Ilić', 75], ['Cyril Ngonge', 75], ['Gvidas Gineitis', 72]]],
    ['udinese', 'Udinese', 'UDI', '#FFFFFF', '#1A1A1A', ['Maduka Okoye', 78], [['Keinan Davis', 77], ['Nicolò Zaniolo', 77], ['Adam Buksa', 75], ['Jakub Piotrowski', 74], ['Oier Zarraga', 74], ['Unai Gómez', 74], ['Jesper Karlström', 72]]],
    ['venezia', 'Venezia', 'VEN', '#F26522', '#00502F', ['Filip Stanković', 76], [['Joel Pohjanpalo', 81], ['Akor Adams', 76], ['Andrea Adorante', 74], ['Gianluca Busio', 74], ['Toma Bašić', 73], ['Issa Doumbia', 72], ['Mikael Ellertsson', 72]]]
  ];

  function build(id, name, short, rows) {
    return {
      id, name, short,
      clubs: rows.map(([cid, cname, abbr, c1, c2, gk, takers]) => ({
        id: cid, league: id, name: cname, short: abbr, c1, c2,
        gk: { name: gk[0], rating: gk[1] },
        takers: takers.map(([n, r]) => ({ name: n, pen: r }))
      }))
    };
  }

  const LEAGUES = [
    build('epl', 'Ngoại hạng Anh', 'Premier League', EPL),
    build('laliga', 'La Liga', 'LaLiga', LALIGA),
    build('bundesliga', 'Bundesliga', 'Bundesliga', BUNDESLIGA),
    build('seriea', 'Serie A', 'Serie A', SERIEA)
  ];
  const CLUBS = {};
  LEAGUES.forEach((l) => l.clubs.forEach((c) => { CLUBS[c.id] = c; }));

  return { SEASON: '2026/27', LEAGUES, CLUBS };
});
