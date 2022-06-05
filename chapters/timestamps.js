const timestampText = `(00:00:00) Intro: Wolfgangs Auto, Entlastungspaket in Deutschland
(00:02:30) Heutiges Thema: NoSQL Datenbanken und CO2-Einsparung durch Datenbank-Optimierungen
(00:06:27) Was ist anders zur Episode 19 (Datenbanken) und ist NoSQL überhaupt noch ein Thema?
(00:07:46) Was verstehen wir unter dem Begriff NoSQL und woher kommt es eigentlich?
(00:15:05) Tip: Für Side Projects besser vertikal anstatt horizontal skalieren
(00:15:57) NoSQL: Speziellere Lösungen mit Fokus auf Einfachheit und Benutzerfreundlichkeit
(00:17:45) Braucht man heute noch Datenbank-Administratoren (DBA)?
(00:20:20) Der Job des klassischen System-Administrator ist weiterhin relevant
(00:22:22) Gibt es wirklich keine Datenbank-Schemas in der NoSQL-Welt?
(00:26:30) Schema-Lose Möglichkeit in relationalen Datenbanken und Arbeit in die Datenbank oder Software auslagern
(00:30:00) NoSQL hat die ACID-Properties aufgeweicht und warum ACID nachteilig für die Skalierung ist
(00:32:35) Das NoSQL BASE Akronym
(00:35:22) Der Client muss die Datenbank ordentlich nuzten um ACID-Garantien zu bekommen
(00:40:42) Was bedeutet eigentlich NoSQL? Kein SQL? Not Only SQL?
(00:42:45) Haupt-Speicher Datenbanken und was SAP damit zu tun hat
(00:47:09) Was ist Neo4J für eine Datenbank und welcher Use-Case kann damit abgedeckt werden?
(00:49:56) Was ist M3 für eine Datenbank und welcher Use-Case kann damit abgedeckt werden?
(00:52:13) Was ist Cassandra für eine Datenbank und welcher Use-Case kann damit abgedeckt werden?
(00:53:27) Was ist Memcached für eine Datenbank und welcher Use-Case kann damit abgedeckt werden?
(00:57:51) Outro`;

const secondsToAdd = 20
const newIntroText = "Intro"

const timestampLines = timestampText.split(/\r?\n/)
const timestamps = timestampLines.map(line => {
  //separate the time and text of the line
  const matches = line.match(/(\([0-9]{2}:[0-9]{2}:[0-9]{2}\))(.*)/)
  // get rid of the () around the time
  const timeString = matches[1].replace("(","").replace(")","")
  // add the secondsToAdd
  const newTime = new Date(Date.parse("2020-01-01 "+timeString)+1000*secondsToAdd)
  // generate the new calculated time string
  const newTimeString = newTime.toTimeString().substring(0,8)
  return [newTimeString,matches[2]]
})

// add a new start which starts at 0 tp be consistent
if (secondsToAdd > 0) {
  timestamps.unshift(["00:00:00"," "+newIntroText])
}

console.log("---- For mp3chaps ----")
console.log(timestamps.map(x => x[0]+x[1]).join('\n'))
console.log("---- For Shownotes ----")
console.log(timestamps.map(x => `(${x[0]})${x[1]}`).join('\n'))