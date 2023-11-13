var db = new Dexie("Hearthstone");

/*
ignore set: HERO_SKINS,TB(dungeon),LETTUCE(Merc),BATTLEGROUNDS,BASIC,CREDITS,MISSIONS,TAVERNS_OF_TIME
CORE
EXPERT1
VANILLA
LEGACY
PLACEHOLDER_202204

modify:
	cardClass -> classes //Handle Multiclass neutral

"string": [
	"id",
	"name",
	"text", "collectionText",
	**"cardClass", "multiClassGroup",

	"type",	//SPELL,MINION,WEAPON,HERO,LOCATION
	"set",
	"rarity", //COMMON,RARE,EPIC,LEGENDARY,FREE
	**"race",
	"spellSchool",	//FIRE,ARCANE,HOLY,SHADOW,FEL,NATURE,FROST    

	"artist", "flavor",
	"howToEarn", "howToEarnGolden",
	"targetingArrowText", "faction", "questReward"
],
"boolean": [
	"collectible", "hideStats", "hasDiamondSkin", "isMiniSet", "elite" // LEGENDARY?
],
"number": [
	"cost", "attack", "health",
	"armor", "durability", "overload", "spellDamage",
	"dbfId", "battlegroundsPremiumDbfId", "heroPowerDbfId", "techLevel"    
],
"Array": [
	"mechanics", "referencedTags",
	**"races", "classes"
]
*/


db.version(1).stores({
  cards:"id,dbfId,name,text,flavor,artist,attack,cardClass,collectible,cost,elite,faction,health,*mechanics,rarity,set,type"
});


const url_cards = "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json";
//const url_cards = "https://api.hearthstonejson.com/v1/latest/enUS/cards.json";
const url = "https://api.hearthstonejson.com/v1/latest/";


db.on('ready', async (tx) => {		
  return tx.cards.count(count => {
		return getData(count, localStorage.version)
			.then(data => data && db.cards.bulkAdd(data));
	})
})
 
async function getData(count, current){
	const version = await fetch(url).then(i => i.url);
	
	if(count > 0 && version === current)
		return console.log('Upto Date',version);

	console.log('fetch')
	const data = await fetch(url_cards).then(i => i.json());
	
	
	const cleanText = (text) => text?.trim()
		.replace(/\s|\n/g,' ')
		.replace(/\s\s+/g, ' ')
		.replace(/’/g, "'");
		
	
	return data.map(obj => ({...obj, text: cleanText(obj.text)}));
}

function isVersionOld(day = 2){
	let diff = Date.now() - localStorage.date;
	
	return diff / (24*60*60*1000) > day;
}


